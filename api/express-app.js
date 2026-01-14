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
      console.log("🔄 Loading routes...");
      const loadRoutes = Promise.race([
        import("../routes/index.js"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Routes load timeout")), 15000)
        )
      ]);
      const routes = await loadRoutes;
      routesHandler = routes.default || routes;
      app.use("/api", routesHandler);
      routesLoaded = true;
      console.log("✅ Routes loaded successfully");
    } catch (err) {
      console.error("❌ Failed to load routes:", err);
      return res.status(503).json({ 
        error: "Routes not available",
        message: err.message 
      });
    }
  }
  
  if (routesHandler) {
    // For serverless, manually invoke the router
    // Express app.use() doesn't affect current request in serverless context
    const originalPath = req.path;
    const originalUrl = req.url;
    
    // Log for debugging
    console.log('[ROUTE HANDLER] Processing:', {
      originalPath,
      originalUrl,
      method: req.method
    });
    
    // Remove /api prefix for router
    const pathWithoutApi = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
    req.path = pathWithoutApi || "/";
    
    // Also update url if present
    if (req.url && req.url.startsWith("/api")) {
      req.url = req.url.substring(4) || "/";
    }
    
    console.log('[ROUTE HANDLER] Adjusted path:', {
      path: req.path,
      url: req.url
    });
    
    // Invoke router with timeout protection
    const routeTimeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error("⚠️ Route handler timeout for:", originalPath);
        res.status(504).json({ 
          error: "Request timeout",
          message: "The request took too long to process"
        });
      }
    }, 25000); // 25 second timeout for route execution
    
    routesHandler(req, res, (err) => {
      clearTimeout(routeTimeout);
      // Restore original path
      req.path = originalPath;
      req.url = originalUrl;
      
      if (err) {
        console.error("Route handler error:", err);
        return next(err);
      }
      if (!res.headersSent) {
        console.log('[ROUTE HANDLER] No response sent, calling next()');
        next();
      } else {
        console.log('[ROUTE HANDLER] Response already sent');
      }
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
