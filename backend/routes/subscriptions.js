import express from "express";
import jwt from "jsonwebtoken";
import { models } from "../config/database.js";

const { Product, Subscription, Category } = models;
const router = express.Router();

function requireLogin(req, res, next) {
  if (req.session?.customerId) return next();

  try {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret"
      );
      if (payload?.id) {
        req.session.customerId = payload.id;
        return next();
      }
    }
  } catch (err) {
    console.warn("JWT auth failed:", err?.message || err);
  }

  return res.status(401).json({ error: "Not logged in" });
}

router.get("/plans", async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: "approved"
      },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["id", "ASC"]]
    });

    const eligible = products.filter(
      (p) => p.hasMonthlyPackage || p.hasYearlyPackage
    );

    const monthly = eligible
      .filter((p) => p.hasMonthlyPackage)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        monthlyPrice: p.monthlyPrice,
        unit: p.unit,
        variety: p.variety,
        category: p.Category ? { id: p.Category.id, name: p.Category.name } : null
      }));

    const yearly = eligible
      .filter((p) => p.hasYearlyPackage)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        yearlyPrice: p.yearlyPrice,
        unit: p.unit,
        variety: p.variety,
        category: p.Category ? { id: p.Category.id, name: p.Category.name } : null
      }));

    res.json({ monthly, yearly });
  } catch (err) {
    console.error("Subscription plans error:", err);
    res.status(500).json({ error: "Failed to load subscription plans" });
  }
});

router.get("/", requireLogin, async (req, res) => {
  try {
    const subs = await Subscription.findAll({
      where: { customerId: req.session.customerId },
      include: [{ model: Product }],
      order: [["createdAt", "DESC"]]
    });
    res.json(subs);
  } catch (err) {
    console.error("Subscription list error:", err);
    res.status(500).json({ error: "Failed to load subscriptions" });
  }
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { productId, period } = req.body || {};
    if (!productId || !period) {
      return res.status(400).json({ error: "productId and period required" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const normalizedPeriod = String(period).toLowerCase();
    const isMonthly = normalizedPeriod === "monthly";
    const isYearly = normalizedPeriod === "yearly";
    if (!isMonthly && !isYearly) {
      return res.status(400).json({ error: "Invalid period" });
    }

    if (isMonthly && !product.hasMonthlyPackage) {
      return res.status(400).json({ error: "Monthly subscription not available" });
    }
    if (isYearly && !product.hasYearlyPackage) {
      return res.status(400).json({ error: "Yearly subscription not available" });
    }

    const price = isMonthly ? product.monthlyPrice : product.yearlyPrice;
    if (!price || Number(price) <= 0) {
      return res.status(400).json({ error: "Subscription price not configured" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (isMonthly) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await Subscription.create({
      customerId: req.session.customerId,
      productId: product.id,
      period: normalizedPeriod,
      status: "active",
      startDate,
      endDate,
      price
    });

    res.json({ success: true, subscription });
  } catch (err) {
    console.error("Subscription create error:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

export default router;
