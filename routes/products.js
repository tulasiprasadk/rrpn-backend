import express from "express";

const router = express.Router();

// Cache models to avoid re-importing
let Product, Category;
let modelsLoaded = false;
let modelsLoading = false;
let Op = null;

// Lazy load Sequelize Op - don't import at top level
async function getOp() {
  if (!Op) {
    const sequelize = await import("sequelize");
    Op = sequelize.Op;
  }
  return Op;
}

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
   GET /api/products/test
   - Test endpoint to verify route is being hit
===================================================== */
router.get("/test", (req, res) => {
  console.log("[PRODUCTS] ✅ /api/products/test called - route is working!");
  res.json({ ok: true, message: "Products route is accessible", timestamp: new Date().toISOString() });
});

/* =====================================================
   GET /api/products/instant
   - Returns empty array immediately - NO database, NO async
   - Use this to test if route handler is being invoked
===================================================== */
router.get("/instant", (req, res) => {
  console.log("[PRODUCTS] ✅ /api/products/instant called - instant response");
  res.json([]);
});

/* =====================================================
   GET /api/products
   - SERVERLESS-SAFE: Always responds within 1 second
   - Returns empty array if DB is slow or unavailable
===================================================== */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  console.log("[PRODUCTS] ➡ /api/products called", req.query);
  console.log("[PRODUCTS] Request details:", {
    method: req.method,
    path: req.path,
    url: req.url,
    query: req.query
  });
  
  // CRITICAL: Set timeout that ALWAYS responds after 1 second
  let responded = false;
  const forceResponse = setTimeout(() => {
    if (!responded && !res.headersSent) {
      responded = true;
      console.warn("[PRODUCTS] ⚠️ Force timeout (1s) - returning empty array");
      try {
        res.status(200).json([]);
      } catch (e) {
        console.error("[PRODUCTS] Failed to send timeout response:", e);
      }
    }
  }, 1000); // 1 second - ultra aggressive
  
  const sendResponse = (data) => {
    if (!responded && !res.headersSent) {
      responded = true;
      clearTimeout(forceResponse);
      res.status(200).json(data);
    }
  };
  
  try {
    const { categoryId, q } = req.query;
    
    // Lazy load Op
    const OpInstance = await getOp();
    
    // Build where clause
    const where = {
      status: { [OpInstance.in]: ["approved", "active"] },
    };

    if (categoryId) {
      where.CategoryId = Number(categoryId);
      console.log("[PRODUCTS] 📦 Category:", categoryId);
    }

    if (q) {
      where[OpInstance.or] = [
        { title: { [OpInstance.iLike]: `%${q}%` } },
        { variety: { [OpInstance.iLike]: `%${q}%` } },
        { subVariety: { [OpInstance.iLike]: `%${q}%` } },
        { description: { [OpInstance.iLike]: `%${q}%` } },
      ];
    }

    // Try to load models with 200ms timeout (ultra aggressive)
    console.log("[PRODUCTS] 📚 Loading models...");
    let models;
    try {
      models = await Promise.race([
        getModels(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Model load timeout")), 200)
        )
      ]);
    } catch (modelErr) {
      console.error("[PRODUCTS] ❌ Model load failed:", modelErr.message);
      sendResponse([]);
      return;
    }
    
    if (!models.Product || !models.Category) {
      console.error("[PRODUCTS] ❌ Models not available");
      sendResponse([]);
      return;
    }

    // Execute query with 500ms timeout (ultra aggressive)
    console.log("[PRODUCTS] 🔍 Executing query...");
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
          setTimeout(() => reject(new Error("Query timeout")), 500)
        )
      ]);
    } catch (queryErr) {
      console.error("[PRODUCTS] ❌ Query failed:", queryErr.message);
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

    console.log("[PRODUCTS] ✅ Products:", productsWithBasePrice.length, "in", Date.now() - startTime, "ms");
    sendResponse(productsWithBasePrice);
    
  } catch (err) {
    console.error("[PRODUCTS] ❌ /api/products error:", err.message);
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
