import express from "express";
import { models } from "../../config/database.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
const { Order, Product, ProductSupplier, Supplier, Customer } = models;
const router = express.Router();

/* Supplier Login Middleware - supports both session and JWT */
function requireSupplier(req, res, next) {
  // Check session first (for traditional login)
  if (req.session && req.session.supplierId) {
    req.supplierId = req.session.supplierId;
    return next();
  }

  // Check JWT token (for OAuth login)
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
        // Also set session for future requests
        req.session.supplierId = decoded.id;
        return next();
      }
    } catch (err) {
      // JWT invalid, continue to check session
    }
  }

  return res.status(401).json({ error: "Supplier not logged in" });
}

/* ============================================================
   SUPPLIER DASHBOARD STATS
   GET /api/supplier/dashboard
============================================================ */
router.get("/", requireSupplier, async (req, res) => {
  try {
    const supplierId = req.supplierId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Get all orders for this supplier
    // Orders are linked to suppliers through ProductSupplier junction table
    // First get all products for this supplier using the many-to-many relationship
    const supplier = await Supplier.findByPk(supplierId, {
      include: [{
        model: Product,
        through: { where: { supplierId, isActive: true } },
        as: 'products'
      }]
    });

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const productIds = (supplier.products || []).map(p => p.id);

    // Get orders for these products
    const allOrders = await Order.findAll({
      where: {
        ProductId: { [Op.in]: productIds }
      },
      include: [
        { model: Product },
        { model: Customer }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter orders by date and status
    const todayOrdersList = allOrders.filter(o => new Date(o.createdAt) >= todayStart);
    const pendingOrdersList = allOrders.filter(o => ['created', 'paid'].includes(o.status));
    const deliveredOrdersList = allOrders.filter(o => o.status === 'delivered');
    const approvedOrdersList = allOrders.filter(o => o.paymentStatus === 'approved');

    const todayOrders = todayOrdersList.length;
    const pendingOrders = pendingOrdersList.length;
    const deliveredOrders = deliveredOrdersList.length;

    // Revenue calculations
    const revenueToday = approvedOrdersList
      .filter(o => new Date(o.createdAt) >= todayStart)
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

    const revenueWeek = approvedOrdersList
      .filter(o => new Date(o.createdAt) >= weekStart)
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

    const revenueMonth = approvedOrdersList
      .filter(o => new Date(o.createdAt) >= monthStart)
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

    const revenueYear = approvedOrdersList
      .filter(o => new Date(o.createdAt) >= yearStart)
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

    // Total products
    const totalProducts = productIds.length;

    // Unique customers (buyers)
    const customerIds = [...new Set(allOrders.map(o => o.CustomerId).filter(Boolean))];
    const uniqueCustomers = customerIds.length;

    // Weekly revenue data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayRevenue = approvedOrdersList
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd;
        })
        .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

      weeklyData.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue
      });
    }

    // Monthly revenue data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = approvedOrdersList
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= monthDate && orderDate <= monthEnd;
        })
        .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

      monthlyData.push({
        month: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        revenue: monthRevenue
      });
    }

    // Top products by orders
    const productMap = {};
    allOrders.forEach(order => {
      if (order.ProductId && order.Product) {
        const pid = order.ProductId;
        if (!productMap[pid]) {
          productMap[pid] = {
            productId: pid,
            productTitle: order.Product.title || 'Unknown',
            orderCount: 0,
            revenue: 0
          };
        }
        productMap[pid].orderCount++;
        if (order.paymentStatus === 'approved') {
          productMap[pid].revenue += parseFloat(order.totalAmount) || 0;
        }
      }
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    res.json({
      stats: {
        todayOrders,
        pendingOrders,
        deliveredOrders,
        revenueToday,
        revenueWeek,
        revenueMonth,
        revenueYear,
        totalProducts,
        uniqueCustomers
      },
      charts: {
        weekly: weeklyData,
        monthly: monthlyData
      },
      topProducts
    });
  } catch (err) {
    console.error("Supplier dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard data", message: err.message });
  }
});

export default router;
