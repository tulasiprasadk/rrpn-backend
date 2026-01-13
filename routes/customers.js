import express from "express";
import passport from "../passport.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* ============================================================
   GOOGLE OAUTH — CUSTOMER
   GET /api/customers/auth/google
   This route MUST redirect immediately to Google - no DB calls
============================================================ */
router.get(
  "/auth/google",
  (req, res, next) => {
    try {
      const passportInstance = passport.default || passport;
      
      // Check if Google OAuth is configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({ 
          error: "Google OAuth not configured",
          message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set"
        });
      }
      
      if (!passportInstance) {
        return res.status(500).json({ 
          error: "OAuth not initialized",
          message: "Passport instance not available"
        });
      }
      
      // This should redirect immediately to Google - no waiting
      passportInstance.authenticate("customer-google", {
        scope: ["profile", "email"],
      })(req, res, next);
    } catch (err) {
      console.error("Error in Google OAuth route:", err);
      res.status(500).json({ 
        error: "OAuth error", 
        message: err.message || "Failed to initiate Google OAuth"
      });
    }
  }
);

/* ============================================================
   GOOGLE OAUTH CALLBACK — CUSTOMER
   GET /api/customers/auth/google/callback
============================================================ */
router.get(
  "/auth/google/callback",
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const passportInstance = passport.default || passport;
    
    passportInstance.authenticate("customer-google", {
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
      
      // Generate JWT token for frontend
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          role: "customer",
        },
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );
      
      // Save customer in session
      req.session.customerId = req.user.id;
      
      // Redirect to OAuth success page with token
      return res.redirect(
        `${frontendUrl}/oauth-success?token=${token}&role=customer`
      );
    });
  }
);

export default router;
