import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "../passport.js";
import routes from "../routes/index.js";
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

// Initialize passport
const passportInstance = passport.default || passport;
app.use(passportInstance.initialize());
app.use(passportInstance.session());

// Root - MUST be before /api routes
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

// Mount routes
const routesHandler = routes.default || routes;
app.use("/api", routesHandler);

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
// Use serverless-http wrapper for better Vercel compatibility
export default serverless(app);

// Also export as handler for Vercel compatibility
export const handler = app;
