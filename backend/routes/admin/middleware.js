import { models } from "../../config/database.js";
const { Admin } = models;

// Middleware to check if current admin is super admin
export async function requireSuperAdmin(req, res, next) {
  try {
    // Allow token-based auth for development: Authorization: Bearer admin_<id>_<ts>
    let admin = null;
    const auth = (req.headers && req.headers.authorization) || '';
    if (auth && auth.startsWith('Bearer admin_')) {
      const parts = auth.split('_');
      const id = Number(parts[1]);
      if (!Number.isNaN(id)) {
        admin = await Admin.findByPk(id);
        if (admin) {
          req.currentAdmin = admin;
        }
      }
    }

    if (!admin) {
      if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: 'Not logged in' });
      }

      admin = await Admin.findByPk(req.session.adminId);
    }
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
    // Accept Bearer admin_* tokens for dev usage
    const auth = (req.headers && req.headers.authorization) || '';
    let admin = null;
    if (auth && auth.startsWith('Bearer admin_')) {
      const parts = auth.split('_');
      const id = Number(parts[1]);
      if (!Number.isNaN(id)) {
        admin = await Admin.findByPk(id);
        console.log('[DEBUG] requireAdmin token auth:', { auth, parsedId: id, found: !!admin });
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
