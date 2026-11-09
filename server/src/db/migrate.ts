// CLI entry point: `npm run migrate`
import { pool } from './pool';
import { runMigrations } from './migrator';

async function main(): Promise<void> {
  try {
    await runMigrations(pool);
    console.log('Database is up to date.');
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
