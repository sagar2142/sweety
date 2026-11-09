import { createApp } from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const server = createApp().listen(env.PORT, () => {
  console.log(`Sweety API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
