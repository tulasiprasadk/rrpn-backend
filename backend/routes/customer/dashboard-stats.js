import express from "express";
import { models } from "../../config/database.js";
import jwt from "jsonwebtoken";
const { Order, Address } = models;
const router = express.Router();

function requireLogin(req, res, next) {
  if (req.session?.customerId) return next();

  try {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret"
      );
      if (decoded?.id) {
        req.session.customerId = decoded.id;
        return next();
      }
    }
  } catch (err) {
    // Ignore and fall through.
  }
  return res.status(401).json({ error: "Not logged in" });
}

router.get("/", requireLogin, async (req, res) => {
  try {
    const customerId = req.session.customerId;

    const [ordersCount, addressesCount] = await Promise.all([
      Order.count({ where: { CustomerId: customerId } }),
      Address.count({ where: { CustomerId: customerId } })
    ]);

    res.json({
      orders: ordersCount,
      saved: 0, // saved suppliers/bookmarks not tracked yet
      addresses: addressesCount
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

export default router;
