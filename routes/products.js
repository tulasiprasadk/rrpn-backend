import express from "express";
import pkg from "pg";
import { Op } from "sequelize";
import { models, sequelize } from "../config/database.js";
import { getPlatformConfig } from "../utils/commissionCalculator.js";

const { Pool } = pkg;

const router = express.Router();

// Lazy pool creation to avoid blocking startup
let pool;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    const useSsl = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      max: 5,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

/* =====================================================
   GET /api/products
   - Public: approved products + fallback for missing status
   - Supports categoryId + search (q)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { categoryId, q } = req.query;
    const dbPool = getPool();
    if (!dbPool) {
      const { Product, Category } = models || {};
      if (!Product) {
        if (req.query.debug === "1") {
          return res.status(500).json({
            ok: false,
            error: "DATABASE_URL not configured on server",
          });
        }
        return res.json([]);
      }

      const rawLimit = Number.parseInt(req.query.limit, 10);
      const limit = Number.isFinite(rawLimit)
        ? Math.min(Math.max(rawLimit, 1), 50000)
        : 50000;

      const where = {};
      let categoryMatchIds = [];
      if (categoryId) {
        const catId = Number(categoryId);
        if (!Number.isNaN(catId)) where.CategoryId = catId;
      }
      if (q) {
        const likeOp =
          sequelize?.getDialect?.() === "postgres" ? Op.iLike : Op.like;
        const term = `%${q}%`;
        if (Category) {
          const matchingCategories = await Category.findAll({
            attributes: ["id"],
            where: { name: { [likeOp]: term } },
          });
          categoryMatchIds = matchingCategories.map((category) => category.id);
        }
        where[Op.or] = [
          { title: { [likeOp]: term } },
          { variety: { [likeOp]: term } },
          { subVariety: { [likeOp]: term } },
          { description: { [likeOp]: term } },
          ...(categoryMatchIds.length ? [{ CategoryId: { [Op.in]: categoryMatchIds } }] : []),
        ];
      }

      const results = await Product.findAll({
        where,
        include: Category ? [{ model: Category }] : [],
        order: [["id", "DESC"]],
        limit,
      });

      const config = await getPlatformConfig();
      const commissionRate = config.platform_commission || parseFloat(process.env.PLATFORM_COMMISSION || 15);

      const normalized = results.map((row) => {
        const product = row.toJSON ? row.toJSON() : { ...row };
        if (product.Category) {
          product.Category = {
            id: product.Category.id,
            name: product.Category.name,
            icon: product.Category.icon,
          };
        } else {
          product.Category = null;
        }
        product.basePrice = product.price;
        // apply platform commission to public-facing price
        try {
          const pct = Number(product.basePrice) || 0;
          const commission = (pct * commissionRate) / 100;
          product.price = Number((pct + commission).toFixed(2));
        } catch (e) {
          // if any error, leave price as-is
        }
        return product;
      });

      if (req.query.debug === "1") {
        return res.json({
          ok: true,
          debug: true,
          categoryId,
          q,
          matchedCount: normalized.length,
          categoryCount: null,
          sample: normalized.slice(0, 3),
        });
      }

      return res.json(normalized);
    }

    const params = [];
    let whereSql = "WHERE 1=1";

    if (categoryId) {
      const catId = Number(categoryId);
      if (!Number.isNaN(catId)) {
        params.push(catId);
        const idx = params.length;
        whereSql += ` AND p."CategoryId" = $${idx}`;
      }
    }

    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      whereSql += ` AND (p.title ILIKE $${idx} OR p.variety ILIKE $${idx} OR p."subVariety" ILIKE $${idx} OR p.description ILIKE $${idx} OR c.name ILIKE $${idx})`;
    }

    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50000) : 50000;
    params.push(limit);
    const limitIdx = params.length;

    const query = `
      SELECT 
        p.*,
        c.id as "cat_id",
        c.name as "cat_name",
        c.icon as "cat_icon"
      FROM public."Products" p
      LEFT JOIN public."Categories" c ON c.id = p."CategoryId"
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT $${limitIdx}
    `;
    let result;
    try {
      result = await dbPool.query(query, params);
    } catch (err) {
      const isMissingTable = err?.code === "42P01" || /relation .* does not exist/i.test(err?.message || "");
      const isMissingColumn = err?.code === "42703" || /column .* does not exist/i.test(err?.message || "");
      if (!isMissingTable && !isMissingColumn) throw err;
      const fallbackQuery = `
        SELECT 
          p.*,
          c.id as "cat_id",
          c.name as "cat_name",
          ${isMissingColumn ? "NULL as \"cat_icon\"" : "c.icon as \"cat_icon\""}
        FROM public.${isMissingTable ? "products" : "\"Products\""} p
        LEFT JOIN public.${isMissingTable ? "categories" : "\"Categories\""} c ON c.id = p."CategoryId"
        ${whereSql}
        ORDER BY p.id DESC
        LIMIT $${limitIdx}
      `;
      result = await dbPool.query(fallbackQuery, params);
    }
    const rows = result.rows || [];

    const config = await getPlatformConfig();
    const commissionRate = config.platform_commission || parseFloat(process.env.PLATFORM_COMMISSION || 15);

    const products = rows.map((row) => {
      const product = { ...row };
      product.Category = row.cat_id
        ? {
            id: row.cat_id,
            name: row.cat_name,
            icon: row.cat_icon,
          }
        : null;

      delete product.cat_id;
      delete product.cat_name;
      delete product.cat_icon;
      product.basePrice = product.price;
      // apply platform commission to public-facing price
      try {
        const pct = Number(product.basePrice) || 0;
        const commission = (pct * commissionRate) / 100;
        product.price = Number((pct + commission).toFixed(2));
      } catch (e) {
        // noop
      }
      return product;
    });

    // Debug payload when requested
    if (req.query.debug === "1") {
      let debugCounts = null;
      if (categoryId) {
        const catId = Number(categoryId);
        if (!Number.isNaN(catId)) {
          const countRes = await dbPool.query(
            `SELECT COUNT(*)::int AS count FROM public."Products" WHERE "CategoryId" = $1`,
            [catId]
          );
          debugCounts = countRes.rows[0]?.count || 0;
        }
      }
      return res.json({
        ok: true,
        debug: true,
        categoryId,
        q,
        matchedCount: products.length,
        categoryCount: debugCounts,
        sample: products.slice(0, 3),
      });
    }

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    if (req.query.debug === "1") {
      return res.status(500).json({ ok: false, error: err.message });
    }
    res.json([]);
  }
});

/* =====================================================
   GET /api/products/test
   - Test endpoint
===================================================== */
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "Products route is accessible" });
});

