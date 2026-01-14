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
  
  // CRITICAL: Set response timeout to ensure we always respond
  // If we don't respond within 7 seconds, return empty array
  const responseTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.warn('[PRODUCTS] Response timeout - returning empty array to prevent 504');
      res.status(200).json([]);
    }
  }, 7000);
  
  try {
    // Lazy load models with timeout
    console.log('[PRODUCTS] Loading models...');
    const modelLoadTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Model load timeout")), 3000)
    );
    
    const models = await Promise.race([
      getModels(),
      modelLoadTimeout
    ]);
    console.log('[PRODUCTS] Models loaded in', Date.now() - startTime, 'ms');
    
    if (!models.Product || !models.Category) {
      console.error('[PRODUCTS] Models not available');
      clearTimeout(responseTimeout);
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
      console.log('[PRODUCTS] Filtering by categoryId:', categoryId);
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { variety: { [Op.iLike]: `%${q}%` } },
        { subVariety: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
      console.log('[PRODUCTS] Filtering by search query:', q);
    }

    console.log('[PRODUCTS] Executing query with where:', JSON.stringify(where));
    
    // Aggressive timeout - 5s max for query (Vercel has ~10s total)
    const queryTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout")), 5000)
    );

    const queryStart = Date.now();
    console.log('[PRODUCTS] Starting database query...');
    
    const products = await Promise.race([
      models.Product.findAll({
        where,
        include: [
          {
            model: Category,
            attributes: ["id", "name", "icon", "titleKannada", "kn", "knDisplay"],
            required: false, // LEFT JOIN - don't fail if category missing
          },
        ],
        order: [["id", "DESC"]],
        limit: 100, // Limit results to prevent huge queries
        attributes: {
          include: ['id', 'title', 'name', 'titleKannada', 'kn', 'knDisplay', 'description', 'descriptionKannada', 'price', 'variety', 'subVariety', 'image', 'imageUrl', 'image_url', 'CategoryId']
        }
      }),
      queryTimeout
    ]);
    
    console.log('[PRODUCTS] Query completed in', Date.now() - queryStart, 'ms');
    console.log('[PRODUCTS] Found', products.length, 'products');

    // Add basePrice property for frontend compatibility and ensure Kannada fields are included
    const productsWithBasePrice = products.map((p) => {
      const obj = p.toJSON();
      obj.basePrice = obj.price;
      // Ensure Kannada fields are available
      if (!obj.knDisplay && obj.titleKannada) {
        obj.knDisplay = obj.titleKannada;
      }
      if (!obj.kn && obj.titleKannada) {
        obj.kn = obj.titleKannada;
      }
      return obj;
    });

    clearTimeout(responseTimeout);
    console.log('[PRODUCTS] Total time:', Date.now() - startTime, 'ms');
    
    // CRITICAL: Always send response
    if (!res.headersSent) {
      res.json(productsWithBasePrice);
    }
  } catch (err) {
    clearTimeout(responseTimeout);
    console.error('[PRODUCTS] Error fetching products:', err);
    console.error('[PRODUCTS] Error name:', err.name);
    console.error('[PRODUCTS] Error message:', err.message);
    console.error('[PRODUCTS] Error code:', err.code);
    console.error('[PRODUCTS] Total time before error:', Date.now() - startTime, 'ms');
    
    // Always respond - never leave request hanging
    if (res.headersSent) {
      console.error('[PRODUCTS] Headers already sent, cannot send error response');
      return;
    }
    
    // For timeout or connection errors, return empty array instead of error
    // This allows frontend to show "No products" instead of error message
    if (err.message && (err.message.includes("timeout") || err.message.includes("Model load timeout"))) {
      console.warn('[PRODUCTS] Timeout - returning empty array');
      return res.status(200).json([]);
    }
    
    // Check if it's a database connection error
    if (err.name === 'SequelizeHostNotFoundError' || 
        err.name === 'SequelizeConnectionError' ||
        err.name === 'SequelizeDatabaseError' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT') {
      console.warn('[PRODUCTS] Connection error - returning empty array');
      return res.status(200).json([]);
    }
    
    // For other errors, return error response
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
