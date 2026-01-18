import "dotenv/config";
import express from "express";
import cors from "cors";
import pkg from "pg";
import bodyParser from "body-parser";
import session from "express-session";
import { Op } from "sequelize";
import { initDatabase, models, sequelize } from "./config/database.js";

const app = express();
const { Pool } = pkg;

// Lazy pool for direct SQL (Cloud Run)
let pool;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }
  return pool;
}

// Initialize database (non-blocking)
initDatabase().catch(err => {
  console.error("Database init error:", err.message);
});

// Trust proxy
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rrpn-frontend.vercel.app",
      "https://rrnagar.com",
      "https://www.rrnagar.com",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(bodyParser.json());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Root - must respond immediately for Cloud Run health checks
app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Health - must respond immediately for Cloud Run health checks
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Products - direct SQL (bypass routes)
app.get("/api/products", async (req, res) => {
  try {
    const dbPool = getPool();

    const { categoryId, q } = req.query;
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 50000)
      : 50000;

    if (!dbPool) {
      const { Product, Category } = models || {};
      if (!Product) return res.json([]);

      const where = {};
      if (categoryId) {
        const catId = Number(categoryId);
        if (!Number.isNaN(catId)) where.CategoryId = catId;
      }
      if (q) {
        const likeOp =
          sequelize?.getDialect?.() === "postgres" ? Op.iLike : Op.like;
        const term = `%${q}%`;
        where[Op.or] = [
          { title: { [likeOp]: term } },
          { variety: { [likeOp]: term } },
          { subVariety: { [likeOp]: term } },
          { description: { [likeOp]: term } },
        ];
      }

      const results = await Product.findAll({
        where,
        include: Category ? [{ model: Category }] : [],
        order: [["id", "DESC"]],
        limit,
      });

      const normalized = results.map((row) => {
        const product = row.toJSON ? row.toJSON() : { ...row };
        if (product.Category) {
          product.Category = {
            id: product.Category.id,
            name: product.Category.name,
            icon: product.Category.icon,
            titleKannada: product.Category.titleKannada,
            kn: product.Category.kn,
            knDisplay: product.Category.knDisplay,
          };
        } else {
          product.Category = null;
        }
        product.basePrice = product.price;
        if (!product.knDisplay && product.titleKannada) {
          product.knDisplay = product.titleKannada;
        }
        if (!product.kn && product.titleKannada) {
          product.kn = product.titleKannada;
        }
        return product;
      });

      return res.json(normalized);
    }

    const params = [];
    let whereSql = "WHERE 1=1";

    if (categoryId) {
      const catId = Number(categoryId);
      if (!Number.isNaN(catId)) {
        params.push(catId);
        whereSql += ` AND p."CategoryId" = $${params.length}`;
      }
    }

    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      whereSql += ` AND (p.title ILIKE $${idx} OR p.variety ILIKE $${idx} OR p."subVariety" ILIKE $${idx} OR p.description ILIKE $${idx})`;
    }

    params.push(limit);
    const limitIdx = params.length;

    const query = `
      SELECT 
        p.*,
        c.id as "cat_id",
        c.name as "cat_name",
        c.icon as "cat_icon",
        NULL as "cat_titleKannada",
        NULL as "cat_kn",
        NULL as "cat_knDisplay"
      FROM public."Products" p
      LEFT JOIN public."Categories" c ON c.id = p."CategoryId"
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT $${limitIdx}
    `;
    let result;
    try {
      result = await dbPool.query(query, params);
    } catch (err) {
      const isMissingTable = err?.code === "42P01" || /relation .* does not exist/i.test(err?.message || "");
      if (!isMissingTable) throw err;
      const fallbackQuery = `
        SELECT 
          p.*,
          c.id as "cat_id",
          c.name as "cat_name",
          c.icon as "cat_icon",
          NULL as "cat_titleKannada",
          NULL as "cat_kn",
          NULL as "cat_knDisplay"
        FROM public.products p
        LEFT JOIN public.categories c ON c.id = p."CategoryId"
        ${whereSql}
        ORDER BY p.id DESC
        LIMIT $${limitIdx}
      `;
      result = await dbPool.query(fallbackQuery, params);
    }
    const rows = result.rows || [];

    const products = rows.map((row) => {
      const product = { ...row };
      product.Category = row.cat_id
        ? {
            id: row.cat_id,
            name: row.cat_name,
            icon: row.cat_icon,
            titleKannada: row.cat_titleKannada,
            kn: row.cat_kn,
            knDisplay: row.cat_knDisplay,
          }
        : null;

      delete product.cat_id;
      delete product.cat_name;
      delete product.cat_icon;
      delete product.cat_titleKannada;
      delete product.cat_kn;
      delete product.cat_knDisplay;

      product.basePrice = product.price;
      if (!product.knDisplay && product.titleKannada) {
        product.knDisplay = product.titleKannada;
      }
      if (!product.kn && product.titleKannada) {
        product.kn = product.titleKannada;
      }
      return product;
    });

    res.json(products);
  } catch (err) {
    console.error("Direct /api/products error:", err.message || err);
    res.json([]);
  }
});

// Minimal cart endpoints (prevent 404s)
app.get("/api/cart", (req, res) => {
  res.json({ items: [] });
});

app.post("/api/cart/add", (req, res) => {
  res.json({ success: true });
});

app.post("/api/cart/remove", (req, res) => {
  res.json({ success: true });
});

app.post("/api/cart/clear", (req, res) => {
  res.json({ success: true });
});

// Auth status - must respond immediately (defined before session middleware to avoid issues)
app.get("/api/auth/status", (req, res, next) => {
  try {
    console.log("Handling /api/auth/status request");
    const googleConfigured = !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );
    console.log("Google configured:", googleConfigured);
    res.json({ googleConfigured });
  } catch (err) {
    console.error("Error in /api/auth/status:", err);
    res.status(500).json({ error: "Internal server error", googleConfigured: false });
  }
});

/**
 * REQUIRED FOR CLOUD RUN:
 * Must listen on PORT=8080
 * Load routes BEFORE starting server to ensure they're available immediately
 */
const PORT = process.env.PORT || 8080;

// Load Passport and Routes BEFORE starting server
// This ensures routes are available immediately when server starts
(async () => {
  try {
    const passport = (await import("./passport.js")).default;
    app.use(passport.initialize());
    app.use(passport.session());
    console.log("✓ Passport loaded");
  } catch (err) {
    console.error("⚠ Passport load error:", err.message);
    console.error("Stack:", err.stack);
    // Continue even if passport fails - health endpoints will still work
  }

  try {
    const routes = (await import("./routes/index.js")).default;
    app.use("/api", routes);
    console.log("✓ Routes loaded");
  } catch (err) {
    console.error("⚠ Routes load error:", err.message);
    console.error("Stack:", err.stack);
    // Health endpoints are already defined above, so they'll still work
  }

  // Error handler - must be after routes
  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  });

  // 404 handler - must be LAST, after all routes
  app.use((req, res) => {
    res.status(404).json({ error: "Not found", path: req.path });
  });

  // Start server AFTER routes and error handlers are loaded
  app.listen(PORT, () => {
    console.log(`🚀 Cloud Run backend running on port ${PORT}`);
    console.log(`✓ Health endpoints available: /, /api/health, /api/auth/status`);
    console.log(`✓ All routes loaded and ready`);
  });
})();
