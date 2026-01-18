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

    const tableNames = ['"Categories"', 'categories', '"Category"', 'category'];
    let result = null;

    for (const tableName of tableNames) {
      try {
        result = await dbPool.query(
          `
          SELECT id, name, icon
          FROM ${tableName}
          ORDER BY id ASC
          `
        );
        break;
      } catch (err) {
        const isMissingTable = err?.code === '42P01' || /relation .* does not exist/i.test(err?.message || '');
        const isMissingColumn = err?.code === '42703' || /column .* does not exist/i.test(err?.message || '');
        if (!isMissingTable && !isMissingColumn) throw err;
        if (isMissingColumn) {
          try {
            result = await dbPool.query(
              `
              SELECT id, name, NULL::text as icon
              FROM ${tableName}
              ORDER BY id ASC
              `
            );
            break;
          } catch (columnErr) {
            const columnMissingTable = columnErr?.code === '42P01' || /relation .* does not exist/i.test(columnErr?.message || '');
            if (!columnMissingTable) throw columnErr;
          }
        }
      }
    }

    if (result) {
      return res.json(result.rows);
    }

    throw new Error("No matching categories table found");
  } catch (err) {
    console.error('Categories API error:', err.message || err);

    const { Category } = models || {};
    if (Category) {
      try {
        const rows = await Category.findAll({
          order: [['id', 'ASC']]
        });
        return res.json(rows.map((row) => (row.toJSON ? row.toJSON() : row)));
      } catch (fallbackErr) {
        console.error('Categories Sequelize fallback error:', fallbackErr.message || fallbackErr);
      }
    }

    // Check if it's a database connection error
    if (err.code === 'ENOTFOUND' || err.message?.includes('ENOTFOUND')) {
      return res.status(503).json({ 
        error: "Database connection failed",
        message: "Cannot connect to database. Please check DATABASE_URL configuration.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to load categories",
      message: err.message || "Internal server error"
    });
  }
});

export default router;
