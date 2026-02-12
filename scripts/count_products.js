#!/usr/bin/env node
import { initDatabase, models } from '../config/database.js';

async function main() {
  await initDatabase();
  const { Product } = models;
  if (!Product) {
    console.error('Product model not available');
    process.exit(1);
  }
  const count = await Product.count();
  console.log('Products count:', count);
  const sample = await Product.findAll({ limit: 5 });
  console.log('Sample rows (up to 5):', sample.map(r => (r.toJSON ? r.toJSON() : r)));
  process.exit(0);
}

main().catch(err => {
  console.error('Error counting products:', err);
  process.exit(1);
});
