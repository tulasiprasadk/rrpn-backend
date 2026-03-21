#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { models, sequelize } from '../config/database.js';

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: import_batch.js <csv-file> [batchSize]');
    process.exit(1);
  }
  const file = args[0];
  const BATCH = Number(args[1] || process.env.IMPORT_BATCH_SIZE || 500);

  const csv = fs.readFileSync(path.resolve(file), 'utf8');
  const lines = csv.split('\n').map(l=>l.trim()).filter(Boolean);
  const header = lines.shift().split(',').map(h=>h.trim());

  const products = lines.map(line => {
    // naive CSV split — for complex CSVs replace with a proper parser
    const parts = line.split(',');
    const obj = {};
    for (let i=0;i<header.length;i++) obj[header[i]] = (parts[i]||'').trim();
    return obj;
  });

  const { Product, Category } = models || {};
  if (!Product) {
    console.error('DB models not ready'); process.exit(2);
  }

  // cache categories
  const catMap = new Map();
  const existingCats = await Category.findAll();
  existingCats.forEach(c => catMap.set((c.name||'').toLowerCase(), c.id));

  for (let i=0;i<products.length;i+=BATCH) {
    const batch = products.slice(i,i+BATCH);
    const toCreate = [];
    for (const raw of batch) {
      const title = (raw.title||raw.titleName||raw.name||'').trim();
      const price = Number(raw.price||0);
      if (!title || !Number.isFinite(price)) continue;
      let catId = null;
      const catName = (raw.categoryName||raw.Category||'').trim();
      if (catName) {
        const key = catName.toLowerCase();
        if (catMap.has(key)) catId = catMap.get(key);
        else {
          const created = await Category.create({ name: catName });
          catMap.set(key, created.id); catId = created.id;
        }
      }
      toCreate.push({ title, price, unit: raw.unit||null, description: raw.description||null, variety: raw.variety||null, subVariety: raw.subVariety||null, CategoryId: catId||null, status: 'pending', active: false });
    }
    if (toCreate.length) {
      await sequelize.transaction(async (t) => {
        await Product.bulkCreate(toCreate, { transaction: t });
      });
      console.log(`Inserted ${toCreate.length} items (batch ${i/BATCH + 1})`);
    }
    await sleep(Number(process.env.IMPORT_BATCH_DELAY_MS || 200));
  }

  console.log('Import complete');
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
