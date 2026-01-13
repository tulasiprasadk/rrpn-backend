import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";

const app = express();

// DO NOT import routes or passport here - they will be lazy loaded
// This ensures health checks work immediately without any blocking

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

// ============================================
// CRITICAL: Health checks at the VERY TOP
// These must work WITHOUT any middleware or heavy imports
// Register BEFORE bodyParser, session, passport, routes
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

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
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

// Now add bodyParser and other middleware AFTER health checks
app.use(bodyParser.json());

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
      secure: process.env.NODE_ENV === 'production', // true for HTTPS in production, false for localhost
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // "none" for cross-site in production, "lax" for localhost
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Lazy load passport and routes ONLY when needed (not on import)
// This prevents blocking during serverless function cold start
let passportLoaded = false;
let routesLoaded = false;

// Middleware to lazy-load passport on first non-health-check request
app.use(async (req, res, next) => {
  // Skip passport for health check endpoints
  if (req.path === "/api/ping" || req.path === "/api/health" || req.path === "/health" || req.path === "/api/auth/status" || req.path === "/") {
    return next();
  }
  
  if (!passportLoaded) {
    try {
      const passport = await import("../passport.js");
      const passportInstance = passport.default || passport;
      // Only initialize once
      if (!app._passportInitialized) {
        app.use(passportInstance.initialize());
        app.use(passportInstance.session());
        app._passportInitialized = true;
      }
      passportLoaded = true;
    } catch (err) {
      console.error("Passport lazy load error:", err);
    }
  }
  next();
});

// Pre-load routes in background after app starts (non-blocking)
let routesPromise = null;
function preloadRoutes() {
  if (!routesPromise) {
    routesPromise = import("../routes/index.js").catch(err => {
      console.error("Routes preload error:", err);
      return null;
    });
  }
  return routesPromise;
}

// Start preloading routes immediately (non-blocking)
preloadRoutes();

// Lazy load routes - use preloaded promise if available
app.use("/api", async (req, res, next) => {
  // Skip route loading for endpoints that are already defined above
  const skipRoutes = ["/ping", "/health", "/auth/status"];
  const pathWithoutApi = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
  
  if (skipRoutes.includes(pathWithoutApi) || skipRoutes.includes(req.path)) {
    return next(); // Let the already-defined routes handle it
  }
  
  if (!routesLoaded) {
    try {
      // Use preloaded promise or load now with timeout
      const loadPromise = preloadRoutes();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Route loading timeout")), 5000)
      );
      
      const routesModule = await Promise.race([loadPromise, timeoutPromise]);
      if (!routesModule) {
        return res.status(503).json({ error: "Routes not available", message: "Failed to load routes" });
      }
      
      const routesHandler = routesModule.default || routesModule;
      // Mount routes handler only once
      if (!app._routesMounted) {
        app.use("/api", routesHandler);
        app._routesMounted = true;
      }
      routesLoaded = true;
      // Now that routes are loaded, let them handle the request
      return routesHandler(req, res, next);
    } catch (err) {
      console.error("Routes lazy load error:", err);
      // If routes fail to load, return error but don't block
      if (err.message === "Route loading timeout") {
        return res.status(504).json({ error: "Service temporarily unavailable", message: "Routes are loading, please try again in a few seconds" });
      }
      return res.status(503).json({ error: "Routes initialization failed", message: err.message });
    }
  }
  // Routes already loaded, continue to next middleware (routes will handle it)
  next();
});

// Error handler - MUST be after routes
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// 404 handler - MUST be last
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Export for Vercel serverless
export default serverless(app);
