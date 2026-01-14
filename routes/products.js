import express from "express";
import { Op } from "sequelize";

const router = express.Router();

// Cache models to avoid re-importing
let Product, Category;
let modelsLoaded = false;
let modelsLoading = false;

// Simple function to get models - no blocking
async function getModels() {
  if (modelsLoading) {
    // If already loading, wait a bit then return cached or fail
    await new Promise(resolve => setTimeout(resolve, 100));
    if (modelsLoaded && Product && Category) {
      return { Product, Category };
    }
    throw new Error("Models still loading");
  }
  
  if (!modelsLoaded) {
    modelsLoading = true;
    try {
      const db = await import("../config/database.js");
      Product = db.models.Product;
      Category = db.models.Category;
      modelsLoaded = true;
      modelsLoading = false;
      console.log("✅ Models loaded");
    } catch (err) {
      modelsLoading = false;
      console.error("❌ Failed to load models:", err);
      throw err;
    }
  }
  return { Product, Category };
}

/* =====================================================
   GET /api/products
   - SERVERLESS-SAFE: Always responds within 3 seconds
   - Returns empty array if DB is slow
===================================================== */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  console.log("➡ /api/products called", req.query);
  
  // CRITICAL: Set timeout that ALWAYS responds after 3 seconds
  let responded = false;
  const forceResponse = setTimeout(() => {
    if (!responded && !res.headersSent) {
      responded = true;
      console.warn("⚠️ Force timeout - returning empty array");
      res.status(200).json([]);
    }
  }, 3000);
  
  const sendResponse = (data) => {
    if (!responded && !res.headersSent) {
      responded = true;
      clearTimeout(forceResponse);
      res.status(200).json(data);
    }
  };
  
  try {
    const { categoryId, q } = req.query;
    
    // Build where clause
    const where = {
      status: { [Op.in]: ["approved", "active"] },
    };

    if (categoryId) {
      where.CategoryId = Number(categoryId);
      console.log("📦 Category:", categoryId);
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { variety: { [Op.iLike]: `%${q}%` } },
        { subVariety: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // Try to load models with 500ms timeout
    console.log("📚 Loading models...");
    let models;
    try {
      models = await Promise.race([
        getModels(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Model load timeout")), 500)
        )
      ]);
    } catch (modelErr) {
      console.error("❌ Model load failed:", modelErr.message);
      sendResponse([]);
      return;
    }
    
    if (!models.Product || !models.Category) {
      console.error("❌ Models not available");
      sendResponse([]);
      return;
    }

    // Execute query with 2s timeout
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
      sendResponse([]);
      return;
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

    console.log("✅ Products:", productsWithBasePrice.length, "in", Date.now() - startTime, "ms");
    sendResponse(productsWithBasePrice);
    
  } catch (err) {
    console.error("❌ /api/products error:", err.message);
    sendResponse([]);
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
