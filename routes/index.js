import express from "express";
import products from "./products.js";
import categories from "./categories.js";
import ads from "./ads.js";
import admin from "./admin.js";
import suppliers from "./suppliers.js";
import supplierProducts from "./supplier/products.js";
import customers from "./customers.js";
import customerRoutes from "./customer/index.js";

const router = express.Router();

// Health check endpoints
router.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// General auth status endpoint (frontend compatibility)
router.get("/auth/status", (req, res) => {
  res.json({
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

router.use("/products", products);
router.use("/categories", categories);
router.use("/ads", ads);
router.use("/admin", admin);
router.use("/suppliers", suppliers);
router.use("/supplier/products", supplierProducts);
router.use("/customers", customers);
router.use("/customer", customerRoutes);

export default router;
