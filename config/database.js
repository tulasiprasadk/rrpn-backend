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
      max: 5, // VERY IMPORTANT for serverless
      min: 0,
      acquire: 10000, // Reduced from 30000 - fail faster
      idle: 10000,
    },
    // Prevent Sequelize from trying to connect on instantiation
    // Connection will happen on first query
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
 * Non-blocking DB bootstrap
 * Cloud Run safe: does NOT block startup
 */
export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
    // ❌ DO NOT process.exit() on Cloud Run
  }
}

export { sequelize, models };
