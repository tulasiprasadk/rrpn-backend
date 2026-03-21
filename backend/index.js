import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Route
app.get("/", (req, res) => res.json({ message: "Backend is running!", env: process.env.NODE_ENV }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Start server locally (but NOT on Vercel, where serverless-http handles it)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;