import pg from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '';
let pool = null;
if (DATABASE_URL) {
  pool = new pg.Pool({ connectionString: DATABASE_URL });
}

const sqlitePath = path.join(process.cwd(), 'database.sqlite');
const hasSqlite = fs.existsSync(sqlitePath);

function pgQuery(text, params=[]) {
  return pool.query(text, params).then(r => r.rows);
}

function sqliteRun(sql, params=[]) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath);
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
    db.close();
  });
}

function sqliteGet(sql, params=[]) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath);
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
    db.close();
  });
}

async function insertSubscription(sub) {
  if (pool) {
    const q = `INSERT INTO subscriptions (user_id, category, plan_type, frequency, delivery_days, items, quantities, pricing, next_delivery_date, status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now()) RETURNING *`;
    const params = [sub.user_id, sub.category, sub.plan_type, sub.frequency, sub.delivery_days ? JSON.parse(sub.delivery_days) : null, sub.items ? JSON.parse(sub.items) : null, sub.quantities ? JSON.parse(sub.quantities) : null, sub.pricing ? JSON.parse(sub.pricing) : null, sub.next_delivery_date, sub.status];
    const rows = await pgQuery(q, params);
    return rows[0];
  }

  // sqlite fallback
  const sql = `INSERT INTO subscriptions (user_id, category, plan_type, frequency, delivery_days, items, quantities, pricing, next_delivery_date, status, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`;
  await sqliteRun(sql, [sub.user_id, sub.category, sub.plan_type, sub.frequency, sub.delivery_days, sub.items, sub.quantities, sub.pricing, sub.next_delivery_date, sub.status]);
  const row = await sqliteGet('SELECT * FROM subscriptions ORDER BY id DESC LIMIT 1');
  return row;
}

async function updateSubscription(id, changes) {
  if (pool) {
    const keys = Object.keys(changes);
    const sets = keys.map((k,i) => `${k} = $${i+1}`).join(', ');
    const params = keys.map(k => typeof changes[k] === 'object' ? changes[k] : changes[k]);
    params.push(id);
    const q = `UPDATE subscriptions SET ${sets}, updated_at = now() WHERE id = $${params.length} RETURNING *`;
    const rows = await pgQuery(q, params);
    return rows[0];
  }

  // sqlite fallback (simple)
  const keys = Object.keys(changes);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const params = keys.map(k => typeof changes[k] === 'object' ? JSON.stringify(changes[k]) : changes[k]);
  params.push(id);
  await sqliteRun(`UPDATE subscriptions SET ${sets}, updated_at = datetime('now') WHERE id = ?`, params);
  return await sqliteGet('SELECT * FROM subscriptions WHERE id = ?', [id]);
}

async function skipNextSchedule(id) {
  if (pool) {
    const row = (await pgQuery('SELECT * FROM subscriptions WHERE id = $1', [id]))[0];
    if (!row) throw new Error('not_found');
    const freq = row.frequency || 1;
    const next = new Date(row.next_delivery_date || Date.now());
    next.setDate(next.getDate() + (7 * freq));
    const updated = (await pgQuery('UPDATE subscriptions SET next_delivery_date = $1, updated_at = now() WHERE id = $2 RETURNING *', [next.toISOString(), id]))[0];
    return updated.next_delivery_date;
  }

  // sqlite fallback
  const row = await sqliteGet('SELECT * FROM subscriptions WHERE id = ?', [id]);
  if (!row) throw new Error('not_found');
  const freq = row.frequency || 1;
  const next = new Date(row.next_delivery_date || Date.now());
  next.setDate(next.getDate() + (7 * freq));
  await sqliteRun('UPDATE subscriptions SET next_delivery_date = ? WHERE id = ?', [next.toISOString(), id]);
  return next.toISOString();
}

async function recommendFor(userId, payload) {
  if (!payload) return null;
  if (pool) {
    await pgQuery('INSERT INTO recommendations (user_id, payload, created_at) VALUES ($1,$2,now())', [userId, payload]);
    return true;
  }
  await sqliteRun('INSERT INTO recommendations (user_id, payload, created_at) VALUES (?,?,datetime("now"))', [userId, JSON.stringify(payload)]);
  return true;
}

export { insertSubscription, updateSubscription, skipNextSchedule, recommendFor };
