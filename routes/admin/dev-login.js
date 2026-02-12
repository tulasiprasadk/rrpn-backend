import express from 'express';
import { models } from '../../config/database.js';

const router = express.Router();

// Dev-only login: sets session.adminId for testing without OTP
router.post('/', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const { Admin } = models;
    if (!Admin) return res.status(500).json({ error: 'Admin model not available' });

    let admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    // Ensure admin is active & approved for testing convenience
    if (!admin.isActive || !admin.isApproved) {
      try {
        await admin.update({ isActive: true, isApproved: true });
      } catch (e) {
        console.warn('Failed to set admin active/approved:', e.message || e);
      }
    }

    req.session.adminId = admin.id;
    res.json({ ok: true, adminId: admin.id });
  } catch (err) {
    console.error('Dev login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
