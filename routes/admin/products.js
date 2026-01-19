
import express from 'express';
import { models } from '../../config/database.js';
import { requireAdmin } from './middleware.js';
import { translateToKannada } from '../../services/translator.js';
const { Product, Supplier, ProductSupplier, Category } = models;
const router = express.Router();

// POST /api/admin/products/translate - Translate selected products to Kannada
router.post('/translate', requireAdmin, async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'productIds required' });
    }

    const products = await Product.findAll({
      where: { id: productIds }
    });

    const translations = [];
    for (const product of products) {
      let titleKannada = product.titleKannada || '';
      let descriptionKannada = product.descriptionKannada || '';

      try {
        titleKannada = product.title ? await translateToKannada(product.title) : '';
        descriptionKannada = product.description
          ? await translateToKannada(product.description)
          : '';
      } catch (err) {
        console.warn('Translation skipped for product', product.id, err?.message || err);
      }

      translations.push({
        id: product.id,
        titleOriginal: product.title || '',
        descriptionOriginal: product.description || '',
        titleKannada,
        descriptionKannada
      });
    }

    res.json({ translations });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ message: 'Translation failed' });
  }
});

// PUT /api/admin/products/save-translation - Save Kannada translations
router.put('/save-translation', requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'updates required' });
    }

    const results = [];
    for (const update of updates) {
      const product = await Product.findByPk(update.id);
      if (!product) {
        results.push({ id: update.id, success: false, error: 'Not found' });
        continue;
      }
      await product.update({
        titleKannada: update.titleKannada || '',
        descriptionKannada: update.descriptionKannada || ''
      });
      results.push({ id: update.id, success: true });
    }

    res.json({ results });
  } catch (error) {
    console.error('Save translation error:', error);
    res.status(500).json({ message: 'Save failed' });
  }
});

// PUT /api/admin/products/save-english - Save English edits
router.put('/save-english', requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'updates required' });
    }

    const results = [];
    for (const update of updates) {
      const product = await Product.findByPk(update.id);
      if (!product) {
        results.push({ id: update.id, success: false, error: 'Not found' });
        continue;
      }
      await product.update({
        title: update.title || product.title,
        description: update.description || product.description
      });
      results.push({ id: update.id, success: true });
    }

    res.json({ results });
  } catch (error) {
    console.error('Save English error:', error);
    res.status(500).json({ message: 'Save failed' });
  }
});

// GET /api/admin/products/:id - Get single product for editing
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// PUT /api/admin/products/:id - Update product (including price)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { title, price, description, unit, variety, subVariety, categoryId, monthlyPrice, hasMonthlyPackage, yearlyPrice, hasYearlyPackage } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (variety !== undefined) updateData.variety = variety;
    if (subVariety !== undefined) updateData.subVariety = subVariety;
    if (categoryId !== undefined) updateData.CategoryId = categoryId ? parseInt(categoryId) : null;
    if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice ? parseFloat(monthlyPrice) : null;
    if (hasMonthlyPackage !== undefined) updateData.hasMonthlyPackage = hasMonthlyPackage === true || hasMonthlyPackage === 'true';
    if (yearlyPrice !== undefined) updateData.yearlyPrice = yearlyPrice ? parseFloat(yearlyPrice) : null;
    if (hasYearlyPackage !== undefined) updateData.hasYearlyPackage = hasYearlyPackage === true || hasYearlyPackage === 'true';

    await product.update(updateData);

    console.log('✅ Product updated:', {
      id: product.id,
      title: updateData.title || product.title,
      price: updateData.price !== undefined ? updateData.price : product.price,
      monthlyPrice: updateData.monthlyPrice !== undefined ? updateData.monthlyPrice : product.monthlyPrice
    });

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await product.destroy();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get suppliers for a product (must come after /:id routes to avoid conflict)
router.get('/:productId/suppliers', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: [{
        model: Supplier,
        as: 'suppliers',
        through: { attributes: ['price', 'stock', 'isActive'] }
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product.suppliers || []);
  } catch (error) {
    console.error('Error fetching product suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Assign supplier to product
router.post('/:productId/suppliers', async (req, res) => {
  try {
    const { supplierId, price, stock } = req.body;
    
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if already assigned
    const existing = await ProductSupplier.findOne({
      where: { productId: req.params.productId, supplierId }
    });

    if (existing) {
      // Update existing
      await existing.update({ price, stock, isActive: true });
      return res.json({ message: 'Supplier updated', productSupplier: existing });
    }

    // Create new assignment
    await product.addSupplier(supplier, {
      through: { price, stock, isActive: true }
    });

    res.json({ message: 'Supplier assigned to product' });
  } catch (error) {
    console.error('Error assigning supplier:', error);
    res.status(500).json({ error: 'Failed to assign supplier' });
  }
});

// Remove supplier from product
router.delete('/:productId/suppliers/:supplierId', async (req, res) => {
  try {
    const deleted = await ProductSupplier.destroy({
      where: {
        productId: req.params.productId,
        supplierId: req.params.supplierId
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Supplier removed from product' });
  } catch (error) {
    console.error('Error removing supplier:', error);
    res.status(500).json({ error: 'Failed to remove supplier' });
  }
});

export default router;
