import express from "express";
import jwt from "jsonwebtoken";
import { models } from "../config/database.js";
import { createSubscriptionDraft, hydrateSubscription } from "../services/subscriptionDraftService.js";
import { buildSubscriptionPricing, validateSubscriptionPayload } from "../services/subscriptionPricing.js";

const { Subscription, SubscriptionItem, Product } = models;
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
  } catch (_err) {
    // ignore
  }

  return res.status(401).json({ error: "Not logged in" });
}

router.post("/create", requireLogin, async (req, res) => {
  try {
    const { subscription, items, pricing } = await createSubscriptionDraft(models, req.body || {}, req.session.customerId);
    res.json({
      success: true,
      subscription,
      items,
      pricing
    });
  } catch (err) {
    console.error("Subscription create error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to create subscription draft" });
  }
});

router.post("/add-item", requireLogin, async (req, res) => {
  try {
    const subscription = await hydrateSubscription(models, req.body?.subscriptionId, req.session.customerId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (!["draft", "pending_payment"].includes(subscription.status)) {
      return res.status(400).json({ error: "Only draft subscriptions can be edited" });
    }

    const productId = Number(req.body?.productId);
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const quantity = Number(req.body?.quantity || 1);
    const created = await SubscriptionItem.create({
      subscriptionId: subscription.id,
      productId,
      quantity,
      unitPrice: Number(req.body?.unitPrice ?? product.price ?? 0),
      lineTotal: Number(((req.body?.unitPrice ?? product.price ?? 0) * quantity).toFixed(2)),
      metadata: req.body?.metadata || null
    });

    const freshSubscription = await hydrateSubscription(models, subscription.id, req.session.customerId);
    const payload = {
      category: freshSubscription.category,
      duration: freshSubscription.duration || freshSubscription.period,
      frequency: freshSubscription.frequency,
      planType: freshSubscription.planType,
      items: freshSubscription.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        metadata: item.metadata
      }))
    };
    const pricing = buildSubscriptionPricing(payload);
    await freshSubscription.update({
      price: pricing.totalPayable,
      savings: pricing.savings,
      pricingDetails: pricing
    });

    res.json({ success: true, item: created, subscription: freshSubscription, pricing });
  } catch (err) {
    console.error("Subscription add-item error:", err);
    res.status(500).json({ error: "Failed to add subscription item" });
  }
});

router.put("/update", requireLogin, async (req, res) => {
  try {
    const subscription = await hydrateSubscription(models, req.body?.subscriptionId, req.session.customerId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (!["draft", "pending_payment", "active"].includes(subscription.status)) {
      return res.status(400).json({ error: "This subscription cannot be updated" });
    }

    const nextPayload = {
      category: req.body?.category || subscription.category,
      duration: req.body?.duration || req.body?.period || subscription.duration || subscription.period,
      frequency: Object.prototype.hasOwnProperty.call(req.body || {}, "frequency") ? req.body.frequency : subscription.frequency,
      planType: req.body?.planType || subscription.planType,
      items: Array.isArray(req.body?.items)
        ? req.body.items
        : subscription.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            metadata: item.metadata
          }))
    };

    const validation = validateSubscriptionPayload(nextPayload);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const pricing = buildSubscriptionPricing(nextPayload);
    await subscription.update({
      category: pricing.category,
      duration: pricing.duration,
      period: pricing.duration,
      frequency: pricing.frequency,
      planType: pricing.planType,
      price: pricing.totalPayable,
      savings: pricing.savings,
      pricingDetails: pricing,
      metadata: {
        ...(subscription.metadata || {}),
        ...(req.body?.metadata || {})
      }
    });

    if (Array.isArray(req.body?.items)) {
      await SubscriptionItem.destroy({ where: { subscriptionId: subscription.id } });
      await Promise.all(
        pricing.items.map((item) =>
          SubscriptionItem.create({
            subscriptionId: subscription.id,
            productId: item.productId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            itemType: item.productId ? "product" : "plan_item",
            metadata: item.metadata || {
              title: item.title,
              unit: item.unit
            }
          })
        )
      );
    }

    const fresh = await hydrateSubscription(models, subscription.id, req.session.customerId);
    res.json({ success: true, subscription: fresh, pricing });
  } catch (err) {
    console.error("Subscription update error:", err);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

router.post("/pause", requireLogin, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { id: req.body?.subscriptionId, customerId: req.session.customerId }
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    await subscription.update({
      status: "paused",
      pausedAt: new Date(),
      pauseReason: req.body?.reason || null
    });

    res.json({ success: true, subscription });
  } catch (err) {
    console.error("Subscription pause error:", err);
    res.status(500).json({ error: "Failed to pause subscription" });
  }
});

export default router;
