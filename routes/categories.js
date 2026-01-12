import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, icon
      FROM "Categories"
      ORDER BY id ASC
      `
    );

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
