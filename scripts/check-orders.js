
import { sequelize } from '../models/index.js';
(async () => {
  try {
    const [rows] = await sequelize.query("PRAGMA table_info('Orders')");
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();
