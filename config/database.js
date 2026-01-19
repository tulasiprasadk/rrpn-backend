import { Sequelize } from "sequelize";
import initModels from "../models/index.js";

/**
 * Create Sequelize instance
 * - If `DATABASE_URL` is present use Postgres
 * - Otherwise fall back to local SQLite for development
 */
let sequelize;

if (process.env.DATABASE_URL) {
  const useSsl = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";
  if (useSsl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
  const sslOptions = useSsl
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : undefined;

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    ssl: sslOptions,
    dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    pool: {
      max: 5, // VERY IMPORTANT for serverless
      min: 0,
      acquire: 10000, // Reduced from 30000 - fail faster
      idle: 10000,
    },
    // Prevent Sequelize from trying to connect on instantiation
    // Connection will happen on first query
    // Add connection timeout to prevent hanging
    connectTimeout: 10000, // 10 seconds max to connect
    retry: {
      max: 1, // Only retry once
    },
  });
  
  // CRITICAL: Do NOT authenticate or sync here
  // This would block serverless function startup
  // Connection happens lazily on first query
} else {
  // Local development: use SQLite file storage
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./database.sqlite",
    logging: false,
  });
}

/**
 * Initialize all models and associations ONCE
 * Wrap in try-catch to prevent crashes during import
 * NOTE: This runs synchronously but only sets up associations, doesn't connect to DB
 */
let models;
try {
  models = initModels(sequelize);
} catch (err) {
  console.error("❌ Error initializing models:", err.message || err);
  // Create empty models object to prevent crashes
  models = {};
}

/**
 * Non-blocking DB bootstrap with timeout
 * Cloud Run safe: does NOT block startup
 */
export async function initDatabase() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database connection timeout")), 10000);
    });

    await Promise.race([
      sequelize.authenticate(),
      timeoutPromise
    ]);
    
    console.log("✅ Database connected");

    // Sync database: create tables if they don't exist
    // For adding columns, we'll catch errors and continue
    try {
      await sequelize.sync({ alter: true });
      console.log("✅ Database synced (altered to match models)");
    } catch (syncErr) {
      // If UNIQUE constraint error, it means constraint already exists - that's okay
      if (syncErr.message && (syncErr.message.includes("UNIQUE") || syncErr.message.includes("duplicate"))) {
        console.warn("⚠️  Constraint already exists (this is normal):", syncErr.message.split('\n')[0]);
        // Try without alter as fallback
        try {
          await sequelize.sync({ alter: false });
          console.log("✅ Database synced (tables verified)");
        } catch (e) {
          console.warn("⚠️  Database sync warning (continuing anyway):", e.message?.split('\n')[0] || e.message);
        }
      } else {
        // For other errors, log but continue
        console.warn("⚠️  Database sync warning (continuing anyway):", syncErr.message?.split('\n')[0] || syncErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Database initialization error:", err.message || err);
    // ❌ DO NOT process.exit() on Cloud Run
    // App can still run without DB (for health checks, etc.)
  }
}

export { sequelize, models };
