import express from "express";
import pkg from "pg";

const { Pool } = pkg;

const router = express.Router();

// Lazy pool creation to avoid blocking startup
let pool;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      max: 5,
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
      return res.json([]);
    }

    const params = [];
    let whereSql = "WHERE 1=1";

    if (categoryId) {
      const catId = Number(categoryId);
      if (!Number.isNaN(catId)) {
        params.push(catId);
        whereSql += ` AND p."CategoryId" = $${params.length}`;
      }
    }

    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      whereSql += ` AND (p.title ILIKE $${idx} OR p.variety ILIKE $${idx} OR p."subVariety" ILIKE $${idx} OR p.description ILIKE $${idx})`;
    }

    const query = `
      SELECT 
        p.*,
        c.id as "cat_id",
        c.name as "cat_name",
        c.icon as "cat_icon",
        c."titleKannada" as "cat_titleKannada",
        c."kn" as "cat_kn",
        c."knDisplay" as "cat_knDisplay"
      FROM "Products" p
      LEFT JOIN "Categories" c ON c.id = p."CategoryId"
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT 500
    `;

    const result = await dbPool.query(query, params);
    const rows = result.rows || [];

    const products = rows.map((row) => {
      const product = { ...row };
      product.Category = row.cat_id
        ? {
            id: row.cat_id,
            name: row.cat_name,
            icon: row.cat_icon,
            titleKannada: row.cat_titleKannada,
            kn: row.cat_kn,
            knDisplay: row.cat_knDisplay,
          }
        : null;

      delete product.cat_id;
      delete product.cat_name;
      delete product.cat_icon;
      delete product.cat_titleKannada;
      delete product.cat_kn;
      delete product.cat_knDisplay;

      product.basePrice = product.price;
      if (!product.knDisplay && product.titleKannada) {
        product.knDisplay = product.titleKannada;
      }
      if (!product.kn && product.titleKannada) {
        product.kn = product.titleKannada;
      }
      return product;
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
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
   - Placeholder for now
===================================================== */
router.post("/bulk", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

export default router;
