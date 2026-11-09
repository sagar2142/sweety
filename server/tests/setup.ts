import { afterAll, beforeEach } from 'vitest';
import { pool } from '../src/db/pool';
import { assertIsTestDatabase } from './testDatabase';

assertIsTestDatabase(process.env.DATABASE_URL ?? '');

// Every test starts with an empty database.
beforeEach(async () => {
  await pool.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});
