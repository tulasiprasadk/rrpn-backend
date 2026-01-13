import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";

import routes from "../routes/index.js";
import passport from "../passport.js";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// CORS - Allow multiple origins
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rrw-frontend.vercel.app",
      "https://rrnagarfinal-frontend.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // true for HTTPS in production, false for localhost
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // "none" for cross-site in production, "lax" for localhost
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth status - MUST work without database
app.get("/api/auth/status", (req, res) => {
  // Return a minimal, safe status so production can detect availability
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  // Safe logging for presence (non-secret) - will appear in Vercel function logs
  console.log(`GOOGLE_CLIENT_ID set: ${!!process.env.GOOGLE_CLIENT_ID}`);
  console.log(`GOOGLE_CLIENT_SECRET set: ${!!process.env.GOOGLE_CLIENT_SECRET}`);

  res.json({ googleConfigured });
});

app.use("/api", routes);

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Export for Vercel serverless
export default serverless(app);
