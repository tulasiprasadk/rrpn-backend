import { Sequelize } from "sequelize";
import initModels from "../models/index.js";

/**
 * Sequelize instance
 */
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

/**
 * Initialize all models and associations ONCE
 */
const models = initModels(sequelize);

/**
 * Bootstrap DB connection + sync
 * (sync is OK for now; later we’ll move to migrations)
 */
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database error:", err);
    process.exit(1); // fail fast on DB errors
  }
})();

export { sequelize, models };
