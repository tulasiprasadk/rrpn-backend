import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// DB Connection
// Middleware
app.use(cors());

app.use(express.json({
  limit: "10mb"
}));

// Request timing logs
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} [${duration}ms]`);
  });

  next();
});

// Health route
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "Backend Running"
  });
});

// Routes
// Error middleware
app.use(errorHandler);

export default app;