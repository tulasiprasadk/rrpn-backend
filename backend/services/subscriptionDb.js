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
  const client = await pool.connect();
  if (pool) {
    try {
      await client.query('BEGIN');
      const q = `INSERT INTO subscriptions (user_id, category, type, plan_name, family_size, frequency, schedule, pricing_details, next_delivery_date, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
      const params = [
        sub.user_id, sub.category, sub.type, sub.plan_name, sub.family_size, 
        sub.frequency, JSON.stringify(sub.schedule), JSON.stringify(sub.pricing_details), 
        sub.next_delivery_date, sub.status
      ];
      const subResult = await client.query(q, params);
      const newSub = subResult.rows[0];

      if (sub.items && Array.isArray(sub.items)) {
        for (const item of sub.items) {
          await client.query(
            `INSERT INTO subscription_items (subscription_id, product_id, quantity) VALUES ($1, $2, $3)`,
            [newSub.id, item.product_id, item.quantity]
          );
        }
      }
      await client.query('COMMIT');
      return newSub;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

async function addItemToSubscription(subscriptionId, productId, quantity) {
  const q = `INSERT INTO subscription_items (subscription_id, product_id, quantity) 
             VALUES ($1, $2, $3) RETURNING *`;
  const rows = await pgQuery(q, [subscriptionId, productId, quantity]);
  return rows[0];
}

async function updateSubscription(id, changes) {
  if (pool) {
    const keys = Object.keys(changes);
    const sets = keys.map((k,i) => `${k} = $${i+1}`).join(', ');
    const params = keys.map(k => typeof changes[k] === 'object' && changes[k] !== null ? JSON.stringify(changes[k]) : changes[k]);
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
async function getCategoryRules(category) {
  if (!category) return null;
  if (pool) {
    const rows = await pgQuery('SELECT rules FROM category_rules WHERE category = $1 LIMIT 1', [category]);
    if (rows && rows.length) {
      try {
        return rows[0].rules;
      } catch (e) {
        return rows[0].rules;
      }
    }
    return null;
  }

  // sqlite fallback
  try {
    const row = await sqliteGet('SELECT rules FROM category_rules WHERE category = ? LIMIT 1', [category]);
    if (row && row.rules) return JSON.parse(row.rules);
  } catch (e) {
    // ignore
  }
  return null;
}

export { getCategoryRules };
