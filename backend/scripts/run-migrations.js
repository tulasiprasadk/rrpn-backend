import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set; aborting migrations');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  try {
    for (const f of files) {
      const p = path.join(migrationsDir, f);
      console.log('Applying', f);
      const sql = fs.readFileSync(p, 'utf8');
      await pool.query(sql);
    }
    console.log('Migrations applied successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    await pool.end();
    process.exit(1);
  }
}

run();
