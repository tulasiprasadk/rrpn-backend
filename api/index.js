import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import serverless from "serverless-http";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// CORS - Allow multiple origins for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://rrnagarfinal-frontend.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        // In production, be more permissive for now
        if (process.env.NODE_ENV === 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
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

// Initialize passport and routes (lazy, after basic routes)
let passportInitialized = false;
let routesMounted = false;

app.use(async (req, res, next) => {
  // Initialize passport once
  if (!passportInitialized) {
    try {
      const passport = (await import("../passport.js")).default;
      const p = passport.default || passport;
      app.use(p.initialize());
      app.use(p.session());
      passportInitialized = true;
    } catch (err) {
      console.error("Passport init error:", err);
    }
  }
  
  // Mount routes once
  if (!routesMounted && req.path.startsWith('/api')) {
    try {
      const routes = (await import("../routes/index.js")).default;
      const handler = routes.default || routes;
      app.use("/api", handler);
      routesMounted = true;
    } catch (err) {
      console.error("Routes mount error:", err);
    }
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

// Export for Vercel serverless
export default serverless(app);
