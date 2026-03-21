#!/usr/bin/env node
import { sequelize } from '../config/database.js';

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    console.log('Dropping Notifications table if exists...');
    await qi.dropTable('Notifications');
    console.log('Dropped Notifications (if existed)');
  } catch (err) {
    console.warn('Drop table failed (may not exist):', err.message?.split('\n')[0] || err.message);
  }

  try {
    console.log('Running sequelize.sync({ alter: true }) to recreate tables...');
    await sequelize.sync({ alter: true });
    console.log('Sync complete');
  } catch (err) {
    console.error('Sync failed:', err.message || err);
  }

  process.exit(0);
}

run().catch(e => { console.error('Error:', e); process.exit(1); });
