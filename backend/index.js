import "dotenv/config";
import express from "express";
import cors from "cors";
import pkg from "pg";
import bodyParser from "body-parser";
import session from "express-session";
import { Op } from "sequelize";
import { initDatabase, models, sequelize } from "./config/database.js";
import { getPlatformConfig } from "./utils/commissionCalculator.js";

const app = express();
const { Pool } = pkg;

function normalizeUrl(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\/$/, "")
    : "";
}

function getAllowedOrigins() {
  return [
    normalizeUrl(process.env.FRONTEND_URL),
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => normalizeUrl(origin))
      .filter(Boolean),
  ];
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(normalizeUrl(origin));
}

// Lazy pool for direct SQL (Cloud Run)
let pool;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    const useSsl = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      max: 5,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
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
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "10mb" }));

// Session
app.use(
  session({
    name: process.env.SESSION_COOKIE_NAME || 'rrnagar.sid',
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

// Top-level request logger (temporary) to capture Authorization header and path
app.use((req, res, next) => {
  try {
    console.log('[TOP LEVEL] ', { method: req.method, path: req.path, authorization: req.headers && req.headers.authorization });
  } catch (e) {}
  next();
});

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
        let categoryMatchIds = [];
        if (Category) {
          const matchingCategories = await Category.findAll({
            attributes: ["id"],
            where: { name: { [likeOp]: term } },
          });
          categoryMatchIds = matchingCategories.map((category) => category.id);
        }
        where[Op.or] = [
          { title: { [likeOp]: term } },
          { variety: { [likeOp]: term } },
          { subVariety: { [likeOp]: term } },
          { description: { [likeOp]: term } },
          ...(categoryMatchIds.length ? [{ CategoryId: { [likeOp === Op.iLike ? Op.in : Op.in]: categoryMatchIds } }] : []),
        ];
      }

      const results = await Product.findAll({
        where,
        include: Category ? [{ model: Category }] : [],
        order: [["id", "DESC"]],
        limit,
      });

      const config = await getPlatformConfig();
      const commissionRate = config.platform_commission ?? 15;

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
        try {
          const pct = Number(product.basePrice) || 0;
          const commission = (pct * Number(commissionRate || 0)) / 100;
          product.price = Number((pct + commission).toFixed(2));
        } catch (e) {}
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
      whereSql += ` AND (p.title ILIKE $${idx} OR p.variety ILIKE $${idx} OR p."subVariety" ILIKE $${idx} OR p.description ILIKE $${idx} OR c.name ILIKE $${idx})`;
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
      const isMissingColumn = err?.code === "42703" || /column .* does not exist/i.test(err?.message || "");
      if (!isMissingTable && !isMissingColumn) throw err;
      const fallbackQuery = `
        SELECT 
          p.*,
          c.id as "cat_id",
          c.name as "cat_name",
          ${isMissingColumn ? "NULL as \"cat_icon\"" : "c.icon as \"cat_icon\""},
          NULL as "cat_titleKannada",
          NULL as "cat_kn",
          NULL as "cat_knDisplay"
        FROM public.${isMissingTable ? "products" : "\"Products\""} p
        LEFT JOIN public.${isMissingTable ? "categories" : "\"Categories\""} c ON c.id = p."CategoryId"
        ${whereSql}
        ORDER BY p.id DESC
        LIMIT $${limitIdx}
      `;
      result = await dbPool.query(fallbackQuery, params);
    }
    const rows = result.rows || [];

    const config = await getPlatformConfig();
    const commissionRate = config.platform_commission ?? 15;

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
      try {
        const pct = Number(product.basePrice) || 0;
        const commission = (pct * Number(commissionRate || 0)) / 100;
        product.price = Number((pct + commission).toFixed(2));
      } catch (e) {}
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

// Debug: log Authorization header for admin API requests (helps diagnosing token auth)
app.use((req, res, next) => {
  try {
    if (req.path && req.path.startsWith('/api/admin')) {
      console.log('[GLOBAL DEBUG] incoming admin request', { path: req.path, auth: req.headers && req.headers.authorization });
    }
  } catch (e) {}
  next();
});

// TEMP DEBUG: expose suppliers directly for testing route reachability
app.get('/api/debug/suppliers', async (req, res) => {
  try {
    const { Supplier } = models || {};
    if (!Supplier) return res.json({ count: 0, suppliers: [] });
    const suppliers = await Supplier.findAll({ order: [['createdAt', 'DESC']] });
    console.log('[DEBUG ENDPOINT] /api/debug/suppliers returning', suppliers.length, 'suppliers');
    res.json({ count: suppliers.length, suppliers });
  } catch (err) {
    console.error('Debug suppliers error:', err);
    res.status(500).json({ error: err.message });
  }
});
// (removed temporary debug endpoints)

// Customer auth status (compatibility alias for /api/auth/me)
app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session?.customerId) {
      return res.status(401).json({ loggedIn: false });
    }
    const { Customer } = models || {};
    if (!Customer) {
      return res.status(200).json({ loggedIn: true, user: { id: req.session.customerId } });
    }
    const customer = await Customer.findByPk(req.session.customerId, {
      attributes: { exclude: ["otpCode", "otpExpiresAt", "password"] },
    });
    if (!customer) {
      return res.status(401).json({ loggedIn: false });
    }
    return res.json({ loggedIn: true, user: customer });
  } catch (err) {
    console.error("Auth /api/auth/me error:", err.message || err);
    return res.status(500).json({ loggedIn: false });
  }
});

/**
 * REQUIRED FOR CLOUD RUN:
 * Default local dev port is 3000 (can be overridden with PORT env)
 * Load routes BEFORE starting server to ensure they're available immediately
 */
const PORT = process.env.PORT || 3000;

// Load Passport and Routes BEFORE starting server
// This ensures routes are available immediately when server starts
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

  // Start server only if not in a serverless environment like Vercel
  // Vercel handles the server creation and listening.
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 Local backend running on port ${PORT}`);
      console.log(`✓ Health endpoints available: /, /api/health, /api/auth/status`);
      console.log(`✓ All routes loaded and ready`);
    });
  }
})();

// Export the app for serverless environments (Vercel)
export default app;
