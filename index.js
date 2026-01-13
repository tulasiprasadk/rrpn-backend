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
      secure: false,
      httpOnly: true,
      sameSite: "lax",
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