/* =====================================================
   GET /api/products/health
===================================================== */
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* =====================================================
  POST /api/products/:id/view
  - Record a product view and enqueue activation job when threshold reached
===================================================== */
router.post('/:id/view', async (req, res) => {
  try {
    const { ProductView, ActivationJob, Product } = models || {};
    if (!Product) return res.status(503).json({ ok: false, error: 'DB not ready' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'Invalid id' });

    // upsert view record
    let view = null;
    if (ProductView) {
      view = await ProductView.findOne({ where: { ProductId: id } });
      if (!view) {
        view = await ProductView.create({ ProductId: id, views: 1, lastViewAt: new Date() });
      } else {
        view.views = (view.views || 0) + 1;
        view.lastViewAt = new Date();
        await view.save();
      }
    }

    const threshold = Number(process.env.ACTIVATION_THRESHOLD || 3);
    const currentViews = view ? view.views : 0;
    if (currentViews >= threshold) {
      // ensure activation job exists
      if (ActivationJob) {
        const existing = await ActivationJob.findOne({ where: { ProductId: id, status: 'pending' } });
        if (!existing) {
          await ActivationJob.create({ ProductId: id });
        }
      }
    }

    res.json({ ok: true, views: currentViews, threshold });
  } catch (err) {
    console.error('Error recording view:', err);
    res.status(500).json({ ok: false });
  }
});

/* =====================================================
  POST /api/products/:id/activate
  - For testing: enqueue activation job immediately
===================================================== */
router.post('/:id/activate', async (req, res) => {
  try {
    const { ActivationJob } = models || {};
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'Invalid id' });
    if (!ActivationJob) return res.status(503).json({ ok: false, error: 'DB not ready' });
    const existing = await ActivationJob.findOne({ where: { ProductId: id, status: 'pending' } });
    if (existing) return res.json({ ok: true, message: 'Already queued' });
    await ActivationJob.create({ ProductId: id });
    res.json({ ok: true, message: 'Queued' });
  } catch (err) {
    console.error('Error enqueue activation:', err);
    res.status(500).json({ ok: false });
  }
});

/* =====================================================
  POST /api/products/bulk
  - Create products from CSV payload
===================================================== */
router.post("/bulk", async (req, res) => {
  try {
    const { Product, Category } = models || {};
    if (!Product || !Category) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const { products } = req.body || {};
    const replaceMode = req.query.mode === "replace";
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    const normalize = (value) => (value || "").toString().trim().toLowerCase();
    const categoryCache = new Map();
    const existingCategories = await Category.findAll();
    existingCategories.forEach((c) => categoryCache.set(normalize(c.name), c));

    const toCreate = [];
    const toUpdate = [];
    const errors = [];
    const existingProducts = replaceMode
      ? await Product.findAll({ attributes: ["id", "title"] })
      : [];
    const existingProductMap = new Map(
      existingProducts.map((product) => [normalize(product.title), product])
    );

    for (const [index, raw] of products.entries()) {
      const title = raw?.title?.trim();
      const price = Number(raw?.price || 0);
      if (!title || !Number.isFinite(price)) {
        errors.push({ index, error: "Missing title or price" });
        continue;
      }

      let categoryId = raw.CategoryId || raw.categoryId || null;
      if (!categoryId && raw.categoryName) {
        const key = normalize(raw.categoryName);
        let cat = categoryCache.get(key);
        if (!cat) {
          cat = await Category.create({ name: raw.categoryName });
          categoryCache.set(key, cat);
        }
        categoryId = cat.id;
      }

      const payload = {
        title,
        price,
        unit: raw.unit || null,
        description: raw.description || null,
        variety: raw.variety || null,
        subVariety: raw.subVariety || null,
        CategoryId: categoryId || null,
        status: "approved",
      };

      if (replaceMode) {
        const existingProduct = existingProductMap.get(normalize(title));
        if (existingProduct) {
          toUpdate.push({ id: existingProduct.id, ...payload });
          continue;
        }
      }

      toCreate.push(payload);
    }

    if (toCreate.length === 0 && toUpdate.length === 0) {
      return res.status(400).json({ error: "No valid products to create", errors: errors.length });
    }

    let created = [];
    if (toCreate.length > 0) {
      created = await Product.bulkCreate(toCreate, { validate: true });
    }

    let updated = 0;
    for (const payload of toUpdate) {
      const { id, ...updateData } = payload;
      await Product.update(updateData, { where: { id } });
      updated += 1;
    }

    res.json({
      created: created.length,
      updated,
      errors: errors.length,
      mode: replaceMode ? "replace" : "append",
      errorDetails: errors,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

export default router;
