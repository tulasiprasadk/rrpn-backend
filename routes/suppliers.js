import express from "express";
import passport from "../passport.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { models } from "../config/database.js";
const { Supplier, Product, Order } = models;

import adminNotify from "../services/adminNotify.js";
import { sendOTP as sendOTPSMS } from "../services/smsService.js";

const router = express.Router();

// Verify callback URL if GOOGLE_CALLBACK_URL is set
if (process.env.GOOGLE_CALLBACK_URL && !process.env.GOOGLE_CALLBACK_URL.endsWith('/api/suppliers/auth/google/callback')) {
  console.warn('GOOGLE_CALLBACK_URL does not match expected supplier callback path (/api/suppliers/auth/google/callback). Ensure your Google Console redirect URI matches the supplier callback or set GOOGLE_CALLBACK_URL appropriately.');
}

/* ============================================================
   GOOGLE OAUTH — SUPPLIER
   GET /api/suppliers/auth/google
   NOTE: Guard routes when Google OAuth is not configured to avoid
   "Unknown authentication strategy" runtime errors. When env vars
   are present the normal passport strategy will be used.
============================================================ */
const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleConfigured) {
  router.get(
    "/auth/google",
    passport.authenticate("supplier-google", {
      scope: ["profile", "email"],
    })
  );
} else {
  router.get('/auth/google', (req, res) => {
    res.status(501).send('Google OAuth not configured for suppliers. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
  });
}

/* ============================================================
   GOOGLE OAUTH CALLBACK — SUPPLIER
   GET /api/suppliers/auth/google/callback
============================================================ */
if (googleConfigured) {
  router.get(
    "/auth/google/callback",
    passport.authenticate("supplier-google", {
      failureRedirect: "/supplier/login",
      session: true,
    }),
    async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      return res.status(500).send("FRONTEND_URL not configured");
    }

    if (!req.user) {
      return res.status(500).send("Supplier not found after OAuth");
    }

    const supplier = req.user;

    // Refresh supplier data to get latest status (including kycSubmitted)
    const freshSupplier = await Supplier.findByPk(supplier.id);
    if (!freshSupplier) {
      return res.status(500).send("Supplier not found");
    }

    // If approved, go to dashboard
    if (freshSupplier.status === "approved") {
      // Set session for backend API calls
      req.session.supplierId = freshSupplier.id;
      
      const token = jwt.sign(
        {
          id: freshSupplier.id,
          email: freshSupplier.email,
          role: "supplier",
        },
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );
      return res.redirect(`${frontendUrl}/oauth-success?token=${token}&role=supplier`);
    }

    // If KYC not submitted (check both kycSubmitted field and status)
    if (!freshSupplier.kycSubmitted || freshSupplier.status === "pending") {
      return res.redirect(`${frontendUrl}/supplier/kyc?email=${encodeURIComponent(freshSupplier.email)}`);
    }

    // If KYC submitted but not approved, show pending message
    if (freshSupplier.status === "kyc_submitted") {
      return res.redirect(`${frontendUrl}/supplier/login?kyc_pending=1`);
    }

    // Otherwise, pending approval
    return res.redirect(`${frontendUrl}/supplier/login?pending=1`);
    }
  );
} else {
  router.get('/auth/google/callback', (req, res) => {
    res.status(501).send('Google OAuth not configured for suppliers. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
  });
}

/* ============================================================
   MULTER CONFIG — KYC UPLOADS
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/kyc/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* ============================================================
   SUPPLIER KYC SUBMISSION
   POST /api/suppliers/kyc
   Requires: Google OAuth login first
============================================================ */
router.post("/kyc", upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find supplier by email
    const supplier = await Supplier.findOne({ where: { email } });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found. Please login with Google first." });
    }

    // Check if already approved
    if (supplier.status === "approved") {
      return res.status(400).json({ error: "Supplier already approved" });
    }

    // Validate required fields
    const { businessName, phone, address, gstNumber, panNumber, bankDetails, acceptedTnC } = req.body;
    
    if (!businessName || !phone || !address || !gstNumber || !panNumber) {
      return res.status(400).json({ error: "All KYC fields are required" });
    }

    if (!acceptedTnC || acceptedTnC !== "true") {
      return res.status(400).json({ error: "You must accept Terms & Conditions" });
    }

    // Validate bank details
    let bankDetailsObj = null;
    if (bankDetails) {
      try {
        bankDetailsObj = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
        if (!bankDetailsObj.accountNumber || !bankDetailsObj.ifsc || !bankDetailsObj.bankName) {
          return res.status(400).json({ error: "Bank details incomplete" });
        }
      } catch (e) {
        return res.status(400).json({ error: "Invalid bank details format" });
      }
    }

    // Update supplier with KYC data
    const updateData = {
      businessName,
      phone,
      address,
      gstNumber,
      panNumber,
      bankDetails: bankDetailsObj,
      acceptedTnC: true,
      kycSubmitted: true,
      kycSubmittedAt: new Date(),
      status: 'kyc_submitted' // Changed from 'pending' to 'kyc_submitted'
    };

    // Add file paths if uploaded
    if (req.files) {
      if (req.files.businessLicense && req.files.businessLicense[0]) {
        updateData.businessLicense = `/uploads/kyc/${req.files.businessLicense[0].filename}`;
      }
      if (req.files.gstCertificate && req.files.gstCertificate[0]) {
        updateData.gstCertificate = `/uploads/kyc/${req.files.gstCertificate[0].filename}`;
      }
      if (req.files.idProof && req.files.idProof[0]) {
        updateData.idProof = `/uploads/kyc/${req.files.idProof[0].filename}`;
      }
    }

    await supplier.update(updateData);

    // Notify admin about new KYC submission (use specific type so frontend shows approve action)
    try {
      await adminNotify(
        'supplier_registration', // type used by frontend to show approve link
        'New Supplier KYC Submission',
        `Supplier: ${supplier.name} (${supplier.email})\nBusiness: ${businessName}\nPhone: ${phone}\nGST: ${gstNumber}\nPAN: ${panNumber}\n\nPlease review and approve in Admin Dashboard.`
      );
    } catch (notifyErr) {
      console.error("Admin notification error:", notifyErr);
    }

    res.json({
      success: true,
      message: "KYC submitted successfully. Waiting for admin approval.",
      supplier: {
        id: supplier.id,
        email: supplier.email,
        status: supplier.status
      }
    });
  } catch (err) {
    console.error("KYC submission error:", err);
    res.status(500).json({ error: "Failed to submit KYC" });
  }
});

