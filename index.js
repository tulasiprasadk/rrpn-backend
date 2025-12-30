console.log("🔥 INDEX.JS VERSION 2025-12-30");
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import "./config/database.js"; // ensure DB connection

const app = express();

/* =========================
   CORS CONFIG
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://rrw-frontend.vercel.app",
  "https://rrw-frontend-bshkgchh2-prasads-projects-1f1a36aa.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.use("/api", routes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
