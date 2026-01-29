#!/usr/bin/env node
/*
  scripts/replace_groceries.js

  Deletes all products whose `category` matches groceries (case-insensitive)
  from the admin products endpoint, then uploads new products from a CSV.

  Usage:
    node scripts/replace_groceries.js --api=https://rrnagar.com --file=groceries.csv --confirm --cookie="connect.sid=..."

  Notes:
  - The admin-upload-server (dev) at http://localhost:5002 provides unauthenticated endpoints.
  - For production (`https://rrnagar.com`) you must pass an admin session cookie with `--cookie`.
  - Script requires Node 18+ (global fetch). If older Node, run with a fetch polyfill.
*/
import fs from 'fs';
import path from 'path';

const args = Object.fromEntries(process.argv.slice(2).map(a=>{
  const [k,v] = a.split('=');
  return [k.replace(/^--/,''), v===undefined ? true : v];
}));

const API = args.api || 'http://localhost:5002';
const FILE = args.file || 'groceries.csv';
const COOKIE = args.cookie;
const CONFIRM = args.confirm === true || args.confirm === 'true';

function parseCSV(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines.shift().split(',').map(h=>h.trim());
  return lines.map(line=>{
    const cols = line.split(',').map(c=>c.trim());
    const obj = {};
    headers.forEach((h,i)=> obj[h]=cols[i] ?? '');
    return obj;
  });
}

async function api(path, opts={}){
  const headers = opts.headers || {};
  if (COOKIE) headers['Cookie'] = COOKIE;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, { ...opts, headers });
  let bodyText = '';
  try { bodyText = await res.text(); } catch(e){}
  let body = bodyText;
  try { body = JSON.parse(bodyText); } catch(e){}
  return { status: res.status, body };
}

function isGroceryCategory(cat){
  if (!cat) return false;
  const c = String(cat).toLowerCase();
  return c.includes('grocery') || c.includes('grocer') || c.includes('produce') || c.includes('veg');
}

async function main(){
  console.log('API:', API);
  console.log('CSV file:', FILE);
  if (!CONFIRM) {
    console.log('\nWARNING: This script will DELETE matching products.');
    console.log('Re-run with --confirm to actually perform deletions and uploads.');
  }

  // fetch all products
  const all = await api('/admin/products');
  if (all.status !== 200) { console.error('Failed to fetch products:', all); process.exit(1); }
  const products = Array.isArray(all.body) ? all.body : [];

  const toDelete = products.filter(p => isGroceryCategory(p.category) || isGroceryCategory(p.categoryName) || isGroceryCategory(p.category_id) );

  console.log(`Found ${toDelete.length} grocery product(s) to delete.`);
  if (toDelete.length===0) {
    console.log('No groceries to delete. Proceeding to upload (if CSV present).');
  }

  if (!CONFIRM) {
    toDelete.slice(0, 10).forEach(p => console.log('-', p.id || p.sku || p.title, 'category=', p.category));
    console.log('\nAdd --confirm to proceed.');
    return;
  }

  // Delete
  let deleted = 0;
  for (const p of toDelete){
    const id = p.id;
    if (!id) { console.warn('Skipping product without id', p); continue; }
    const res = await api(`/admin/products/${id}`, { method: 'DELETE' });
    if (res.status === 200) deleted++; else console.warn('Failed to delete', id, res.status, res.body);
  }
  console.log('Deleted:', deleted);

  // Upload CSV
  if (!fs.existsSync(path.resolve(FILE))){ console.log('CSV file not found, done.'); return; }
  const csv = fs.readFileSync(path.resolve(FILE),'utf8');
  const rows = parseCSV(csv);
  console.log('CSV rows:', rows.length);
  let created = 0, failed = 0;
  for (const r of rows){
    // build payload: common headers supported: sku,title,price,stock,category,description
    const payload = {
      sku: r.sku || r.SKU || undefined,
      title: r.title || r.name || r.product || (r.sku || ''),
      price: r.price ? Number(r.price) : 0,
      stock: r.stock ? Number(r.stock) : 0,
      category: r.category || r.categoryName || 'Grocery',
      description: r.description || ''
    };
    const res = await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
    if (res.status === 200 || res.status === 201) created++; else { failed++; console.warn('Failed to create', payload.sku, res.status, res.body); }
  }
  console.log('Created:', created, 'Failed:', failed);
}

main().catch(e=>{ console.error(e); process.exit(1); });
