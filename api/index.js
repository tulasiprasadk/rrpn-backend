import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "../backend/passport.js";
import routes from "../backend/routes/index.js";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// CORS - MUST be early
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// ============================================
// CRITICAL: Health checks at the VERY TOP
// These must work WITHOUT any database or heavy imports
// Register BEFORE session/passport/routes middleware
// ============================================

// Ping endpoint - absolute minimum, no dependencies
app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

// Health check - MUST work immediately
app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Root - MUST work immediately
app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
  });
});

// Auth status - MUST work without database
// Defined here to ensure it works even if routes have issues
app.get("/api/auth/status", (req, res) => {
  res.json({
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// ============================================
// Session, passport, and routes middleware
// These are loaded but health checks above will work even if these fail
// ============================================

// Session middleware
app.use(
  session({
    name: "rrnagar.sid",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
    },
  })
);

// Initialize passport
const passportInstance = passport.default || passport;
app.use(passportInstance.initialize());
app.use(passportInstance.session());

// Mount routes - routes are imported but don't execute blocking code
const routesHandler = routes.default || routes;
app.use("/api", routesHandler);

// Error handler - MUST be after routes
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler - MUST be last
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Export for Vercel serverless
export default app;
