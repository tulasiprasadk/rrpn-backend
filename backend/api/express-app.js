import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import serverless from "serverless-http";
import passport from "../passport.js";
import routes from "../routes/index.js";

const app = express();

function normalizeUrl(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\/$/, "")
    : "";
}

function getAllowedOrigins() {
  return [
    normalizeUrl(process.env.FRONTEND_URL),
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => normalizeUrl(origin))
      .filter(Boolean),
  ];
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(normalizeUrl(origin));
}

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  session({
    name: process.env.SESSION_COOKIE_NAME || "rrnagar.sid",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "RR Nagar Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/auth/status", (req, res) => {
  res.json({
    googleConfigured: !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
    ),
  });
});

app.use(passport.initialize());
app.use(passport.session());
app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error("Express app error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

export default serverless(app);
