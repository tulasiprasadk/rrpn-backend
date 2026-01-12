import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import serverless from "serverless-http";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// CORS - Allow all in production for now
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json());

// Session
app.use(
  session({
    name: "rrnagar.sid",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
    },
  })
);

// Root - MUST work without any dependencies
app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Health check - MUST work (no database dependency)
app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize passport and routes (with error handling)
let passportInitialized = false;
let routesMounted = false;

// Try to initialize passport (non-blocking)
try {
  import("../passport.js").then((passportModule) => {
    try {
      const passport = passportModule.default || passportModule;
      const p = passport.default || passport;
      app.use(p.initialize());
      app.use(p.session());
      passportInitialized = true;
      console.log("✅ Passport initialized");
    } catch (err) {
      console.error("❌ Passport init error:", err.message);
    }
  }).catch((err) => {
    console.error("❌ Passport import error:", err.message);
  });
} catch (err) {
  console.error("❌ Passport setup error:", err.message);
}

// Try to mount routes (non-blocking)
try {
  import("../routes/index.js").then((routesModule) => {
    try {
      const routes = routesModule.default || routesModule;
      const handler = routes.default || routes;
      app.use("/api", handler);
      routesMounted = true;
      console.log("✅ Routes mounted");
    } catch (err) {
      console.error("❌ Routes mount error:", err.message);
    }
  }).catch((err) => {
    console.error("❌ Routes import error:", err.message);
  });
} catch (err) {
  console.error("❌ Routes setup error:", err.message);
}

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
