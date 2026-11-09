import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ quiet: true });

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://sweety:sweety@localhost:5434/sweety_test';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Integration tests share one database, so run test files one at a time.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      TEST_DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-only-secret-not-for-production',
      BCRYPT_SALT_ROUNDS: '4', // fast hashing in tests
    },
  },
});
