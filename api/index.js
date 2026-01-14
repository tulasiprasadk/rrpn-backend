import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import session from "express-session";

// Cloud Run compatibility: ensure handler is available

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

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
// CRITICAL ENDPOINTS - Defined FIRST, no dependencies
// ============================================

app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/api/auth/status", (req, res) => {
  res.json({
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
// LAZY LOAD PASSPORT & ROUTES - Only when needed
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
  // Skip for endpoints already defined above
  const skipPaths = ["/ping", "/health", "/auth/status"];
  const path = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
  
  if (skipPaths.includes(path)) {
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
  
  // Routes are now mounted, but we need to let Express continue processing
  // Since routes are mounted, they'll handle the request automatically
  // But we need to ensure next() is called if route doesn't match
  // Actually, if routes are mounted, Express will handle it automatically
  // So we can just call next() to continue the middleware chain
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Export for Vercel (default export)
export default serverless(app);

// Export for Cloud Run (named export)
export const handler = serverless(app);
