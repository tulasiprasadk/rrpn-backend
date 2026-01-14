// ============================================
// Express app - loaded ONLY for non-health endpoints
// Health endpoints are handled in index.js BEFORE this loads
// ============================================

import "dotenv/config";
import express from "express";
import serverless from "serverless-http";

const app = express();
app.set("trust proxy", 1);

// ============================================
// MIDDLEWARE
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

// Export serverless-wrapped handler
export default serverless(app);
