#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { sequelize, models } from '../config/database.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const fileArg = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!fileArg) {
  console.error('Usage: node update_prices_from_csv.js <csv-path> [--apply]');
  process.exit(1);
}

const filePath = path.resolve(fileArg);
if (!fs.existsSync(filePath)) {
  console.error('CSV file not found:', filePath);
  process.exit(1);
}

function normalizeTitle(t) {
  return String(t || '').trim().toLowerCase();
}

async function buildMap() {
  const map = new Map();
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers = null;
  let delim = ',';
  for await (const line of rl) {
    if (!headers) {
      delim = line.includes('\t') ? '\t' : ',';
      headers = line.split(delim).map(h => h.trim().toLowerCase());
      continue;
    }
    const parts = line.split(delim);
    if (parts.length <= 1) continue;
    // Heuristics for column names
    const idxTitle = headers.findIndex(h => ['product','title','name'].includes(h));
    const idxPrice = headers.findIndex(h => ['market_price','price','mrp','selling_price','marketprice'].includes(h));
    if (idxTitle === -1) continue;
    const title = parts[idxTitle] ? parts[idxTitle].trim() : '';
    const priceRaw = idxPrice !== -1 ? (parts[idxPrice] || '') : '';
    const price = Number(String(priceRaw).replace(/[^0-9.\-]/g, '')) || 0;
    if (!title) continue;
    const key = normalizeTitle(title);
    if (!map.has(key) && price > 0) map.set(key, price);
  }
  return map;
}

async function run() {
  await sequelize.authenticate();
  const { Product } = models || {};
  if (!Product) {
    console.error('DB models not available');
    process.exit(2);
  }

  console.log('Building CSV title->price map from', filePath);
  const csvMap = await buildMap();
  console.log('CSV entries with positive price:', csvMap.size);

  const pageSize = 1000;
  let offset = 0;
  let matched = 0;
  let updated = 0;

  while (true) {
    const rows = await Product.findAll({
      where: { price: { [Op.or]: [null, 0] } },
      attributes: ['id', 'title', 'price'],
      limit: pageSize,
      offset,
      order: [['id', 'ASC']],
    });
    if (!rows || rows.length === 0) break;

    const updates = [];
    for (const p of rows) {
      const key = normalizeTitle(p.title || '');
      const csvPrice = csvMap.get(key);
      if (csvPrice && csvPrice > 0) {
        matched += 1;
        updates.push({ id: p.id, price: csvPrice });
      }
    }

    if (updates.length) {
      console.log(`Batch offset ${offset}: matched ${updates.length} rows`);
      if (APPLY) {
        await sequelize.transaction(async (t) => {
          for (const u of updates) {
            await Product.update({ price: u.price }, { where: { id: u.id }, transaction: t });
            updated += 1;
          }
        });
      }
    }

    offset += rows.length;
  }

  console.log('Done. Matched:', matched, 'Updated:', updated, '(APPLY=', APPLY, ')');
  await sequelize.close();
}

run().catch(err => {
  console.error('Error updating prices:', err && err.message ? err.message : err);
  process.exit(1);
});
