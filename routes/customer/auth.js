/**
 * backend/routes/customer/auth.js
 * Customer Authentication Routes
 * OTP stored in DB (no in-memory store)
 */

import express from "express";
import passport from "passport";
import "../../passport.js";
import { models } from "../../config/database.js";
import { sendOTP } from "../../services/emailService.js";

const { Customer } = models;
const router = express.Router();

// Verify callback URL if GOOGLE_CALLBACK_URL is set
if (process.env.GOOGLE_CALLBACK_URL && !process.env.GOOGLE_CALLBACK_URL.endsWith('/api/customers/auth/google/callback')) {
  console.warn('GOOGLE_CALLBACK_URL does not match expected customer callback path (/api/customers/auth/google/callback). Ensure your Google Console redirect URI matches the customer callback or set GOOGLE_CALLBACK_URL appropriately.');
}

/* =====================================================
   REQUEST EMAIL OTP
   POST /api/auth/request-email-otp
===================================================== */
router.post("/request-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email or username is required" });
  }

  try {
    let customer;

    // Email OR username login
    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });

      // Auto-create customer if not exists (email flow)
      if (!customer) {
        customer = await Customer.create({ email });
      }
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    if (!customer || !customer.email) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP in DB
    await customer.update({
      otpCode: otp,
      otpExpiresAt: expiresAt,
    });

    // Send OTP
    await sendOTP(customer.email, otp);

    console.log("📧 CUSTOMER OTP SENT:", customer.email, otp);

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("Customer OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =====================================================
   VERIFY EMAIL OTP
   POST /api/auth/verify-email-otp
===================================================== */
router.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    let customer;

    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    if (!customer || !customer.otpCode) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    if (
      customer.otpCode !== otp ||
      new Date() > customer.otpExpiresAt
    ) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP after success
    await customer.update({
      otpCode: null,
      otpExpiresAt: null,
    });

    // Save session
    req.session.customerId = customer.id;

    res.json({
      success: true,
      message: "OTP verified, logged in",
      customerId: customer.id,
    });
  } catch (err) {
    console.error("Customer Verify OTP Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* =====================================================
   CHECK LOGIN STATUS
   GET /api/auth/me
   GET /api/auth/status (alias for compatibility)
===================================================== */
router.get("/me", async (req, res) => {
  if (!req.session?.customerId) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const customer = await Customer.findByPk(req.session.customerId, {
      attributes: { exclude: ["otpCode", "otpExpiresAt", "password"] },
    });

    if (!customer) {
      return res.status(401).json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: customer,
    });
  } catch (err) {
    console.error("Customer Auth Check Error:", err);
    res.status(500).json({ loggedIn: false });
  }
});

// Auth status endpoint (frontend compatibility)
// Returns Google OAuth configuration status
router.get("/status", (req, res) => {
  res.json({
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

/* =====================================================
   LOGOUT
   POST /api/auth/logout
===================================================== */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("rrnagar.sid");
    res.json({ success: true });
  });
});

/* =====================================================
   GOOGLE OAUTH — CUSTOMER
   GET /api/customer/auth/google
   GET /api/customers/auth/google (also supported)
===================================================== */
router.get("/google", (req, res, next) => {
  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({ 
        error: "Google OAuth not configured",
        message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set"
      });
    }
    
    // This should redirect immediately to Google - no waiting
    passport.authenticate("customer-google", {
      scope: ["profile", "email"],
    })(req, res, next);
  } catch (err) {
    console.error("Error in Google OAuth route:", err);
    res.status(500).json({ 
      error: "OAuth error", 
      message: err.message || "Failed to initiate Google OAuth"
    });
  }
});

/* =====================================================
   GOOGLE OAUTH CALLBACK — CUSTOMER
   GET /api/customer/auth/google/callback
===================================================== */
router.get("/google/callback", (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  
  passport.authenticate("customer-google", {
    failureRedirect: `${frontendUrl}/login?error=google_failed`,
    session: true,
  })(req, res, (err) => {
    if (err) {
      console.error("Google OAuth callback error:", err);
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
    
    if (!req.user) {
      console.error("No user after Google OAuth");
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
    
    // Save customer in session
    req.session.customerId = req.user.id;
    
    // Redirect to dashboard
    return res.redirect(`${frontendUrl}/dashboard`);
  });
});

export default router;
