import { Pool } from 'pg';
import { runMigrations } from '../src/db/migrator';
import { assertIsTestDatabase } from './testDatabase';

// Runs once before all test files: make sure the test database schema is up to date.
export default async function globalSetup(): Promise<void> {
  const connectionString = process.env.TEST_DATABASE_URL ?? 'postgres://sweety:sweety@localhost:5434/sweety_test';
  assertIsTestDatabase(connectionString);

  const pool = new Pool({ connectionString });
  try {
    await runMigrations(pool, () => {});
  } catch (error) {
    throw new Error(
      `Could not prepare the test database (${(error as Error).message}). ` +
        'Is Postgres running? Try: docker compose up -d db',
    );
  } finally {
    await pool.end();
  }
}
