import express from "express";
import { models } from "../../config/database.js";
import jwt from "jsonwebtoken";
const { Customer } = models;
const router = express.Router();

function resolveCustomerId(req) {
  if (req.session?.customerId) return req.session.customerId;
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
        return decoded.id;
      }
    }
  } catch (err) {
    // Ignore and return null below.
  }
  return null;
}

// GET PROFILE
router.get("/", async (req, res) => {
  try {
    const customerId = resolveCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE PROFILE
router.put("/", async (req, res) => {
  try {
    const customerId = resolveCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // If updating username, check if it's unique
    if (req.body.username && req.body.username !== customer.username) {
      const existingUser = await Customer.findOne({ 
        where: { username: req.body.username } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    await customer.update(req.body);

    res.json({ success: true, customer });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
