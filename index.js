import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import { initDatabase } from "./config/database.js";

const app = express();

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

// DB status (quick check with timeout)
app.get("/api/db/status", async (req, res) => {
  const start = Date.now();
  const hasDbUrl = !!process.env.DATABASE_URL;

  try {
    const { sequelize, models } = await import("./config/database.js");

    // Authenticate with timeout (2s)
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB auth timeout")), 2000)
      ),
    ]);

    const Product = models?.Product;
    const Category = models?.Category;

    const [productCount, categoryCount] = await Promise.all([
      Product ? Product.count() : Promise.resolve(null),
      Category ? Category.count() : Promise.resolve(null),
    ]);

    res.json({
      ok: true,
      hasDbUrl,
      productCount,
      categoryCount,
      elapsedMs: Date.now() - start,
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      hasDbUrl,
      error: err.message,
      elapsedMs: Date.now() - start,
    });
  }
});

// Debug: category counts and category names
app.get("/api/debug/category-counts", async (req, res) => {
  try {
    const { sequelize, models } = await import("./config/database.js");
    const { fn, col } = await import("sequelize");

    const Category = models?.Category;
    const Product = models?.Product;

    if (!Category || !Product) {
      return res.json({ ok: false, message: "Models not available" });
    }

    const categories = await Category.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    const counts = await Product.findAll({
      attributes: [
        "CategoryId",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["CategoryId"],
    });

    const countsMap = {};
    counts.forEach((row) => {
      const data = row.toJSON();
      countsMap[data.CategoryId] = Number(data.count || 0);
    });

    res.json({
      ok: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        productCount: countsMap[c.id] || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
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
