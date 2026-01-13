import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import cors from "cors";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// CORS - Simple and fast
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://rrpn-frontend.vercel.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Body parser
app.use(express.json());

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

app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running"
  });
});

// ============================================
// LAZY LOAD ROUTES - Only when needed
// ============================================

let routesLoaded = false;
let routesHandler = null;

app.use("/api", async (req, res, next) => {
  // Skip for endpoints already defined above
  const skipPaths = ["/ping", "/health", "/auth/status"];
  const path = req.path.startsWith("/api") ? req.path.substring(4) : req.path;
  
  if (skipPaths.includes(path)) {
    return next();
  }
  
  // Lazy load routes on first request
  if (!routesLoaded) {
    try {
      const routes = await import("../routes/index.js");
      routesHandler = routes.default || routes;
      routesLoaded = true;
    } catch (err) {
      console.error("Failed to load routes:", err);
      return res.status(503).json({ error: "Routes not available" });
    }
  }
  
  if (routesHandler) {
    return routesHandler(req, res, next);
  }
  
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

// Export for Vercel
export default serverless(app);
