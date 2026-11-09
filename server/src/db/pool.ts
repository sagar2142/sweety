import { Pool, types } from 'pg';
import { env } from '../config/env';

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects.
// A Date object would be created at local midnight and could shift a reading
// to the previous/next day when serialised to JSON in another timezone.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

export const pool = new Pool({ connectionString: env.DATABASE_URL });

/** Postgres error code for a UNIQUE constraint violation. */
export const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const pgError = error as { code?: string; constraint?: string };
  return pgError.code === UNIQUE_VIOLATION && (constraint === undefined || pgError.constraint === constraint);
}
