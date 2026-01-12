import express from "express";
import { models } from "../config/database.js";
import { generateUPIQRCode, generatePaymentReference, verifyUPIPayment } from "../services/upiService.js";
import { calculateCommission } from "../utils/commissionCalculator.js";

const router = express.Router();
const { Order, Payment, Customer } = models;

/**
 * POST /api/payments/create
 * Create payment for an order
 */
router.post("/create", async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: "Order ID and amount are required" });
    }

    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Calculate fees
    const commission = calculateCommission(amount);
    const platformFee = parseFloat(process.env.PLATFORM_FEE || 0);
    const deliveryFee = parseFloat(process.env.DELIVERY_FEE || 0);
    const totalAmount = amount + platformFee + deliveryFee;
    const supplierAmount = amount - commission;

    // Generate payment reference
    const paymentRef = generatePaymentReference();

    // Generate UPI QR code
    const upiData = await generateUPIQRCode(
      orderId,
      totalAmount,
      process.env.UPI_ID,
      process.env.UPI_PAYEE_NAME || "RR Nagar",
      `Order ${orderId} - ${paymentRef}`
    );

    // Create payment record
    const payment = await Payment.create({
      orderId: orderId,
      amount: amount,
      platformFee: platformFee,
      deliveryFee: deliveryFee,
      commission: commission,
      supplierAmount: supplierAmount,
      paymentMethod: 'upi_qr',
      paymentStatus: 'pending',
      upiQrCode: upiData.qrCode,
      metadata: {
        upiUrl: upiData.upiUrl,
        upiId: upiData.upiId,
        paymentRef: paymentRef
      }
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        orderId: orderId,
        amount: totalAmount,
        qrCode: upiData.qrCode,
        upiUrl: upiData.upiUrl,
        upiId: upiData.upiId,
        paymentRef: paymentRef,
        paymentMethod: 'upi_qr'
      }
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

/**
 * POST /api/payments/verify
 * Verify UPI payment (manual verification)
 */
router.post("/verify", async (req, res) => {
  try {
    const { paymentId, transactionId, upiReference } = req.body;

    if (!paymentId || !transactionId) {
      return res.status(400).json({ error: "Payment ID and transaction ID are required" });
    }

    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Order }]
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.paymentStatus === 'completed') {
      return res.json({ 
        success: true, 
        message: "Payment already verified",
        payment: payment 
      });
    }

    // Update payment status (manual verification)
    payment.paymentStatus = 'pending'; // Admin will approve manually
    payment.upiTransactionId = transactionId;
    payment.metadata = {
      ...payment.metadata,
      upiReference: upiReference,
      verifiedAt: new Date().toISOString()
    };
    await payment.save();

    res.json({
      success: true,
      message: "Payment verification submitted. Admin will verify manually.",
      payment: payment
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Get payment details for an order
 */
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({
      where: { orderId: orderId },
      include: [{ model: Order }]
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({
      success: true,
      payment: payment
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

/**
 * GET /api/payments/upi-qr/:orderId
 * Generate UPI QR code for an order
 */
router.get("/upi-qr/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const amount = parseFloat(order.totalAmount) || 0;
    const platformFee = parseFloat(process.env.PLATFORM_FEE || 0);
    const deliveryFee = parseFloat(process.env.DELIVERY_FEE || 0);
    const totalAmount = amount + platformFee + deliveryFee;

    const upiData = await generateUPIQRCode(
      orderId,
      totalAmount,
      process.env.UPI_ID,
      process.env.UPI_PAYEE_NAME || "RR Nagar",
      `Order ${orderId}`
    );

    res.json({
      success: true,
      qrCode: upiData.qrCode,
      upiUrl: upiData.upiUrl,
      upiId: upiData.upiId,
      amount: totalAmount,
      orderId: orderId
    });
  } catch (error) {
    console.error("Error generating UPI QR:", error);
    res.status(500).json({ error: "Failed to generate UPI QR code" });
  }
});

export default router;
