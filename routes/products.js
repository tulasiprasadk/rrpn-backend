import express from "express";
import { Op } from "sequelize";

const router = express.Router();

// Cache models to avoid re-importing
let Product, Category;
let modelsLoaded = false;

// Simple function to get models - no blocking
async function getModels() {
  if (!modelsLoaded) {
    try {
      const db = await import("../config/database.js");
      Product = db.models.Product;
      Category = db.models.Category;
      modelsLoaded = true;
      console.log("✅ Models loaded");
    } catch (err) {
      console.error("❌ Failed to load models:", err);
      throw err;
    }
  }
  return { Product, Category };
}

/* =====================================================
   GET /api/products
   - Public: approved products only
   - Supports categoryId + global search (q)
   - SERVERLESS-SAFE: Always responds within 5 seconds
===================================================== */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  console.log("➡ /api/products called", req.query);
  
  // CRITICAL: Set a global timeout that ALWAYS responds
  // If we don't respond within 4 seconds, return empty array
  const globalTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.warn("⚠️ Global timeout - returning empty array");
      res.status(200).json([]);
    }
  }, 4000);
  
  try {
    const { categoryId, q } = req.query;
    
    // Build where clause
    const where = {
      status: { [Op.in]: ["approved", "active"] },
    };

    if (categoryId) {
      where.CategoryId = Number(categoryId);
      console.log("📦 Fetching products for category:", categoryId);
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { variety: { [Op.iLike]: `%${q}%` } },
        { subVariety: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
      console.log("🔍 Searching for:", q);
    }

    // Load models with aggressive 1s timeout
    console.log("📚 Loading models...");
    let models;
    try {
      models = await Promise.race([
        getModels(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Model load timeout")), 1000)
        )
      ]);
    } catch (modelErr) {
      console.error("❌ Model load failed:", modelErr.message);
      clearTimeout(globalTimeout);
      return res.status(200).json([]);
    }
    
    if (!models.Product || !models.Category) {
      console.error("❌ Models not available");
      clearTimeout(globalTimeout);
      return res.status(200).json([]);
    }

    // Execute query with aggressive 2s timeout
    console.log("🔍 Executing query...");
    let products;
    try {
      products = await Promise.race([
        models.Product.findAll({
          where,
          include: [
            {
              model: models.Category,
              attributes: ["id", "name", "icon", "titleKannada", "kn", "knDisplay"],
              required: false,
            },
          ],
          order: [["id", "DESC"]],
          limit: 100,
          attributes: {
            include: ['id', 'title', 'name', 'titleKannada', 'kn', 'knDisplay', 'description', 'descriptionKannada', 'price', 'variety', 'subVariety', 'image', 'imageUrl', 'image_url', 'CategoryId']
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Query timeout")), 2000)
        )
      ]);
    } catch (queryErr) {
      console.error("❌ Query failed:", queryErr.message);
      clearTimeout(globalTimeout);
      return res.status(200).json([]);
    }

    // Transform products
    const productsWithBasePrice = products.map((p) => {
      const obj = p.toJSON();
      obj.basePrice = obj.price;
      if (!obj.knDisplay && obj.titleKannada) {
        obj.knDisplay = obj.titleKannada;
      }
      if (!obj.kn && obj.titleKannada) {
        obj.kn = obj.titleKannada;
      }
      return obj;
    });

    clearTimeout(globalTimeout);
    console.log("✅ Products fetched:", productsWithBasePrice.length, "in", Date.now() - startTime, "ms");
    
    // CRITICAL: Always return response
    if (!res.headersSent) {
      return res.json(productsWithBasePrice);
    }
    
  } catch (err) {
    clearTimeout(globalTimeout);
    console.error("❌ /api/products error:", err.message);
    console.error("❌ Error details:", {
      name: err.name,
      code: err.code,
      time: Date.now() - startTime
    });
    
    // CRITICAL: Always return response, even on error
    if (!res.headersSent) {
      return res.status(200).json([]);
    }
  }
});

/* =====================================================
   GET /api/products/health
===================================================== */
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* =====================================================
   POST /api/products/bulk
===================================================== */
router.post("/bulk", async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "products array required" });
    }

    const models = await getModels();
    if (!models.Category) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const categories = await models.Category.findAll({
      attributes: ["id", "name"],
    });

    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.name.toLowerCase()] = c.id;
    });

    const validProducts = [];
    const errorDetails = [];

    products.forEach((p, index) => {
      const row = index + 1;
      try {
        if (!p.title) {
          throw new Error("Missing title");
        }

        let categoryId = p.CategoryId;
        if (!categoryId && p.categoryName) {
          categoryId = categoryMap[p.categoryName.toLowerCase()];
        }

        if (!categoryId) {
          throw new Error("Missing or invalid CategoryId");
        }

        validProducts.push({
          title: p.title,
          variety: p.variety || null,
          subVariety: p.subVariety || null,
          price: Number(p.price) || 0,
          unit: p.unit || null,
          description: p.description || null,
          CategoryId: categoryId,
          status: "approved",
        });
      } catch (e) {
        errorDetails.push(`Row ${row}: ${e.message}`);
      }
    });

    if (validProducts.some((p) => !p.CategoryId)) {
      return res.status(400).json({
        error: "Validation failed: CategoryId cannot be null",
      });
    }

    await models.Product.bulkCreate(validProducts);

    res.json({
      success: true,
      created: validProducts.length,
      errors: errorDetails.length,
      errorDetails,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

export default router;
