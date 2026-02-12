#!/usr/bin/env node
import { sequelize } from '../config/database.js';

async function run() {
  try {
    console.log('Starting sync...');
    await sequelize.sync({ alter: true });
    console.log('Sync successful');
  } catch (err) {
    console.error('Sync error stack:', err);
    process.exit(1);
  }
  process.exit(0);
}

run();
