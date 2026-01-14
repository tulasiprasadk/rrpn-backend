import express from "express";
import { Op } from "sequelize";
import { models } from "../config/database.js";

const router = express.Router();

/* =====================================================
   GET /api/products
   - Public: approved products + fallback for missing status
   - Supports categoryId + search (q)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { Product, Category } = models;
    if (!Product || !Category) {
      return res.json([]);
    }

    const { categoryId, q } = req.query;

    const statusFilter = {
      [Op.or]: [
        { status: { [Op.in]: ["approved", "active"] } },
        { status: null },
        { status: "" },
      ],
    };

    const where = { [Op.and]: [statusFilter] };

    if (categoryId) {
      const catId = Number(categoryId);
      if (!Number.isNaN(catId)) {
        where[Op.and].push({ CategoryId: catId });
      }
    }

    if (q) {
      where[Op.and].push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { variety: { [Op.iLike]: `%${q}%` } },
          { subVariety: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
        ],
      });
    }

    let products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          attributes: ["id", "name", "icon", "titleKannada", "kn", "knDisplay"],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit: 100,
    });

    // Fallback: if empty, retry without status filter (keep category/search)
    if (!products || products.length === 0) {
      const fallbackWhere = {};
      if (categoryId) {
        const catId = Number(categoryId);
        if (!Number.isNaN(catId)) {
          fallbackWhere.CategoryId = catId;
        }
      }
      if (q) {
        fallbackWhere[Op.or] = [
          { title: { [Op.iLike]: `%${q}%` } },
          { variety: { [Op.iLike]: `%${q}%` } },
          { subVariety: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
        ];
      }

      products = await Product.findAll({
        where: fallbackWhere,
        include: [
          {
            model: Category,
            attributes: ["id", "name", "icon", "titleKannada", "kn", "knDisplay"],
            required: false,
          },
        ],
        order: [["id", "DESC"]],
        limit: 100,
      });
    }

    const productsWithBasePrice = (products || []).map((p) => {
      const obj = p.toJSON();
      obj.basePrice = obj.price;
      if (!obj.knDisplay && obj.titleKannada) {
        obj.knDisplay = obj.titleKannada;
      }
      if (!obj.kn && obj.titleKannada) {
        obj.kn = obj.titleKannada;
      }
      return obj;
    });

    res.json(productsWithBasePrice);
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
