import express from "express";
import pkg from "pg";
import { Op } from "sequelize";
import { models, sequelize } from "../config/database.js";

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
      if (categoryId) {
        const catId = Number(categoryId);
        if (!Number.isNaN(catId)) where.CategoryId = catId;
      }
      if (q) {
        const likeOp =
          sequelize?.getDialect?.() === "postgres" ? Op.iLike : Op.like;
        const term = `%${q}%`;
        where[Op.or] = [
          { title: { [likeOp]: term } },
          { variety: { [likeOp]: term } },
          { subVariety: { [likeOp]: term } },
          { description: { [likeOp]: term } },
        ];
      }

      const results = await Product.findAll({
        where,
        include: Category ? [{ model: Category }] : [],
        order: [["id", "DESC"]],
        limit,
      });

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
      whereSql += ` AND (p.title ILIKE $${idx} OR p.variety ILIKE $${idx} OR p."subVariety" ILIKE $${idx} OR p.description ILIKE $${idx})`;
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
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    const normalize = (value) => (value || "").toString().trim().toLowerCase();
    const categoryCache = new Map();
    const existingCategories = await Category.findAll();
    existingCategories.forEach((c) => categoryCache.set(normalize(c.name), c));

    const toCreate = [];
    const errors = [];

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

      toCreate.push({
        title,
        price,
        unit: raw.unit || null,
        description: raw.description || null,
        variety: raw.variety || null,
        subVariety: raw.subVariety || null,
        CategoryId: categoryId || null,
        status: "approved",
      });
    }

    if (toCreate.length === 0) {
      return res.status(400).json({ error: "No valid products to create", errors: errors.length });
    }

    const created = await Product.bulkCreate(toCreate, { validate: true });
    res.json({ created: created.length, errors: errors.length, errorDetails: errors });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

export default router;
