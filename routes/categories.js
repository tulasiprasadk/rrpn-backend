import express from 'express';
import pkg from 'pg';
import { models } from '../config/database.js';
const { Pool } = pkg;

const router = express.Router();

// Lazy pool creation to prevent blocking
let pool;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000, // 10 second timeout
      idleTimeoutMillis: 10000,
      max: 5,
    });
  }
  return pool;
}

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      const { Category } = models || {};
      if (!Category) {
        return res.status(503).json({ 
          error: "Database not configured",
          message: "DATABASE_URL is not set"
        });
      }
      const rows = await Category.findAll({
        order: [['id', 'ASC']]
      });
      return res.json(rows.map((row) => (row.toJSON ? row.toJSON() : row)));
    }

    const primaryQuery = `
      SELECT id, name, icon
      FROM "Categories"
      ORDER BY id ASC
    `;
    let result;
    try {
      result = await dbPool.query(primaryQuery);
    } catch (err) {
      const isMissingTable = err?.code === '42P01' || /relation .* does not exist/i.test(err?.message || '');
      if (!isMissingTable) throw err;
      const fallbackQuery = `
        SELECT id, name, icon
        FROM categories
        ORDER BY id ASC
      `;
      result = await dbPool.query(fallbackQuery);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Categories API error:', err.message || err);
    
    // Check if it's a database connection error
    if (err.code === 'ENOTFOUND' || err.message?.includes('ENOTFOUND')) {
      return res.status(503).json({ 
        error: "Database connection failed",
        message: "Cannot connect to database. Please check DATABASE_URL configuration.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: "Failed to load categories",
      message: err.message || "Internal server error"
    });
  }
});

export default router;
