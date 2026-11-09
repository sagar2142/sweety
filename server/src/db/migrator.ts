import fs from 'node:fs/promises';
import path from 'node:path';
import type { Pool } from 'pg';

// SQL files live in server/migrations. This file is at src/db (dev) or
// dist/db (built), so the folder is two levels up in both cases.
const MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', 'migrations');

/**
 * Applies every *.sql file in /migrations that has not been applied yet,
 * in filename order. Each file runs inside its own transaction and is
 * recorded in the schema_migrations table so it never runs twice.
 */
export async function runMigrations(pool: Pool, log: (message: string) => void = console.log): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      log(`Applied migration ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
