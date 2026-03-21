
import express from "express";
import { models } from "../../config/database.js";
import jwt from "jsonwebtoken";
const { Order, Product, Address } = models;
const router = express.Router();

/* Supplier Login Middleware - supports both session and JWT */
function requireSupplier(req, res, next) {
  // Check session first
  if (req.session && req.session.supplierId) {
    req.supplierId = req.session.supplierId;
    return next();
  }

  // Check JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret"
      );
      if (decoded.role === "supplier" && decoded.id) {
        req.supplierId = decoded.id;
        req.session.supplierId = decoded.id;
        return next();
      }
    } catch (err) {
      // JWT invalid
    }
  }

  return res.status(401).json({ error: "Supplier not logged in" });
}

/* ===========================================================
   GET ALL ORDERS FOR THIS SUPPLIER
=========================================================== */
router.get("/", requireSupplier, async (req, res) => {
  const orders = await Order.findAll({
    where: { supplierId: req.supplierId },
    include: [
      { model: Product },
      { model: Address }
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json(orders);
});

/* ===========================================================
   MARK ORDER AS DELIVERED
=========================================================== */
router.put("/:id/deliver", requireSupplier, async (req, res) => {
  const orderId = req.params.id;

  await Order.update(
    { status: "delivered" },
    {
      where: {
        id: orderId,
        supplierId: req.supplierId,
      },
    }
  );

  res.json({ success: true, message: "Order marked as delivered" });
});

export default router;
