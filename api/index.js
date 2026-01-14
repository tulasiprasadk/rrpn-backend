import "dotenv/config";
import express from "express";
import serverless from "serverless-http";

// ============================================
// CRITICAL: Minimal Express app for Vercel
// Health endpoints respond BEFORE any processing
// ============================================

const app = express();

// Trust proxy
app.set("trust proxy", 1);

// ============================================
// CRITICAL: Health endpoint handler - FIRST middleware
// Responds immediately without any other processing
// ============================================

app.use((req, res, next) => {
  const path = req.path || req.url.split('?')[0];
  
  // Health endpoints - respond immediately and stop processing
  if (path === "/api/ping" || path === "/ping") {
    res.status(200).setHeader('Content-Type', 'text/plain');
    return res.end("pong");
  }
  
  if (path === "/api/health" || path === "/health") {
    res.status(200).setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }
  
  if (path === "/api/auth/status" || path === "/auth/status") {
    res.status(200).setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }));
  }
  
  if (path === "/" || path === "") {
    res.status(200).setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      message: "RR Nagar Backend API",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString()
    }));
  }
  
  // Not a health endpoint - continue
  next();
});

// ============================================
// MIDDLEWARE - Only for non-health endpoints
// ============================================

import cors from "cors";
import session from "express-session";

const corsOrigins = [
  "http://localhost:5173",
  "https://rrpn-frontend.vercel.app",
  process.env.FRONTEND_URL,
  "https://rrnagar.com",
  "https://www.rrnagar.com",
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])
].filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(session({
  name: "rrnagar.sid",
  secret: process.env.SESSION_SECRET || "fallback-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// ============================================
// LAZY LOAD ROUTES
// ============================================

let passportLoaded = false;
let routesLoaded = false;
let routesHandler = null;

async function initializePassport() {
  if (!passportLoaded) {
    try {
      const passport = await import("../passport.js");
      const passportInstance = passport.default || passport;
      app.use(passportInstance.initialize());
      app.use(passportInstance.session());
      passportLoaded = true;
    } catch (err) {
      console.error("Failed to load passport:", err);
      throw err;
    }
  }
}

app.use("/api", async (req, res, next) => {
  const path = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
  
  const isOAuthRoute = path.includes("/auth/google") || 
                       path.includes("/customers/auth") || 
                       path.includes("/suppliers/auth");
  
  if (isOAuthRoute && !passportLoaded) {
    try {
      await initializePassport();
    } catch (err) {
      return res.status(500).json({ error: "OAuth not available" });
    }
  }
  
  if (!routesLoaded) {
    try {
      const loadRoutes = Promise.race([
        import("../routes/index.js"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Routes load timeout")), 10000)
        )
      ]);
      const routes = await loadRoutes;
      routesHandler = routes.default || routes;
      app.use("/api", routesHandler);
      routesLoaded = true;
      console.log("✅ Routes loaded");
    } catch (err) {
      console.error("Failed to load routes:", err);
      return res.status(503).json({ error: "Routes not available" });
    }
  }
  
  if (routesHandler) {
    const originalPath = req.path;
    const pathWithoutApi = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
    req.path = pathWithoutApi || "/";
    
    routesHandler(req, res, (err) => {
      req.path = originalPath;
      if (err) return next(err);
      if (!res.headersSent) next();
    });
    return;
  }
  
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: "Not found", path: req.path });
  }
});

// ============================================
// VERCEL EXPORT
// ============================================

export default serverless(app);
export const handler = serverless(app);
