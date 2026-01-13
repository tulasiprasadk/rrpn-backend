import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import routes from "./routes/index.js";
import passport from "./passport.js";
import { initDatabase } from "./config/database.js";

const app = express();

/**
 * Initialize database (NON-BLOCKING)
 * IMPORTANT: Never await this in serverless
 */
initDatabase().catch(err => {
  console.error("Database init error:", err.message);
});

/**
 * Trust proxy (required on Vercel)
 */
app.set("trust proxy", 1);

/**
 * CORS
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

/**
 * Body parser
 */
app.use(bodyParser.json());

/**
 * Sessions
 * NOTE: Works locally, but NOT ideal for serverless.
 * Recommended long-term: JWT / token-based auth.
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // must be false unless behind HTTPS with proper proxy config
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

/**
 * Passport
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Root route
 */
app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Auth status
 */
app.get("/api/auth/status", (req, res) => {
  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  res.json({
    googleConfigured,
    timestamp: new Date().toISOString(),
  });
});

/**
 * API routes
 */
app.use("/api", routes);

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

/**
 * IMPORTANT FOR VERCEL:
 * Do NOT call app.listen()
 * Export the app instead.
 */
export default app;

/**
 * Local development only
 */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
    console.log("\n🔍 Environment Check:");
    console.log(
      `  GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "✅ SET" : "❌ MISSING"}`
    );
    console.log(
      `  GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "✅ SET" : "❌ MISSING"}`
    );
    console.log(
      `  googleConfigured: ${!!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      )}`
    );
  });
}
