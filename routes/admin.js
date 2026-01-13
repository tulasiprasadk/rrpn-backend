import express from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { models } from "../config/database.js";

const { Category, Ad, AnalyticsVisit, Product, Admin, Supplier, Order, Customer } = models;

import { translateToKannada } from '../services/translator.js';
const router = express.Router();

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
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    console.log('🔓 Admin login attempt (PASSWORD CHECK DISABLED):', email);
    console.log('⚠️  WARNING: This is a temporary bypass for debugging!');

    let admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      console.log('❌ Admin not found:', email);
      console.log('🔧 Creating admin account automatically...');
      
      // Auto-create admin if it doesn't exist
      try {
        const hashedPassword = await bcrypt.hash('temp123', 10);
        admin = await Admin.create({
          name: 'Super Admin',
          email: email,
          password: hashedPassword,
          role: 'super_admin',
          isActive: true,
          isApproved: true,
          approvedAt: new Date()
        });
        console.log('✅ Admin account created automatically:', admin.email);
      } catch (createErr) {
        console.error('❌ Failed to create admin:', createErr);
        return res.status(500).json({ message: 'Failed to create admin account', error: createErr.message });
      }
    }

    console.log('✅ Admin found:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
      isApproved: admin.isApproved,
      role: admin.role
    });

    if (!admin.isActive) {
      console.log('⚠️  Admin account is deactivated - auto-activating for debugging');
      await admin.update({ isActive: true });
    }

    // Check if admin is approved
    if (!admin.isApproved) {
      console.log('⚠️  Admin account is not approved - auto-approving for debugging');
      await admin.update({ 
        isApproved: true,
        approvedAt: new Date()
      });
    }

    // TEMPORARY: Skip password verification
    console.log('🔓 Password check SKIPPED (debugging mode)');
    console.log('   Password provided:', password ? 'Yes (ignored)' : 'No (ignored)');
    console.log('   Stored password hash:', admin.password ? (admin.password.substring(0, 20) + '...') : 'null');

    await admin.update({ lastLogin: new Date() });
    req.session.adminId = admin.id;

    console.log('✅ Admin login successful (bypassed):', admin.email);
    console.log('⚠️  REMEMBER: Re-enable password check after debugging!');

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      warning: 'Password check is currently disabled for debugging'
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

// Session check
router.get('/me', (req, res) => {
  res.json({
    loggedIn: !!req.session.adminId,
    adminId: req.session.adminId || null
  });
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

    // TEMPORARY: Skip old password verification for debugging
    console.log('🔓 Change password - old password check SKIPPED (debugging mode)');
    console.log('   Old password provided:', oldPassword ? 'Yes (ignored)' : 'No (ignored)');
    console.log('   New password length:', newPassword.length);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await admin.update({ password: hashedPassword });

    console.log('✅ Password updated successfully (bypassed old password check)');
    console.log('⚠️  REMEMBER: Re-enable old password check after debugging!');

    res.json({ 
      success: true, 
      message: 'Password updated successfully',
      warning: 'Old password check is currently disabled for debugging'
    });
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
router.get('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'isApproved', 'approvedAt', 'lastLogin', 'createdAt'],
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
    const { name, email, password, role = 'admin', autoApprove = false } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const validRoles = ['super_admin', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Check if email already exists
    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      name,
      email,
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
        role: admin.role,
        isApproved: admin.isApproved
      },
      message: autoApprove ? 'Admin created and approved' : 'Admin created (pending approval)'
    });
  } catch (err) {
    console.error('Create admin error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
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

// Get all suppliers with status
router.get('/suppliers', requireSuperAdmin, async (req, res) => {
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
router.post('/suppliers/:id/approve', requireSuperAdmin, async (req, res) => {
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

    await supplier.update({
      status: 'approved',
      approvedBy: req.currentAdmin.id,
      approvedAt: new Date()
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
router.post('/suppliers/:id/reject', requireSuperAdmin, async (req, res) => {
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

    await supplier.update({
      status: 'rejected',
      rejectionReason: reason.trim()
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
   NOTIFICATIONS (STUB)
====================================================== */

router.get('/notifications', (req, res) => {
  res.json([]);
});

/* ======================================================
   CATEGORIES & ADS
====================================================== */

router.post('/categories', async (req, res) => {
  const cat = await Category.create({ name: req.body.name });
  res.json(cat);
});

router.post('/ads', async (req, res) => {
  const ad = await Ad.create(req.body);
  res.json(ad);
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

    const { title, price, description, unit, variety, subVariety, categoryId, monthlyPrice, hasMonthlyPackage } = req.body;
    
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
    const { title, description, price, unit, categoryId } = req.body;
    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price required' });
    }

    const product = await Product.create({
      title,
      description: description || '',
      price: Number(price),
      unit: unit || 'piece',
      CategoryId: categoryId || null,
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
