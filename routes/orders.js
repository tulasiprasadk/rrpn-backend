
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { models } from "../config/database.js";
const { Order, Product, Supplier, Address, Notification } = models;
const router = express.Router();

// Configure multer for payment screenshots
const paymentUploadDir = path.join(path.resolve(), "uploads", "payment");
fs.mkdirSync(paymentUploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// MIDDLEWARE – Require Login
function requireLogin(req, res, next) {
  if (!req.session.customerId) {
    console.log("❌ Order creation blocked: No customerId in session");
    console.log("Session data:", req.session);
    return res.status(401).json({ error: "Not logged in", message: "Please log in to create an order" });
  }
  next();
}

// CREATE ORDER (Supports Address + Payment Fields)
router.post("/create", requireLogin, async (req, res) => {
  console.log("📦 Order creation request received:", {
    customerId: req.session.customerId,
    body: req.body
  });
  try {
    const {
      productId,
      qty,
      addressId,
      customerName,
      customerPhone,
      customerAddress,
      paymentUNR,
      paymentScreenshot
    } = req.body;

    // Validate product
    const product = await Product.findByPk(productId, {
      include: [{
        model: Supplier,
        as: 'suppliers',
        through: { 
          where: { isActive: true },
          attributes: ['price', 'stock', 'isActive']
        }
      }]
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get supplier from many-to-many relationship
    let supplier = null;
    let supplierId = null;
    
    // First check the many-to-many relationships
    if (product.suppliers && product.suppliers.length > 0) {
      // Use the first active supplier
      supplier = product.suppliers[0];
      supplierId = supplier.id;
      console.log(`Using supplier from junction table: ${supplier.name} (ID: ${supplierId})`);
    } 
    // Fallback to old supplierId field for backward compatibility
    else if (product.supplierId) {
      supplier = await Supplier.findByPk(product.supplierId);
      if (supplier) {
        supplierId = supplier.id;
        console.log(`Using supplier from legacy field: ${supplier.name} (ID: ${supplierId})`);
      } else {
        console.warn(`Legacy supplier ${product.supplierId} not found for product ${productId}`);
      }
    } else {
      console.warn(`No supplier assigned to product ${productId}`);
    }

    // Validate address
    let addressRecord = null;
    if (addressId) {
      addressRecord = await Address.findOne({
        where: {
          id: addressId,
          CustomerId: req.session.customerId
        }
      });

      if (!addressRecord) {
        return res.status(400).json({ error: "Invalid address ID" });
      }
    }

    // Calculate Total Price
    const totalAmount = Number(product.price) * Number(qty);

    // Create the Order
    const order = await Order.create({
      CustomerId: req.session.customerId,
      productId,
      qty,
      supplierId: supplierId, // May be null if no supplier assigned

      // Customer Info
      customerName,
      customerPhone,
      customerAddress,
      addressId,

      // Payment Info
      paymentUNR,
      paymentScreenshot,
      paymentStatus: "pending",

      totalAmount,
      status: "created"
    });

    // Create admin notification for new order
    try {
      await Notification.create({
        type: "order_created",
        title: "New Order Received",
        message: `Order #${order.id} from ${customerName} (${customerPhone}) - ₹${totalAmount}`,
        isRead: false
      });
    } catch (notifErr) {
      console.error("Notification creation failed:", notifErr);
    }

    res.json({
      success: true,
      orderId: order.id,
      message: "Order created successfully"
    });

  } catch (err) {
    console.error("ORDER CREATION ERROR:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// TEST ENDPOINT - Check if route is working
router.get("/test", (req, res) => {
  res.json({ message: "Orders route is working!", timestamp: new Date().toISOString() });
});

// CREATE GUEST ORDER (No login required)
router.post("/create-guest", async (req, res) => {
  console.log("=".repeat(50));
  console.log("📦 Guest order creation request received");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("=".repeat(50));

  try {
    const {
      productId,
      qty,
      customerName,
      customerPhone,
      customerAddress,
      totalAmount,
      serviceInfo
    } = req.body;

    console.log("📋 Validating fields...");
    console.log("  productId:", productId, typeof productId);
    console.log("  qty:", qty, typeof qty);
    console.log("  customerName:", customerName);
    console.log("  customerPhone:", customerPhone);
    console.log("  customerAddress:", customerAddress);
    console.log("  totalAmount:", totalAmount);

    if (!qty || !customerName || !customerPhone || !customerAddress) {
      console.error("❌ Missing required fields:", {
        productId: !!productId,
        qty: !!qty,
        customerName: !!customerName,
        customerPhone: !!customerPhone,
        customerAddress: !!customerAddress
      });
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          productId: !productId,
          qty: !qty,
          customerName: !customerName,
          customerPhone: !customerPhone,
          customerAddress: !customerAddress
        }
      });
    }

    // Check if this is a service order (no numeric productId, but serviceInfo present)
    const isServiceOrder =
      (!productId || Number(productId) === 0) && !!serviceInfo;

    let product = null;
    let supplierId = null;
    let productPrice = 0;

    if (isServiceOrder) {
      // Service order - use price from serviceInfo or totalAmount
      productPrice = Number(totalAmount || serviceInfo?.price || 0);
      console.log("🔧 Service order detected:", serviceInfo);
    } else {
      // Regular product order - validate product exists
      if (!productId) {
        return res
          .status(400)
          .json({ error: "Product ID is required for product orders" });
      }

      product = await Product.findByPk(productId, {
        include: [
          {
            model: Supplier,
            as: "suppliers",
            through: {
              where: { isActive: true },
              attributes: ["price", "stock", "isActive"]
            }
          }
        ]
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Get supplier from many-to-many relationship
      let supplier = null;
      if (product.suppliers && product.suppliers.length > 0) {
        supplier = product.suppliers[0];
        supplierId = supplier.id;
      } else if (product.supplierId) {
        supplier = await Supplier.findByPk(product.supplierId);
        if (supplier) {
          supplierId = supplier.id;
        }
      }

      // Calculate Total Price (use provided totalAmount or calculate)
      productPrice = Number(product.price || 0);
    }

    const itemQty = Number(qty || 1);
    const calculatedAmount =
      Number(totalAmount) || productPrice * itemQty || 0;

    console.log("💰 Price calculation:", {
      productPrice,
      qty: itemQty,
      providedTotalAmount: totalAmount,
      calculatedAmount
    });

    if (calculatedAmount <= 0) {
      console.error("❌ Invalid total amount calculated:", calculatedAmount);
      return res.status(400).json({
        error: "Invalid order amount",
        details: "Product price or quantity is invalid",
        productPrice,
        qty: itemQty,
        calculatedAmount
      });
    }

    // Prepare order data - include all fields that exist in the model
    const orderData = {
      CustomerId: null, // Guest order
      productId: isServiceOrder ? null : Number(productId), // null for services
      qty: itemQty,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerAddress: String(customerAddress).trim(),
      addressId: null, // No saved address for guest
      paymentStatus: "pending",
      totalAmount: Number(calculatedAmount),
      status: "created",
      // Store service info in paymentInfo JSON field for services
      paymentInfo: isServiceOrder ? serviceInfo : null
    };

    // Add supplierId only if it exists (product orders only)
    if (!isServiceOrder && supplierId) {
      orderData.supplierId = Number(supplierId);
      console.log("👤 Supplier ID:", supplierId);
    } else if (!isServiceOrder) {
      console.log("⚠️  No supplier assigned to product");
    }

    console.log(
      "📦 Creating order with data:",
      JSON.stringify(orderData, null, 2)
    );

    // Create the Order (without CustomerId for guest)
    let order;
    try {
      order = await Order.create(orderData);
      console.log("✅ Order created successfully! ID:", order.id);
    } catch (createErr) {
      console.error("❌ Order.create() failed:");
      console.error("  Error name:", createErr.name);
      console.error("  Error message:", createErr.message);
      console.error("  Error original:", createErr.original?.message);
      console.error("  SQL:", createErr.sql);
      console.error("  Parameters:", createErr.parameters);
      throw createErr; // Re-throw to be caught by outer catch
    }

    // Create admin notification for new order
    try {
      await Notification.create({
        type: "order_created",
        title: "New Guest Order Received",
        message: `Guest Order #${order.id} from ${customerName} (${customerPhone}) - ₹${calculatedAmount}`,
        isRead: false
      });
    } catch (notifErr) {
      console.error("Notification creation failed:", notifErr);
    }

    res.json({
      success: true,
      orderId: order.id,
      id: order.id,
      message: "Guest order created successfully"
    });
  } catch (err) {
    console.error("GUEST ORDER CREATION ERROR:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      original: err.original?.message,
      sql: err.sql
    });
    res.status(500).json({
      error: "Failed to create guest order",
      message: err.message,
      details:
        process.env.NODE_ENV === "development" ? err.stack : undefined,
      original: err.original?.message
    });
  }
});

router.put("/:id/unr", requireLogin, async (req, res) => {
  try {
    const { paymentUNR } = req.body;

    await Order.update(
      { paymentUNR },
      {
        where: {
          id: req.params.id,
          CustomerId: req.session.customerId,
        },
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UNR UPDATE ERROR:", err);
    res.status(500).json({ error: "Failed to update UNR" });
  }
});


// LIST ORDERS FOR LOGGED-IN CUSTOMER
router.get("/", requireLogin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { CustomerId: req.session.customerId },
      order: [["createdAt", "DESC"]],
      include: [
        { model: Product },
        { model: Supplier },
        {
          model: Address,
          attributes: ["name", "phone", "addressLine", "city", "state", "pincode", "isDefault"]
        }
      ]
    });
    res.json(orders);
  } catch (err) {
    console.error("ORDER LIST ERROR:", err);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// Alias for legacy frontend call
router.get("/customer/orders", requireLogin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { CustomerId: req.session.customerId },
      order: [["createdAt", "DESC"]],
      include: [
        { model: Product },
        { model: Supplier },
        {
          model: Address,
          attributes: ["name", "phone", "addressLine", "city", "state", "pincode", "isDefault"]
        }
      ]
    });
    res.json(orders);
  } catch (err) {
    console.error("ORDER LIST ERROR:", err);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// GET ORDER DETAILS (with Address + Product + Supplier)
router.get("/:id", requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        CustomerId: req.session.customerId
      },
      include: [
        { model: Product },
        { model: Supplier },
        {
          model: Address,
          attributes: ["name", "phone", "addressLine", "city", "state", "pincode", "isDefault"]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);

  } catch (err) {
    console.error("ORDER DETAILS ERROR:", err);
    res.status(500).json({ error: "Failed to load order details" });
  }
});
router.post("/submit-payment", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const customerId = req.session.customerId; // Can be null for guest orders
    const orderId = req.body.orderId;
    
    if (!orderId) return res.status(400).json({ msg: "Missing orderId" });

    // Allow either screenshot OR transaction ID (at least one required)
    if (!req.file && (!req.body.unr || req.body.unr.trim().length < 6)) {
      return res.status(400).json({ msg: "Please provide either a payment screenshot or a transaction ID (minimum 6 characters)" });
    }

    // Find order - support both logged-in and guest orders
    let order;
    if (customerId) {
      // Logged-in user: find order by id and customerId
      order = await Order.findOne({ where: { id: orderId, CustomerId: customerId } });
    } else {
      // Guest user: find order by id only (CustomerId should be null for guest orders)
      order = await Order.findOne({ 
        where: { 
          id: orderId,
          CustomerId: null // Guest orders have null CustomerId
        } 
      });
    }
    
    if (!order) {
      return res.status(404).json({ 
        msg: "Order not found. Please ensure you're using the correct order ID." 
      });
    }

    // update specific order info
    let screenshotPath = null;
    if (req.file) {
      screenshotPath = `/uploads/payment/${req.file.filename}`;
      order.paymentScreenshot = screenshotPath;
    }

    order.paymentStatus = "pending";
    if (req.body.unr && req.body.unr.trim().length >= 6) {
      order.paymentUNR = req.body.unr.trim();
    }
    await order.save();

    // notify admin to approve payment
    try {
      const customerInfo = customerId 
        ? `Customer ID: ${customerId}` 
        : `Guest Order - Customer: ${order.customerName || 'N/A'}, Phone: ${order.customerPhone || 'N/A'}`;
      
      await Notification.create({
        type: "payment_submitted",
        title: "Payment Submitted",
        message: `Order #${order.id} payment submitted. ${customerInfo}. UNR: ${order.paymentUNR || 'N/A'}. Approve in Admin → Payments.`,
        isRead: false
      });
    } catch (notifErr) {
      console.error("Payment notification creation failed:", notifErr);
    }

    res.json({ success: true, msg: "Payment submitted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET INVOICE (PDF Download)
router.get("/:id/invoice", requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        CustomerId: req.session.customerId
      },
      include: [
        { model: Product },
        { model: Supplier },
        {
          model: Address,
          attributes: ["name", "phone", "addressLine", "city", "state", "pincode"]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // For now, generate a simple text/HTML invoice
    // In production, you'd use a library like pdfkit or puppeteer
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
          .header { border-bottom: 3px solid #c8102e; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; color: #c8102e; }
          .invoice-title { font-size: 24px; margin: 20px 0 0 0; }
          .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
          .info-section { flex: 1; }
          .info-section label { font-weight: bold; color: #666; }
          .info-section p { margin: 5px 0; }
          .order-items { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .order-items th { background: #ffd500; padding: 10px; text-align: left; font-weight: bold; }
          .order-items td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { float: right; width: 300px; margin: 30px 0; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total-row.final { border-bottom: 3px solid #c8102e; font-weight: bold; font-size: 16px; }
          .address-section { background: #f9f9f9; padding: 15px; margin: 30px 0; border-radius: 5px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">RR Nagar</div>
            <h2 class="invoice-title">Invoice</h2>
          </div>

          <div class="invoice-info">
            <div class="info-section">
              <label>Invoice #:</label>
              <p>${order.id}</p>
              <label>Date:</label>
              <p>${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <label>Status:</label>
              <p style="color: #c8102e; font-weight: bold;">${order.status.toUpperCase()}</p>
            </div>
            <div class="info-section">
              <label>Payment Status:</label>
              <p style="color: #c8102e; font-weight: bold;">${order.paymentStatus.toUpperCase()}</p>
              <label>Order Type:</label>
              <p>${order.type ? order.type.charAt(0).toUpperCase() + order.type.slice(1) : 'Delivery'}</p>
            </div>
          </div>

          <div class="address-section">
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">Delivery Address:</label>
            <p><strong>${order.customerName || 'Customer'}</strong></p>
            <p>${order.customerAddress || (order.Address ? 
              order.Address.addressLine + ', ' + order.Address.city + ', ' + order.Address.state + ' - ' + order.Address.pincode
              : 'Address not provided')}</p>
            <p>📞 ${order.customerPhone || 'Phone not provided'}</p>
          </div>

          <table class="order-items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Supplier</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${order.Product ? order.Product.title || order.Product.name : 'Product'}</strong>
                </td>
                <td>${order.Supplier ? order.Supplier.shopName : 'Supplier'}</td>
                <td>₹${order.totalAmount}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${order.totalAmount - (order.platformFee || 0)}</span>
            </div>
            ${order.platformFee ? `
            <div class="total-row">
              <span>Platform Fee:</span>
              <span>₹${order.platformFee}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>₹${order.totalAmount}</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>RR Nagar - Your trusted local marketplace</p>
            <p>For support, contact us at support@rrnagar.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send as HTML (for now, user can print to PDF)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.id}.html"`);
    res.send(invoiceHTML);

  } catch (err) {
    console.error("INVOICE GENERATION ERROR:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

export default router;
