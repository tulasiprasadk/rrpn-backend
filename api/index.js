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
// These MUST respond instantly - they bypass ALL middleware
// ============================================

// Health check - responds immediately, no middleware
app.get("/api/ping", (req, res) => {
  res.status(200).setHeader('Content-Type', 'text/plain').end("pong");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/api/auth/status", (req, res) => {
  res.status(200).json({
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

// Root endpoint - MUST be minimal and fast
app.get("/", (req, res) => {
  res.status(200).json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MIDDLEWARE - Applied AFTER critical endpoints
// Health endpoints above will NOT go through this middleware
// ============================================

// Import middleware (these are fast, non-blocking imports)
import cors from "cors";
import session from "express-session";

// CORS configuration
const corsOrigins = [
  "http://localhost:5173",
  "https://rrpn-frontend.vercel.app",
  process.env.FRONTEND_URL,
  "https://rrnagar.com",
  "https://www.rrnagar.com",
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])
].filter(Boolean);

// Apply middleware only for non-health endpoints
app.use((req, res, next) => {
  // CRITICAL: Skip ALL middleware for health endpoints
  const healthPaths = ["/api/ping", "/api/health", "/api/auth/status", "/"];
  if (healthPaths.includes(req.path)) {
    return next(); // Skip middleware, go directly to route handler
  }
  
  // Apply CORS for other routes
  cors({
    origin: corsOrigins,
    credentials: true,
  })(req, res, next);
});

// Body parser - only for non-health endpoints
app.use((req, res, next) => {
  const healthPaths = ["/api/ping", "/api/health", "/api/auth/status", "/"];
  if (healthPaths.includes(req.path)) {
    return next();
  }
  express.json()(req, res, next);
});

// Session middleware - only for non-health endpoints
app.use((req, res, next) => {
  const healthPaths = ["/api/ping", "/api/health", "/api/auth/status", "/"];
  if (healthPaths.includes(req.path)) {
    return next();
  }
  session({
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
  })(req, res, next);
});

// ============================================
// LAZY LOAD PASSPORT & ROUTES - Only when needed
// ============================================

let passportLoaded = false;
let passportInstance = null;
let routesLoaded = false;
let routesHandler = null;

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

// Middleware to lazy-load routes - SKIPS health endpoints
app.use("/api", async (req, res, next) => {
  // CRITICAL: Health endpoints are already handled above, skip immediately
  const healthPaths = ["/ping", "/health", "/auth/status"];
  const path = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
  
  if (healthPaths.includes(path)) {
    return next(); // Already handled, skip
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
  
  // Manually invoke router for current request
  if (routesHandler) {
    const originalPath = req.path;
    const pathWithoutApi = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
    req.path = pathWithoutApi || "/";
    
    routesHandler(req, res, (err) => {
      req.path = originalPath;
      if (err) {
        return next(err);
      }
      if (!res.headersSent) {
        next();
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

// 404 handler - must be last
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: "Not found", path: req.path });
  }
});

// ============================================
// VERCEL EXPORT - serverless-http wrapper
// NO app.listen() - Vercel handles that
// ============================================

export default serverless(app);
export const handler = serverless(app);
