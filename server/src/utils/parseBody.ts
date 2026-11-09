import type { z } from 'zod';
import { AppError, type FieldErrors } from './AppError';

/**
 * Validates `body` against a zod schema. On failure throws a 400 AppError
 * containing the first message for each invalid field.
 */
export function parseBody<Schema extends z.ZodType>(schema: Schema, body: unknown): z.output<Schema> {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;

  const fields: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'body');
    fields[field] ??= issue.message;
  }
  throw AppError.validation(fields);
}
