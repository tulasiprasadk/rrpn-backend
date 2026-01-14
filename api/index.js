import "dotenv/config";
import express from "express";
import serverless from "serverless-http";

// ============================================
// CRITICAL: Minimal Express app for Vercel
// NO blocking operations, NO database init on startup
// ============================================

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// ============================================
// CRITICAL ENDPOINTS - Defined FIRST, before ANY middleware
// These must respond instantly without any processing
// ============================================

app.get("/api/ping", (req, res) => {
  // Immediate response - no async, no dependencies, no middleware
  res.status(200).setHeader('Content-Type', 'text/plain').end("pong");
});

app.get("/api/health", (req, res) => {
  // Immediate response - no async, no dependencies
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/api/auth/status", (req, res) => {
  // Immediate response - only checks env vars, no async
  res.status(200).json({
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

// Root endpoint - MUST be minimal and fast (no dependencies)
app.get("/", (req, res) => {
  // Immediate response, no async operations
  res.status(200).json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MIDDLEWARE - Applied AFTER critical endpoints
// ============================================

import cors from "cors";
import session from "express-session";

// CORS - Simple and fast, supports multiple origins including custom domain
const corsOrigins = [
  "http://localhost:5173",
  "https://rrpn-frontend.vercel.app",
  process.env.FRONTEND_URL,
  // Support custom domain
  "https://rrnagar.com",
  "https://www.rrnagar.com",
  // Support CORS_ORIGINS env var (comma-separated)
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Body parser
app.use(express.json());

// Session middleware - Required for OAuth
app.use(
  session({
    name: "rrnagar.sid",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // "none" for cross-site in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ============================================
// LAZY LOAD PASSPORT & ROUTES - Only when needed
// All heavy imports happen on first request, not at startup
// ============================================

let passportLoaded = false;
let passportInstance = null;
let routesLoaded = false;
let routesHandler = null;

// Initialize passport middleware (lazy load)
async function initializePassport() {
  if (!passportLoaded) {
    try {
      const passport = await import("../passport.js");
      passportInstance = passport.default || passport;
      app.use(passportInstance.initialize());
      app.use(passportInstance.session());
      passportLoaded = true;
    } catch (err) {
      console.error("Failed to load passport:", err);
      throw err;
    }
  }
  return passportInstance;
}

// Middleware to lazy-load passport and routes
app.use("/api", async (req, res, next) => {
  // Skip for endpoints already defined above - these must return immediately
  const skipPaths = ["/ping", "/health", "/auth/status"];
  const path = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
  
  // CRITICAL: These endpoints are defined above and should never reach here
  // But if they do, skip immediately without any async operations
  if (skipPaths.includes(path) || skipPaths.some(skip => path.startsWith(skip))) {
    return next();
  }
  
  // Load passport if needed (for OAuth routes)
  const isOAuthRoute = path.includes("/auth/google") || 
                       path.includes("/customers/auth") || 
                       path.includes("/suppliers/auth");
  
  if (isOAuthRoute && !passportLoaded) {
    try {
      await initializePassport();
    } catch (err) {
      console.error("Failed to initialize passport for OAuth:", err);
      return res.status(500).json({ 
        error: "OAuth not available", 
        message: "Failed to initialize authentication" 
      });
    }
  }
  
  // Lazy load routes on first request - with timeout protection
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
      // Mount routes directly to app - this is critical for Express routing
      app.use("/api", routesHandler);
      routesLoaded = true;
      console.log("✅ Routes loaded and mounted successfully");
    } catch (err) {
      console.error("Failed to load routes:", err);
      return res.status(503).json({ 
        error: "Routes not available", 
        message: err.message 
      });
    }
  }
  
  // CRITICAL: For serverless, we need to manually invoke the router
  // Mounting with app.use() doesn't affect the current request in serverless context
  // So we must call the router directly for this request
  if (routesHandler) {
    // Remove /api prefix since router expects paths without it
    const originalPath = req.path;
    const pathWithoutApi = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
    req.path = pathWithoutApi || "/";
    
    // Call the router
    routesHandler(req, res, (err) => {
      // Restore original path
      req.path = originalPath;
      if (err) {
        return next(err);
      }
      // If router didn't handle (no response sent), continue to next middleware
      if (!res.headersSent) {
        next();
      }
    });
    return; // Don't call next() here, router will handle it
  }
  
  // Fallback if routes not loaded
  next();
});

// Error handler - must be after routes
app.use((err, req, res, next) => {
  console.error("Error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
});

// 404 handler - must be last, after all routes
app.use((req, res) => {
  // Only return 404 if not already responded
  if (!res.headersSent) {
    res.status(404).json({ error: "Not found", path: req.path });
  }
});

// ============================================
// VERCEL EXPORT - serverless-http wrapper
// NO app.listen() - Vercel handles that
// ============================================

export default serverless(app);

// Named export for compatibility
export const handler = serverless(app);
