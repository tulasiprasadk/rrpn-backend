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

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 10000, // Reduced from 30000 to fail faster
      idle: 10000,
    },
    // Add connection timeout to prevent hanging
    connectTimeout: 10000, // 10 seconds max to connect
    retry: {
      max: 1, // Only retry once
    },
  });
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

    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database initialization error:", err.message || err);
    // ❌ DO NOT process.exit() on Cloud Run
    // App can still run without DB (for health checks, etc.)
  }
}

export { sequelize, models };
