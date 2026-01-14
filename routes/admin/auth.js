/**
 * backend/routes/admin/auth.js
 * Admin Authentication (Email OTP)
 */


import express from "express";
import { models, sequelize } from "../../config/database.js";

// Ensure database connection is ready
let connectionChecked = false;
async function ensureConnection() {
  if (!connectionChecked && sequelize) {
    try {
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection check timeout")), 5000)
        )
      ]);
      connectionChecked = true;
      console.log("✅ Admin auth: Database connection verified");
    } catch (connErr) {
      console.warn("⚠️ Admin auth: Database connection check failed (will retry on query):", connErr.message);
      // Don't throw - let the query attempt to connect
    }
  }
}
const { Admin } = models;
import { sendOTP } from "../../services/emailService.js";
const router = express.Router();

const otpStore = {}; // Format: { email: { otp: "123456", expiresAt: timestamp } }

/* =====================================================
   REQUEST EMAIL OTP (Admin Login)
   POST /api/admin/auth/request-email-otp
   ===================================================== */
router.post("/request-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if admin exists
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found with this email" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store with 10 minute expiry
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore[email] = { otp, expiresAt };

    // Send OTP via email
    await sendOTP(email, otp);

    console.log("📧 ADMIN OTP SENT:", email, otp);

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("Admin OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =====================================================
   VERIFY EMAIL OTP (Admin Login)
   POST /api/admin/auth/verify-email-otp
   ===================================================== */
router.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  // Check if OTP exists and is valid
  const stored = otpStore[email];
  
  if (!stored || stored.otp !== otp) {
    return res.status(401).json({ error: "Invalid OTP" });
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[email];
    return res.status(401).json({ error: "OTP expired" });
  }

  try {
    // OTP valid → delete it
    delete otpStore[email];

    // Find admin
    const admin = await Admin.findOne({ where: { email } });

    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if admin is approved
    if (!admin.isApproved) {
      return res.status(403).json({ 
        error: "Account is pending approval. Only approved admins can login.",
        requiresApproval: true
      });
    }

    // Update last login
    await admin.update({ lastLogin: new Date() });

    // Save admin ID in session
    req.session.adminId = admin.id;

    res.json({
      success: true,
      message: "OTP verified, logged in",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Admin Verify OTP Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* =====================================================
   CHECK LOGIN STATUS
   GET /api/admin/auth/me
   ===================================================== */
router.get("/me", (req, res) => {
  // Log for debugging
  console.log('[ADMIN /auth/me] Route called, session:', {
    hasSession: !!req.session,
    adminId: req.session?.adminId || null,
    sessionId: req.sessionID || null
  });
  
  // Check session immediately - no async, no DB
  if (!req.session || !req.session.adminId) {
    console.log('[ADMIN /auth/me] Not logged in, returning 401');
    return res.status(401).json({ 
      loggedIn: false,
      authenticated: false
    });
  }
  
  // Return immediately with session data - no DB query needed
  // Frontend can fetch full admin details separately if needed
  console.log('[ADMIN /auth/me] Logged in, returning success');
  return res.status(200).json({
    loggedIn: true,
    authenticated: true,
    adminId: req.session.adminId
  });
});

/* =====================================================
   LOGOUT
   POST /api/admin/auth/logout
   ===================================================== */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("rrnagar.sid");
    res.json({ success: true });
  });
});

export default router;
