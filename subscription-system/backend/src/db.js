const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../subscription_engine.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function insertSubscription(sub) {
  const sql = `INSERT INTO subscriptions (user_id, category, plan_type, frequency, delivery_days, items, quantities, pricing, next_delivery_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
  const params = [sub.user_id, sub.category, sub.plan_type, sub.frequency, sub.delivery_days, sub.items, sub.quantities, sub.pricing, sub.next_delivery_date, sub.status];
  const r = await run(sql, params);
  const row = await get('SELECT * FROM subscriptions WHERE id = ?', [r.id]);
  return row;
}

async function updateSubscription(id, changes) {
  const keys = Object.keys(changes);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const params = keys.map(k => typeof changes[k] === 'object' ? JSON.stringify(changes[k]) : changes[k]);
  params.push(id);
  const sql = `UPDATE subscriptions SET ${sets}, updated_at = datetime('now') WHERE id = ?`;
  await run(sql, params);
  return await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
}

async function skipNextSchedule(subscriptionId) {
  // simplistic: bump next_delivery_date by one frequency period
  const sub = await get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  if (!sub) throw new Error('subscription_not_found');
  const freq = sub.frequency || 1;
  const next = new Date(sub.next_delivery_date || Date.now());
  next.setDate(next.getDate() + (7 * freq));
  await run('UPDATE subscriptions SET next_delivery_date = ? WHERE id = ?', [next.toISOString(), subscriptionId]);
  return next.toISOString();
}

module.exports = { run, get, all, insertSubscription, updateSubscription, skipNextSchedule };
