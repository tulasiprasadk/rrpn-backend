import express from "express";
import { Op } from "sequelize";

// Lazy load models to prevent blocking
let Product, Category;
let connectionChecked = false;

async function getModels() {
  if (!Product || !Category) {
    try {
      const { models, sequelize } = await import("../config/database.js");
      Product = models.Product;
      Category = models.Category;
      
      // Skip connection check - let queries connect on demand
      // Connection check was blocking and causing timeouts
      // Sequelize will connect automatically on first query
      console.log("✅ Models loaded (connection will happen on first query)");
    } catch (err) {
      console.error("Error loading models:", err);
      throw err;
    }
  }
  return { Product, Category };
}

const router = express.Router();

/* =====================================================
   GET /api/products
   - Public: approved products only
   - Supports categoryId + global search (q)
===================================================== */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  console.log('[PRODUCTS] Route called at', new Date().toISOString());
  console.log('[PRODUCTS] Query params:', req.query);
  
  // CRITICAL: Return immediately if we can't respond quickly
  // Use a single Promise.race for the entire operation
  const fastResponse = Promise.race([
    (async () => {
      try {
        // Load models with 2s timeout
        const models = await Promise.race([
          getModels(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Model load timeout")), 2000)
          )
        ]);
        
        if (!models.Product || !models.Category) {
          return [];
        }
        
        const { Product, Category } = models;
        const { categoryId, q } = req.query;

        const where = {
          status: { [Op.in]: ["approved", "active"] },
        };

        if (categoryId) {
          where.CategoryId = Number(categoryId);
        }

        if (q) {
          where[Op.or] = [
            { title: { [Op.iLike]: `%${q}%` } },
            { variety: { [Op.iLike]: `%${q}%` } },
            { subVariety: { [Op.iLike]: `%${q}%` } },
            { description: { [Op.iLike]: `%${q}%` } },
          ];
        }
        
        // Query with 3s timeout
        const products = await Promise.race([
          models.Product.findAll({
            where,
            include: [
              {
                model: Category,
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
            setTimeout(() => reject(new Error("Query timeout")), 3000)
          )
        ]);
        
        // Transform products
        return products.map((p) => {
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
      } catch (err) {
        console.error('[PRODUCTS] Error in fast response:', err.message);
        return []; // Return empty array on any error
      }
    })(),
    // Fallback: return empty array after 5 seconds total
    new Promise((resolve) => 
      setTimeout(() => {
        console.warn('[PRODUCTS] Total timeout - returning empty array');
        resolve([]);
      }, 5000)
    )
  ]);
  
  try {
    const products = await fastResponse;
    console.log('[PRODUCTS] Returning', products.length, 'products in', Date.now() - startTime, 'ms');
    
    // CRITICAL: Always send response
    if (!res.headersSent) {
      res.status(200).json(products);
    }
  } catch (err) {
    console.error('[PRODUCTS] Unexpected error:', err);
    // Last resort: always respond
    if (!res.headersSent) {
      res.status(200).json([]);
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
   - Strict CategoryId enforcement
   - Optional categoryName → categoryId mapping
   - Rejects bad rows, inserts valid ones
===================================================== */
router.post("/bulk", async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "products array required" });
    }

    // Load categories once (for name → id mapping)
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

        // Fallback: resolve from categoryName if provided
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
          status: "approved", // auto-approve
        });
      } catch (e) {
        errorDetails.push(`Row ${row}: ${e.message}`);
      }
    });

    // Final safety check
    if (validProducts.some((p) => !p.CategoryId)) {
      return res.status(400).json({
        error: "Validation failed: CategoryId cannot be null",
      });
    }

    // Bulk insert (fast + atomic)
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


/* =====================================================
   GET /api/products/:id
   - Public: fetch single approved product by ID
===================================================== */
// Removed duplicate GET / route and merge conflict artifacts

export default router;
