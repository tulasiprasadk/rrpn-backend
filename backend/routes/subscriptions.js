import express from "express";
import jwt from "jsonwebtoken";
import { models } from "../config/database.js";
import { SUBSCRIPTION_PLANS, buildPlanForProduct } from "../utils/subscriptionPlans.js";

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

    const eligible = products.filter((p) => Number(p.price || 0) > 0);
    const grouped = Object.keys(SUBSCRIPTION_PLANS).reduce((acc, period) => {
      acc[period] = [];
      return acc;
    }, {});

    const plans = eligible.map((product) => {
      const productPlans = Object.keys(SUBSCRIPTION_PLANS)
        .map((period) => buildPlanForProduct(product, period))
        .filter(Boolean);

      productPlans.forEach((plan) => {
        grouped[plan.period].push({
          id: product.id,
          title: product.title,
          price: Number(product.price),
          unit: product.unit,
          variety: product.variety,
          category: product.Category ? { id: product.Category.id, name: product.Category.name } : null,
          ...plan
        });
      });

      return {
        id: product.id,
        title: product.title,
        price: Number(product.price),
        unit: product.unit,
        variety: product.variety,
        category: product.Category ? { id: product.Category.id, name: product.Category.name } : null,
        plans: productPlans
      };
    });

    res.json({ plans, ...grouped });
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
    const { productId, period, renewExisting = false } = req.body || {};
    if (!productId || !period) {
      return res.status(400).json({ error: "productId and period required" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const normalizedPeriod = String(period).toLowerCase();
    const selectedPlan = buildPlanForProduct(product, normalizedPeriod);
    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid period" });
    }

    if (!renewExisting) {
      return res.status(400).json({
        error: "Subscriptions now start only through payment approval. Please continue through the payment flow."
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + selectedPlan.months);

    const subscription = await Subscription.create({
      customerId: req.session.customerId,
      productId: product.id,
      period: normalizedPeriod,
      status: "active",
      startDate,
      endDate,
      price: selectedPlan.discountedPrice
    });

    res.json({
      success: true,
      subscription,
      plan: selectedPlan
    });
  } catch (err) {
    console.error("Subscription create error:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

export default router;
