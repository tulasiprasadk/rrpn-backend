
import express from 'express';
import { models } from '../../config/database.js';
import jwt from 'jsonwebtoken';
const { Product, ProductSupplier, Supplier } = models;
const router = express.Router();

const parseMoney = (value) => {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const parseStock = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const amount = Number.parseInt(value, 10);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

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

// POST /api/supplier/products/prices/bulk - Bulk update prices for supplier rows
router.post('/prices/bulk', requireSupplier, async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    if (updates.length === 0) {
      return res.status(400).json({ error: 'updates array required' });
    }

    let updated = 0;
    const errors = [];

    for (const entry of updates) {
      const productId = Number.parseInt(entry?.productId ?? entry?.id, 10);
      const price = parseMoney(entry?.price);

      if (!Number.isInteger(productId)) {
        errors.push({ reference: entry?.productId ?? entry?.id ?? 'unknown', error: 'Valid productId required' });
        continue;
      }

      if (price === null) {
        errors.push({ reference: productId, error: 'Valid non-negative price required' });
        continue;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        errors.push({ reference: productId, error: 'Product not found' });
        continue;
      }

      let ps = await ProductSupplier.findOne({
        where: { productId, supplierId: req.supplierId }
      });

      if (ps) {
        await ps.update({ price });
      } else {
        ps = await ProductSupplier.create({
          productId,
          supplierId: req.supplierId,
          price,
          stock: 0,
          isActive: true
        });
      }

      updated += 1;
    }

    res.json({ success: true, updated, errors });
  } catch (err) {
    console.error('Bulk supplier price update error:', err);
    res.status(500).json({ error: 'Failed to bulk update prices' });
  }
});

// PATCH /api/supplier/products/:id/price - Update only price for this supplier
router.patch('/:id/price', requireSupplier, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const price = parseMoney(req.body?.price);
    if (price === null) {
      return res.status(400).json({ error: 'Valid non-negative price required' });
    }

    let ps = await ProductSupplier.findOne({
      where: { productId: req.params.id, supplierId: req.supplierId }
    });

    if (ps) {
      await ps.update({ price });
    } else {
      ps = await ProductSupplier.create({
        productId: req.params.id,
        supplierId: req.supplierId,
        price,
        stock: 0,
        isActive: true
      });
    }

    res.json({ success: true, productId: product.id, price });
  } catch (err) {
    console.error('Supplier price update failed:', err);
    res.status(500).json({ error: 'Failed to update product price' });
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
    const parsedPrice = parseMoney(price);
    const parsedStock = parseStock(stock);
    if (parsedPrice === null || parsedStock === null) {
      return res.status(400).json({ error: 'Valid price and stock required' });
    }
    if (ps) {
      await ps.update({ price: parsedPrice, stock: parsedStock });
    } else {
      ps = await ProductSupplier.create({
        productId: req.params.id,
        supplierId: req.supplierId,
        price: parsedPrice,
        stock: parsedStock,
        isActive: true
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
