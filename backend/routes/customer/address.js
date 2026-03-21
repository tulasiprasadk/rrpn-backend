import express from "express";
import { models } from "../../config/database.js";
import jwt from "jsonwebtoken";
const { Address } = models;
const router = express.Router();

/* ======================================
   MIDDLEWARE — Require Login
====================================== */
function requireLogin(req, res, next) {
  if (req.session?.customerId) return next();

  try {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret"
      );
      if (decoded?.id) {
        req.session.customerId = decoded.id;
        return next();
      }
    }
  } catch (err) {
    // Ignore and fall through.
  }
  return res.status(401).json({ error: "Not logged in" });
}

/* ======================================
   GET ALL ADDRESSES
====================================== */
router.get("/", requireLogin, async (req, res) => {
  console.log("📍 Fetching addresses for customer:", req.session.customerId);
  
  const addresses = await Address.findAll({
    where: { CustomerId: req.session.customerId },  // ← Capital C and D for FK
    order: [["isDefault", "DESC"]]   // Default address appears first
  });

  console.log("📍 Found", addresses.length, "addresses");
  res.json(addresses);
});

/* ======================================
   ADD NEW ADDRESS
====================================== */
router.post("/", requireLogin, async (req, res) => {
  try {
    const data = req.body;

    console.log("Creating address for customer:", req.session.customerId);
    console.log("Address data:", data);

    const existingCount = await Address.count({
      where: { CustomerId: req.session.customerId }
    });

    const shouldSetDefault = data.isDefault || existingCount === 0;

    if (shouldSetDefault) {
      await Address.update(
        { isDefault: false },
        { where: { CustomerId: req.session.customerId } }
      );
    }

    const address = await Address.create({
      ...data,
      isDefault: shouldSetDefault,
      CustomerId: req.session.customerId  // ← Capital C and D for Sequelize FK
    });

    res.json({ success: true, address });
  } catch (err) {
    console.error("Address creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   GUEST ADDRESS - save to session for guest users
   POST /guest   -> saves address to session (non-persistent)
   GET  /guest   -> returns saved guest addresses
====================================== */
router.post("/guest", async (req, res) => {
  try {
    const data = req.body || {};
    // Ensure session bucket
    req.session.guestAddresses = req.session.guestAddresses || [];

    const address = {
      id: `sess-${Date.now()}`,
      name: data.name || null,
      phone: data.phone || null,
      addressLine: data.addressLine || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      createdAt: new Date(),
    };

    req.session.guestAddresses.push(address);
    // Optionally set a single saved guest address as default on session
    req.session.guestDefaultAddressId = address.id;

    res.json({ success: true, address });
  } catch (err) {
    console.error('Guest address save error:', err);
    res.status(500).json({ error: 'Failed to save guest address' });
  }
});

router.get("/guest", async (req, res) => {
  try {
    const list = req.session.guestAddresses || [];
    res.json(list);
  } catch (err) {
    console.error('Guest address list error:', err);
    res.status(500).json({ error: 'Failed to read guest addresses' });
  }
});

/* ======================================
   UPDATE ADDRESS
====================================== */
router.put("/:id", requireLogin, async (req, res) => {
  await Address.update(req.body, {
    where: { id: req.params.id, CustomerId: req.session.customerId },  // ← Capital C and D
  });

  res.json({ success: true });
});

/* ======================================
   DELETE ADDRESS
====================================== */
router.delete("/:id", requireLogin, async (req, res) => {
  await Address.destroy({
    where: { id: req.params.id, CustomerId: req.session.customerId },  // ← Capital C and D
  });

  res.json({ success: true });
});

/* ======================================
   SET DEFAULT ADDRESS
====================================== */
router.put("/:id/default", requireLogin, async (req, res) => {
  const customerId = req.session.customerId;

  // Step 1 — Unset all defaults
  await Address.update(
    { isDefault: false },
    { where: { CustomerId: customerId } }  // ← Capital C and D
  );

  // Step 2 — Set new default
  await Address.update(
    { isDefault: true },
    { where: { id: req.params.id, CustomerId: customerId } }  // ← Capital C and D
  );

  res.json({ success: true });
});

/* ======================================
   EXPORT ROUTER
====================================== */
export default router;
