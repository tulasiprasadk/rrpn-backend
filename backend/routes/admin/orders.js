
import express from "express";
import { models } from "../../config/database.js";
import { requireAdmin } from "./middleware.js";
const { Order, Product, Supplier, Address, Notification } = models;
const router = express.Router();

/* ===========================================================
   LIST ALL ORDERS (Admin)
=========================================================== */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Product },
        { model: Supplier },
        { model: Address }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(orders);

  } catch (err) {
    console.error("ADMIN ORDER LIST ERROR:", err);
    res.status(500).json({ error: "Failed to load orders" });
  }
});


/* ===========================================================
   GET SINGLE ORDER
=========================================================== */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: Product },
        { model: Supplier },
        { model: Address }
      ]
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);

  } catch (err) {
    console.error("ADMIN ORDER DETAILS ERROR:", err);
    res.status(500).json({ error: "Failed to load order details" });
  }
});


/* ===========================================================
   APPROVE PAYMENT
=========================================================== */
router.put("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await Order.update(
      {
        paymentStatus: "approved",
        status: "paid"
      },
      {
        where: { id }
      }
    );

    if (order.CustomerId) {
      await Notification.create({
        type: "payment_approved",
        title: "Payment Approved",
        message: `Your payment for order #${id} is approved. Delivery will be scheduled soon.`,
        isRead: false,
        audience: "customer",
        customerId: order.CustomerId,
        meta: JSON.stringify({
          orderId: order.id,
          route: `/my-orders/${order.id}`,
        }),
      });
    }

    res.json({ success: true, message: "Payment approved" });

  } catch (err) {
    console.error("PAYMENT APPROVAL ERROR:", err);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});


/* ===========================================================
   REJECT PAYMENT
=========================================================== */
router.put("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await Order.update(
      {
        paymentStatus: "rejected",
        status: "payment_failed"
      },
      {
        where: { id }
      }
    );

    if (order.CustomerId) {
      await Notification.create({
        type: "payment_rejected",
        title: "Payment Rejected",
        message: `Your payment for order #${id} could not be verified. Please re-upload screenshot or correct UNR.`,
        isRead: false,
        audience: "customer",
        customerId: order.CustomerId,
        meta: JSON.stringify({
          orderId: order.id,
          route: `/my-orders/${order.id}`,
        }),
      });
    }

    res.json({ success: true, message: "Payment rejected" });

  } catch (err) {
    console.error("PAYMENT REJECT ERROR:", err);
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

export default router;
