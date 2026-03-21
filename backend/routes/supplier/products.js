
import express from 'express';
import { models } from '../../config/database.js';
import jwt from 'jsonwebtoken';
const { Product, ProductSupplier, Supplier } = models;
const router = express.Router();

// Middleware to check supplier authentication - supports both session and JWT
function requireSupplier(req, res, next) {
  // Check session first
  if (req.session && req.session.supplierId) {
    req.supplierId = req.session.supplierId;
    return next();
  }

  // Check JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret"
      );
      if (decoded.role === "supplier" && decoded.id) {
        req.supplierId = decoded.id;
        req.session.supplierId = decoded.id;
        return next();
      }
    } catch (err) {
      // JWT invalid
    }
  }

  return res.status(401).json({ error: 'Not authenticated as supplier' });
}

// GET /api/supplier/products/:id - Get product details for editing
router.get('/:id', requireSupplier, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Find supplier-specific price/stock if exists
    const ps = await ProductSupplier.findOne({
      where: { productId: req.params.id, supplierId: req.supplierId }
    });
    res.json({
      id: product.id,
      title: product.title,
      price: ps ? ps.price : product.price,
      stock: ps ? ps.stock : 0,
      status: product.status
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// PUT /api/supplier/products/:id - Update price/stock for this supplier
router.put('/:id', requireSupplier, async (req, res) => {
  try {
    const { price, stock } = req.body;
    // Ensure product exists
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Upsert ProductSupplier row
    let ps = await ProductSupplier.findOne({
      where: { productId: req.params.id, supplierId: req.supplierId }
    });
    if (ps) {
      await ps.update({ price, stock });
    } else {
      ps = await ProductSupplier.create({ productId: req.params.id, supplierId: req.supplierId, price, stock });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
