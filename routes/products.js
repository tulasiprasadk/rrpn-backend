import express from "express";
import { Op } from "sequelize";

// Lazy load models to prevent blocking
let Product, Category;
async function getModels() {
  if (!Product || !Category) {
    try {
      const { models } = await import("../config/database.js");
      Product = models.Product;
      Category = models.Category;
    } catch (err) {
      console.error("Error loading models:", err);
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
  try {
    // Lazy load models
    const models = await getModels();
    if (!models.Product || !models.Category) {
      return res.status(503).json({ 
        error: "Database not available",
        message: "Database connection is not ready. Please try again later."
      });
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

    const products = await models.Product.findAll({
      where,
      include: [
        {
          model: Category,
          attributes: ["id", "name", "icon"],
        },
      ],
      order: [["id", "DESC"]],
    });

    // Add basePrice property for frontend compatibility
    const productsWithBasePrice = products.map((p) => {
      const obj = p.toJSON();
      obj.basePrice = obj.price;
      return obj;
    });

    res.json(productsWithBasePrice);
  } catch (err) {
    console.error("Error fetching products:", err);
    
    // Check if it's a database connection error
    if (err.name === 'SequelizeHostNotFoundError' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: "Database connection failed",
        message: "Cannot connect to database. Please check DATABASE_URL configuration.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: "Failed to fetch products",
      message: err.message || "Internal server error"
    });
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
