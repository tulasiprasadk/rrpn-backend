#!/usr/bin/env node
import { initDatabase, sequelize } from '../config/database.js';

async function addColumnIfMissing(table, column, definition) {
  const qi = sequelize.getQueryInterface();
  try {
    const tableDesc = await qi.describeTable(table);
    if (tableDesc[column]) {
      console.log(`Column ${column} already exists on ${table}`);
      return;
    }
  } catch (err) {
    // Table may not exist yet
    console.warn(`Could not describe table ${table}:`, err.message || err);
  }

  try {
    console.log(`Adding column ${column} to ${table}`);
    await qi.addColumn(table, column, definition);
    console.log(`Added ${column}`);
  } catch (err) {
    console.error(`Failed adding column ${column}:`, err.message || err);
  }
}

async function main() {
  await initDatabase();

  // Use generic types compatible with sqlite/postgres
  const FLOAT = { type: 'DOUBLE' };
  const BOOLEAN = { type: 'BOOLEAN', allowNull: true, defaultValue: false };

  await addColumnIfMissing('Products', 'yearlyPrice', FLOAT);
  await addColumnIfMissing('Products', 'hasYearlyPackage', BOOLEAN);

  // Also ensure monthly fields exist (safe no-op if present)
  await addColumnIfMissing('Products', 'monthlyPrice', FLOAT);
  await addColumnIfMissing('Products', 'hasMonthlyPackage', BOOLEAN);

  console.log('Migration complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
