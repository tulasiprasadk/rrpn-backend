import express from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { models, sequelize } from "../config/database.js";

const { Category, Ad, AnalyticsVisit, Product, Admin, Supplier, Order, Customer, Notification } = models;

import { translateToKannada } from '../services/translator.js';
const router = express.Router();

// Router-level debug logger for all /admin routes
router.use((req, res, next) => {
  try {
    console.log('[ADMIN ROUTER] incoming request', { path: req.path, method: req.method, authorization: req.headers && req.headers.authorization });
  } catch (e) {}
  next();
});

// Allow explicit debug auth only when explicitly enabled and NOT in production
const ALLOW_DEBUG_AUTH = process.env.ALLOW_DEBUG_AUTH === 'true' && process.env.NODE_ENV !== 'production';

/* ======================================================
   MIDDLEWARE
====================================================== */

// Middleware to check if current admin is super admin
async function requireSuperAdmin(req, res, next) {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const admin = await Admin.findByPk(req.session.adminId);
    if (!admin || admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    req.currentAdmin = admin;
    next();
  } catch (err) {
    console.error('Super admin check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Middleware to check if current user is any approved admin (super/admin/moderator)
async function requireAdmin(req, res, next) {
  try {
    // Accept Bearer admin_* tokens for dev usage
    const authHeader = (req.headers && req.headers.authorization) || '';
    console.log('[ADMIN middleware] requireAdmin incoming authorization:', authHeader);
    let admin = null;
    if (authHeader.startsWith('Bearer admin_')) {
      const parts = authHeader.split('_');
      const id = Number(parts[1]);
      if (!Number.isNaN(id)) {
        admin = await Admin.findByPk(id);
        console.log('[ADMIN middleware] requireAdmin token auth:', { authHeader, parsedId: id, found: !!admin });
      }
    }

    if (!admin) {
      if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: 'Not logged in' });
      }
      admin = await Admin.findByPk(req.session.adminId);
    }

    if (!admin || !admin.isActive || !admin.isApproved) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.currentAdmin = admin;
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/* ======================================================
   AUTH
====================================================== */

// Test endpoint to verify admin account (for debugging)
router.get('/test-admin', async (req, res) => {
  try {
    const admin = await Admin.findOne({ where: { email: 'admin@rrnagar.com' } });
    if (!admin) {
      return res.json({ error: 'Admin not found' });
    }
    
    const testPassword = 'admin123';
    const passwordMatch = await bcrypt.compare(testPassword, admin.password);
    
    res.json({
      found: true,
      email: admin.email,
      isActive: admin.isActive,
      isApproved: admin.isApproved,
      passwordHash: admin.password ? admin.password.substring(0, 20) + '...' : 'null',
      passwordMatch: passwordMatch,
      role: admin.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Admin login - TEMPORARY: Password check disabled for debugging
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password, identifier } = req.body;
    const idValue = identifier || email || phone;
    if (!idValue) {
      return res.status(400).json({ message: 'Email or phone required' });
    }
    console.log('🔓 Admin login attempt:', idValue);

    // Try to find by email first, then phone
    let admin = null;
    if (email) admin = await Admin.findOne({ where: { email } });
    if (!admin && phone) admin = await Admin.findOne({ where: { phone } });
    if (!admin && identifier) {
      admin = await Admin.findOne({ where: { [Op.or]: [{ email: identifier }, { phone: identifier }] } });
    }

    if (!admin) {
      console.log('❌ Admin not found:', idValue);
      if (ALLOW_DEBUG_AUTH) {
        console.log('🔧 ALLOW_DEBUG_AUTH enabled — creating unapproved admin for local testing');
        try {
          const hashedPassword = await bcrypt.hash(password || 'temp123', 10);
          admin = await Admin.create({
            name: 'Super Admin',
            email: email || null,
            phone: phone || identifier || null,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            isApproved: false,
            approvedAt: null
          });
          return res.status(403).json({ message: 'Admin created locally but not approved. Set isApproved=true in DB or use seed to create an approved admin.' });
        } catch (createErr) {
          console.error('❌ Failed to create admin:', createErr);
          return res.status(500).json({ message: 'Failed to create admin account', error: createErr.message });
        }
      }
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Ensure account is active and approved
    if (!admin.isActive) {
      return res.status(403).json({ error: 'Admin account is deactivated' });
    }

    if (!admin.isApproved) {
      return res.status(403).json({ error: 'Admin account not approved' });
    }

    // Require password and verify hash
    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const passwordOk = await bcrypt.compare(password, admin.password || '');
    if (!passwordOk) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    await admin.update({ lastLogin: new Date() });
    req.session.adminId = admin.id;

    const token = `admin_${admin.id}_${Date.now()}`;
    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        name: admin.name,
        role: admin.role
      },
      token
    });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.adminId = null;
  res.json({ success: true });
});

// Session check - MUST respond immediately, no DB queries
// This route MUST always respond - no hanging, no timeouts
router.get('/me', (req, res) => {
  try {
    // Log for debugging
    console.log('[ADMIN /me] Route called at', new Date().toISOString());
    console.log('[ADMIN /me] Request path:', req.path);
    console.log('[ADMIN /me] Request url:', req.url);
    console.log('[ADMIN /me] Session:', {
      hasSession: !!req.session,
      adminId: req.session?.adminId || null,
      sessionId: req.sessionID || null
    });
    
    // Allow token-based auth as fallback for serverless instances
    const authHeader = req.headers.authorization || "";
    const hasToken = authHeader.startsWith("Bearer admin_");

    // Check session immediately - no async, no DB, no blocking
    if (!hasToken && (!req.session || !req.session.adminId)) {
      console.log('[ADMIN /me] Not logged in, returning 401');
      res.status(401).json({ 
        loggedIn: false,
        authenticated: false
      });
      return;
    }
    
    // Return immediately with session data - no DB query needed
    console.log('[ADMIN /me] Logged in, returning success');
    res.status(200).json({
      loggedIn: true,
      authenticated: true,
      adminId: req.session?.adminId || null,
      tokenAuth: hasToken
    });
    return;
  } catch (err) {
    console.error('[ADMIN /me] Error:', err);
    // Always respond, even on error
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal error',
        loggedIn: false
      });
    }
  }
});

