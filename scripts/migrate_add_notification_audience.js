#!/usr/bin/env node
import { sequelize } from '../config/database.js';

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    await qi.addColumn('Notifications', 'audience', {
      type: sequelize.constructor.DataTypes.STRING,
      allowNull: false,
      defaultValue: 'admin'
    });
    console.log('Added Notifications.audience');
  } catch (err) {
    console.warn('Could not add Notifications.audience (may exist):', err.message?.split('\n')[0] || err.message);
  }

  process.exit(0);
}

run().catch(e => { console.error('Migration error:', e); process.exit(1); });
