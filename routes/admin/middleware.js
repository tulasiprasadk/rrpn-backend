import { models } from "../../config/database.js";
const { Admin } = models;

// Middleware to check if current admin is super admin
export async function requireSuperAdmin(req, res, next) {
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

// Middleware to check if admin is logged in
export async function requireAdmin(req, res, next) {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const admin = await Admin.findByPk(req.session.adminId);
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
