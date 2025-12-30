import { Sequelize } from "sequelize";
import initModels from "../models/index.js";

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

// 🔥 Load all models + relations FIRST
const models = initModels(sequelize);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database error:", err.message);
  }
})();

export { sequelize, models };
