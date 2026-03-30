import express from "express";
import { models } from "../config/database.js";
import { requireAdmin } from "./admin/middleware.js";
import adminNotify from "../services/adminNotify.js";
import { sendNotificationToSupplier, sendNotificationToCustomer } from "../utils/notify.js";

const { Order, Product, Supplier, Notification } = models;
const router = express.Router();

function getOrderIdFromNotification(notification) {
  if (!notification) return null;

  try {
    if (notification.meta) {
      const meta = typeof notification.meta === "string"
        ? JSON.parse(notification.meta)
        : notification.meta;
      if (meta?.orderId) return Number(meta.orderId) || meta.orderId;
    }
  } catch (_err) {
    // Ignore invalid JSON and fall back to message parsing.
  }

  const message = notification.message || "";
  const match = message.match(/order\s*#(\d+)/i) || message.match(/\b#(\d+)\b/);
  return match ? Number(match[1]) || match[1] : null;
}

async function approveOrderPaymentById(id) {
  const order = await Order.findByPk(id, {
    include: [Product, Supplier]
  });

  if (!order) return null;

  order.paymentStatus = "approved";
  order.status = "paid";
  await order.save();

  await adminNotify(
    "payment_approved",
    "Payment Approved",
    `Order #${order.id} approved for Rs ${order.totalAmount}`
  );

  try {
    if (order.SupplierId) {
      await sendNotificationToSupplier(order.SupplierId, "Payment Approved", {
        orderId: order.id,
        product: order.Product?.title || order.Product?.name,
        amount: order.totalAmount
      });
    }
  } catch (err) {
    console.error("Supplier notify failed", err);
  }

  try {
    if (order.customerPhone) {
      await sendNotificationToCustomer(
        order.customerPhone,
        `RR Nagar: Your order #${order.id} payment is approved. Delivery will be scheduled.`
      );
    }
  } catch (err) {
    console.error("Customer notify failed", err);
  }

  return order;
}

async function rejectOrderPaymentById(id) {
  const order = await Order.findByPk(id);
  if (!order) return null;

  order.paymentStatus = "rejected";
  order.status = "payment_failed";
  await order.save();

  return order;
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const pending = await Order.findAll({
      where: { paymentStatus: "pending" },
      include: [Product, Supplier],
      order: [["id", "DESC"]],
    });

    res.json(pending);
  } catch (err) {
    console.error("Admin payment fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const order = await approveOrderPaymentById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ ok: true, order });
  } catch (err) {
    console.error("Payment approve error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const order = await rejectOrderPaymentById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ ok: true, order });
  } catch (err) {
    console.error("Payment reject error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/notifications/:notificationId/approve", requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.notificationId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    const orderId = getOrderIdFromNotification(notification);
    if (!orderId) return res.status(404).json({ error: "Order not found for this notification" });

    const order = await approveOrderPaymentById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await notification.update({ isRead: true });
    res.json({ ok: true, order });
  } catch (err) {
    console.error("Notification payment approve error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/notifications/:notificationId/reject", requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.notificationId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    const orderId = getOrderIdFromNotification(notification);
    if (!orderId) return res.status(404).json({ error: "Order not found for this notification" });

    const order = await rejectOrderPaymentById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await notification.update({ isRead: true });
    res.json({ ok: true, order });
  } catch (err) {
    console.error("Notification payment reject error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
