const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../subscription_engine.sqlite');
const schemaPath = path.join(__dirname, '../../db/schema.sql');
const db = new sqlite3.Database(dbPath);

// Ensure schema exists: if subscriptions table missing, execute schema.sql
db.serialize(() => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'", (err, row) => {
    if (err) {
      console.error('DB check error', err);
      return;
    }
    if (!row) {
      try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (execErr) => {
          if (execErr) {
            console.warn('Schema file not compatible with SQLite, applying fallback schema', execErr && execErr.message);
            const sqliteSchema = `
              CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                category TEXT NOT NULL,
                plan_type TEXT NOT NULL,
                frequency INTEGER,
                delivery_days TEXT,
                items TEXT NOT NULL,
                quantities TEXT,
                pricing TEXT,
                next_delivery_date TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at DATETIME DEFAULT (datetime('now')),
                updated_at DATETIME DEFAULT (datetime('now'))
              );
            `;
            db.exec(sqliteSchema, (fbErr) => {
              if (fbErr) console.error('Failed to initialize fallback sqlite schema', fbErr);
              else console.log('Initialized minimal sqlite schema');
            });
          } else {
            console.log('Initialized DB schema from', schemaPath);
          }
        });
      } catch (fsErr) {
        console.error('Failed to read schema file', fsErr);
      }
    }
  });
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
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
