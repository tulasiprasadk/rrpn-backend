import express from "express";

const router = express.Router();

/* =====================================================
   STEP 1: Minimal route - returns empty array immediately
   NO database, NO async, NO imports
   This proves the route is being invoked
===================================================== */
router.get("/", (req, res) => {
  console.log("[PRODUCTS] Route invoked:", req.query);
  res.json([]);
});

/* =====================================================
   GET /api/products/test
   - Test endpoint
===================================================== */
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "Products route is accessible" });
});

/* =====================================================
   GET /api/products/health
===================================================== */
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* =====================================================
   POST /api/products/bulk
   - Placeholder for now
===================================================== */
router.post("/bulk", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

export default router;
