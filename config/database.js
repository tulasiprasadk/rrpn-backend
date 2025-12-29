
import { Sequelize } from 'sequelize';
import path from 'path';

const sequelize = new Sequelize('rrnagar_local', 'postgres', 'whatsthepassword', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

export default sequelize;