/* ============================================================
   SUPPLIER LOGIN — OTP / PASSWORD
   Only works for approved suppliers
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { phone, password, otp } = req.body;

    const supplier = await Supplier.findOne({ where: { phone } });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Check approval status
    if (supplier.status !== "approved") {
      let message = "Account not approved";
      if (supplier.status === "pending") {
        message = "Please complete KYC first";
      } else if (supplier.status === "kyc_submitted") {
        message = "KYC submitted. Waiting for admin approval.";
      } else if (supplier.status === "rejected") {
        message = `Account rejected. Reason: ${supplier.rejectionReason || "Not specified"}`;
      }
      return res.status(403).json({
        error: message,
        status: supplier.status,
      });
    }

    if (otp) {
      if (!supplier.otp || supplier.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      await supplier.update({ otp: null, otpExpiry: null });
    } else if (password) {
      const ok = await bcrypt.compare(password, supplier.password);
      if (!ok) {
        return res.status(400).json({ error: "Invalid password" });
      }
    } else {
      return res.status(400).json({ error: "OTP or password required" });
    }

    req.session.supplierId = supplier.id;

    const token = jwt.sign(
      {
        id: supplier.id,
        email: supplier.email,
        role: "supplier",
      },
      process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
      },
    });
  } catch (err) {
    console.error("Supplier login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   SUPPLIER PRODUCTS
============================================================ */
router.get("/:id/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { supplierId: req.params.id },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