// Change password - TEMPORARY: Old password check disabled for debugging
router.post('/change-password', async (req, res) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const { oldPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const admin = await Admin.findByPk(req.session.adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    // By default require old password verification. Allow bypass only when explicitly enabled for local debugging.
    if (!ALLOW_DEBUG_AUTH) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Old password required' });
      }
      const ok = await bcrypt.compare(oldPassword, admin.password || '');
      if (!ok) {
        return res.status(400).json({ error: 'Old password incorrect' });
      }
    } else {
      console.log('⚠️ ALLOW_DEBUG_AUTH enabled: skipping old password verification');
    }

    // Hash new password and persist
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await admin.update({ password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ======================================================
   SUPER ADMIN
====================================================== */

router.post('/admins/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (admin.isActive) {
      return res.json({ success: true, message: 'Admin already active' });
    }

    await admin.update({ isActive: true });
    res.json({ success: true, message: 'Admin approved' });
  } catch (err) {
    console.error('Approve admin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all admins
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isActive', 'isApproved', 'approvedAt', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(admins);
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending admins
router.get('/admins/pending', requireSuperAdmin, async (req, res) => {
  try {
    const pendingAdmins = await Admin.findAll({ 
      where: { isApproved: false },
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
    });
    res.json(pendingAdmins);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new admin (super admin only)
router.post('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role = 'admin', autoApprove = false } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ error: 'Name, password and either email or phone are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const validRoles = ['super_admin', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Check if email or phone already exists
    const existing = await Admin.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
    if (existing) {
      return res.status(400).json({ error: 'Email or phone already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      name,
      email: email || null,
      phone: phone || null,
      password: hashedPassword,
      role,
      isActive: true,
      isApproved: autoApprove,
      approvedAt: autoApprove ? new Date() : null,
      approvedBy: autoApprove ? req.currentAdmin.id : null
    });

    res.status(201).json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        isApproved: admin.isApproved
      },
      message: autoApprove ? 'Admin created and approved' : 'Admin created (pending approval)'
    });
  } catch (err) {
    console.error('Create admin error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email or phone already exists' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/admins/:id/approve-admin', requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (admin.isApproved) {
      return res.json({ success: true, message: 'Admin already approved' });
    }

    await admin.update({ 
      isApproved: true,
      approvedBy: req.currentAdmin.id,
      approvedAt: new Date()
    });
    res.json({ success: true, message: 'Admin approved' });
  } catch (err) {
    console.error('Approve admin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin (activate/deactivate)
router.put('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    await admin.update({ isActive });
    res.json({ success: true, message: `Admin ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error('Update admin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ======================================================
   SUPPLIER APPROVAL
====================================================== */

// Get pending suppliers (KYC submitted, waiting for approval)
router.get('/suppliers/pending', requireSuperAdmin, async (req, res) => {
  try {
    const pendingSuppliers = await Supplier.findAll({ 
      where: { status: 'kyc_submitted' },
      order: [['kycSubmittedAt', 'DESC']]
    });
    res.json(pendingSuppliers);
  } catch (err) {
    console.error('Get pending suppliers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all suppliers (TEMPORARY: bypass auth for connectivity testing)
router.get('/suppliers', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const suppliers = await Supplier.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(suppliers);
  } catch (err) {
    console.error('Get suppliers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve supplier
router.post('/suppliers/:id/approve', requireAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (supplier.status === 'approved') {
      return res.json({ success: true, message: 'Supplier already approved' });
    }

    if (supplier.status !== 'kyc_submitted') {
      return res.status(400).json({ 
        error: 'Supplier KYC must be submitted before approval',
        currentStatus: supplier.status
      });
    }

    // Use a transaction to update supplier status and mark notifications atomically
    await sequelize.transaction(async (t) => {
      await supplier.update({
        status: 'approved',
        approvedBy: req.currentAdmin.id,
        approvedAt: new Date()
      }, { transaction: t });

      try {
        await Notification.update(
          { isRead: true },
          {
            where: {
              audience: 'admin',
              type: 'supplier_registration',
              [Op.or]: [
                { message: { [Op.like]: `%${supplier.email || supplier.phone}%` } },
                { meta: { [Op.like]: `%${supplier.id}%` } }
              ]
            },
            transaction: t
          }
        );
      } catch (notifyErr) {
        console.error('Error marking supplier notifications read (transaction):', notifyErr);
        // Don't throw here — notification update failure should not roll back supplier approval
      }
    });

    // TODO: Send notification to supplier about approval

    res.json({ 
      success: true, 
      message: 'Supplier approved successfully',
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        status: supplier.status
      }
    });
  } catch (err) {
    console.error('Approve supplier error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject supplier
router.post('/suppliers/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (supplier.status === 'rejected') {
      return res.json({ success: true, message: 'Supplier already rejected' });
    }

    // Use a transaction to update rejection and mark notifications atomically where possible
    await sequelize.transaction(async (t) => {
      await supplier.update({
        status: 'rejected',
        rejectionReason: reason.trim()
      }, { transaction: t });

      try {
        await Notification.update(
          { isRead: true },
          {
            where: {
              audience: 'admin',
              type: 'supplier_registration',
              [Op.or]: [
                { message: { [Op.like]: `%${supplier.email || supplier.phone}%` } },
                { meta: { [Op.like]: `%${supplier.id}%` } }
              ]
            },
            transaction: t
          }
        );
      } catch (notifyErr) {
        console.error('Error marking supplier notifications read (reject, transaction):', notifyErr);
        // don't fail the whole transaction if notifications fail
      }
    });

    // TODO: Send notification to supplier about rejection

    res.json({ 
      success: true, 
      message: 'Supplier rejected',
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        status: supplier.status
      }
    });
  } catch (err) {
    console.error('Reject supplier error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ======================================================
   ORDER / PAYMENT COMPATIBILITY
====================================================== */

function getOrderIdFromAdminNotification(notification) {
  if (!notification) return null;

  try {
    if (notification.meta) {
      const meta = typeof notification.meta === 'string'
        ? JSON.parse(notification.meta)
        : notification.meta;
      if (meta?.orderId) return Number(meta.orderId) || meta.orderId;
    }
  } catch (_err) {
    // Ignore invalid JSON and fall back to message parsing.
  }

  const message = notification.message || '';
  const match = message.match(/order\s*#(\d+)/i) || message.match(/\b#(\d+)\b/);
  return match ? Number(match[1]) || match[1] : null;
}

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Product },
        { model: Supplier },
        { model: models.Address }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (err) {
    console.error('Admin compatibility orders fetch error:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: Product },
        { model: Supplier },
        { model: models.Address }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Admin compatibility order detail error:', err);
    res.status(500).json({ error: 'Failed to load order details' });
  }
});

router.put('/orders/:id/approve', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      paymentStatus: 'approved',
      status: 'paid'
    });

    if (order.CustomerId) {
      await Notification.create({
        type: 'payment_approved',
        title: 'Payment Approved',
        message: `Your payment for order #${order.id} is approved. Delivery will be scheduled soon.`,
        isRead: false,
        audience: 'customer',
        customerId: order.CustomerId,
        meta: JSON.stringify({
          orderId: order.id,
          route: `/my-orders/${order.id}`
        })
      });
    }

    res.json({ success: true, message: 'Payment approved', order });
  } catch (err) {
    console.error('Admin compatibility approve error:', err);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

router.put('/orders/:id/reject', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      paymentStatus: 'rejected',
      status: 'payment_failed'
    });

    if (order.CustomerId) {
      await Notification.create({
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your payment for order #${order.id} could not be verified. Please re-upload screenshot or correct UNR.`,
        isRead: false,
        audience: 'customer',
        customerId: order.CustomerId,
        meta: JSON.stringify({
          orderId: order.id,
          route: `/my-orders/${order.id}`
        })
      });
    }

    res.json({ success: true, message: 'Payment rejected', order });
  } catch (err) {
    console.error('Admin compatibility reject error:', err);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const pending = await Order.findAll({
      where: { paymentStatus: 'pending' },
      include: [Product, Supplier],
      order: [['id', 'DESC']]
    });

    res.json(pending);
  } catch (err) {
    console.error('Admin compatibility payments fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payments/:id/approve', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      paymentStatus: 'approved',
      status: 'paid'
    });

    res.json({ ok: true, order });
  } catch (err) {
    console.error('Admin compatibility payment approve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payments/:id/reject', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      paymentStatus: 'rejected',
      status: 'payment_failed'
    });

    res.json({ ok: true, order });
  } catch (err) {
    console.error('Admin compatibility payment reject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payments/notifications/:notificationId/approve', requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const orderId = getOrderIdFromAdminNotification(notification);
    if (!orderId) {
      return res.status(404).json({ error: 'Order not found for this notification' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      paymentStatus: 'approved',
      status: 'paid'
    });
    await notification.update({ isRead: true });

    res.json({ ok: true, order });
  } catch (err) {
    console.error('Admin compatibility notification approve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payments/notifications/:notificationId/reject', requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const orderId = getOrderIdFromAdminNotification(notification);
    if (!orderId) {
      return res.status(404).json({ error: 'Order not found for this notification' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      paymentStatus: 'rejected',
      status: 'payment_failed'
    });
    await notification.update({ isRead: true });

    res.json({ ok: true, order });
  } catch (err) {
    console.error('Admin compatibility notification reject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ======================================================
   DASHBOARD
====================================================== */

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Total counts
    const totalSuppliers = await Supplier.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const totalCustomers = await Customer.count();
    const totalAds = await Ad.count();
    
    // Pending suppliers (KYC submitted, awaiting approval)
    const pendingSuppliers = await Supplier.count({ where: { status: 'kyc_submitted' } });
    
    // Revenue calculations
    const allOrders = await Order.findAll({
      where: { paymentStatus: 'approved' }
    });
    
    const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart);
    const revenueToday = todayOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart);
    const revenueMonth = monthOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    
    const yearOrders = allOrders.filter(o => new Date(o.createdAt) >= yearStart);
    const revenueYear = yearOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

    // Order status counts
    const pendingOrders = await Order.count({ where: { status: { [Op.in]: ['created', 'paid'] } } });
    const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
    const approvedOrders = await Order.count({ where: { paymentStatus: 'approved' } });

    res.json({
      totalSuppliers,
      totalProducts,
      totalOrders,
      totalCustomers,
      totalAds,
      pendingSuppliers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueToday: Math.round(revenueToday * 100) / 100,
      revenueMonth: Math.round(revenueMonth * 100) / 100,
      revenueYear: Math.round(revenueYear * 100) / 100,
      pendingOrders,
      deliveredOrders,
      approvedOrders,
      todayOrders: todayOrders.length
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Revenue chart data (monthly for last 12 months)
router.get('/charts/revenue', async (req, res) => {
  try {
    const now = new Date();
    const revenueData = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthOrders = await Order.findAll({
        where: {
          paymentStatus: 'approved',
          createdAt: {
            [Op.gte]: monthDate,
            [Op.lte]: monthEnd
          }
        }
      });

      const monthRevenue = monthOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

      revenueData.push({
        month: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        total: Math.round(monthRevenue * 100) / 100
      });
    }

    res.json(revenueData);
  } catch (err) {
    console.error('Revenue chart error:', err);
    res.json([]);
  }
});

// Orders chart data (monthly for last 12 months)
router.get('/charts/orders', async (req, res) => {
  try {
    const now = new Date();
    const ordersData = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthOrdersCount = await Order.count({
        where: {
          createdAt: {
            [Op.gte]: monthDate,
            [Op.lte]: monthEnd
          }
        }
      });

      ordersData.push({
        month: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        count: monthOrdersCount
      });
    }

    res.json(ordersData);
  } catch (err) {
    console.error('Orders chart error:', err);
    res.json([]);
  }
});

/* ======================================================
   CATEGORIES & ADS
====================================================== */

router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['id', 'ASC']]
    });
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.get('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Failed to load category' });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const cat = await Category.create({ name: req.body.name, icon: req.body.icon || null });
    res.json(cat);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await category.update({
      name: req.body.name ?? category.name,
      icon: req.body.icon ?? category.icon
    });
    res.json(category);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Category.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.post('/ads', requireAdmin, async (req, res) => {
  try {
    const ad = await Ad.create(req.body);
    res.json(ad);
  } catch (err) {
    console.error('Create ad error:', err);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

/* ======================================================
   ANALYTICS
====================================================== */

router.get('/analytics/visits', async (req, res) => {
  const visits = await AnalyticsVisit.count();
  res.json({ visits });
});

/* ======================================================
   PRODUCTS
====================================================== */

// GET /api/admin/products/:id - Get single product for editing
router.get('/products/:id', async (req, res) => {
  try {
    const { Category } = models;
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// PUT /api/admin/products/:id - Update product (including price)
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { title, price, description, unit, variety, subVariety, categoryId, monthlyPrice, hasMonthlyPackage, yearlyPrice, hasYearlyPackage } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (variety !== undefined) updateData.variety = variety;
    if (subVariety !== undefined) updateData.subVariety = subVariety;
    if (categoryId !== undefined) updateData.CategoryId = categoryId ? parseInt(categoryId) : null;
    if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice ? parseFloat(monthlyPrice) : null;
    if (hasMonthlyPackage !== undefined) updateData.hasMonthlyPackage = hasMonthlyPackage === true || hasMonthlyPackage === 'true';
    if (yearlyPrice !== undefined) updateData.yearlyPrice = yearlyPrice ? parseFloat(yearlyPrice) : null;
    if (hasYearlyPackage !== undefined) updateData.hasYearlyPackage = hasYearlyPackage === true || hasYearlyPackage === 'true';

    await product.update(updateData);

    console.log('✅ Product updated:', {
      id: product.id,
      title: updateData.title || product.title,
      price: updateData.price !== undefined ? updateData.price : product.price,
      monthlyPrice: updateData.monthlyPrice !== undefined ? updateData.monthlyPrice : product.monthlyPrice
    });

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { title, description, price, unit, categoryId, monthlyPrice, hasMonthlyPackage, yearlyPrice, hasYearlyPackage } = req.body;
    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price required' });
    }

    const product = await Product.create({
      title,
      description: description || '',
      price: Number(price),
      unit: unit || 'piece',
      CategoryId: categoryId || null,
      monthlyPrice: monthlyPrice ? Number(monthlyPrice) : null,
      hasMonthlyPackage: hasMonthlyPackage === true || hasMonthlyPackage === 'true',
      yearlyPrice: yearlyPrice ? Number(yearlyPrice) : null,
      hasYearlyPackage: hasYearlyPackage === true || hasYearlyPackage === 'true',
      isTemplate: true,
      supplierId: null
    });

    try {
      await product.update({
        titleKannada: await translateToKannada(product.title),
        descriptionKannada: product.description
          ? await translateToKannada(product.description)
          : ''
      });
    } catch (e) {
      console.warn('Translation skipped');
    }

    res.status(201).json(product);
  } catch (err) {
    console.error('Product create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ======================================================
   ROOT
====================================================== */

router.get('/', (req, res) => {
  res.json({ message: 'Admin API running' });
});

export default router;
