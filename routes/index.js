import express from "express";
import products from "./products.js";
import categories from "./categories.js";
import ads from "./ads.js";
import admin from "./admin.js";
import adminNotifications from "./admin/notifications.js";
import adminConfig from "./admin/config.js";
import adminProducts from "./admin/products.js";
import suppliers from "./suppliers.js";
import supplierProducts from "./supplier/products.js";
import supplierOrders from "./supplier/orders.js";
import supplierDashboard from "./supplier/dashboard.js";
import subscriptions from "./subscriptions.js";
import customers from "./customers.js";
import customerRoutes from "./customer/index.js";
import customerAuth from "./customer/auth.js";
import orders from "./orders.js";
import payments from "./payments.js";
import cms from "./cms.js";
import blogs from "./blogs.js";
import adminBlogs from "./admin/blogs.js";

const router = express.Router();

// Note: /health and /auth/status are defined in index.js before routes load
// to ensure they work immediately for Cloud Run health checks

router.use("/products", products);
router.use("/categories", categories);
router.use("/ads", ads);
router.use("/admin/notifications", adminNotifications);
router.use("/admin", admin);
router.use("/admin/config", adminConfig);
router.use("/admin/products", adminProducts);
router.use("/suppliers", suppliers);
router.use("/supplier/products", supplierProducts);
router.use("/supplier/orders", supplierOrders);
router.use("/supplier/dashboard", supplierDashboard);
router.use("/subscriptions", subscriptions);
router.use("/customers", customers);
router.use("/auth", customerAuth);
router.use("/customer", customerRoutes);
router.use("/orders", orders);
router.use("/payments", payments);
router.use("/cms", cms);
router.use("/blogs", blogs);
router.use("/admin/blogs", adminBlogs);

export default router;
