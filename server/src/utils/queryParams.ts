import { AppError } from './AppError';
import { isValidIsoDate } from './dates';

/** Reads a positive whole number from a query string value, or returns the default. */
export function positiveIntParam(raw: unknown, name: string, fallback: number, max?: number): number {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (typeof raw !== 'string' || !Number.isInteger(value) || value < 1 || (max !== undefined && value > max)) {
    const range = max !== undefined ? ` between 1 and ${max}` : '';
    throw AppError.badRequest(`"${name}" must be a whole number${range}.`, name);
  }
  return value;
}

/** Reads an optional 'YYYY-MM-DD' date from a query string value. */
export function optionalDateParam(raw: unknown, name: string): string | undefined {
  if (raw === undefined || raw === '') return undefined;
  if (!isValidIsoDate(raw)) {
    throw AppError.badRequest(`"${name}" must be a valid date (YYYY-MM-DD).`, name);
  }
  return raw;
}

/** Reads the ":id" route parameter. Unknown ids return 404 like missing readings. */
export function idParam(raw: unknown, notFoundMessage: string): number {
  const id = Number(raw);
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) {
    throw AppError.notFound(notFoundMessage);
  }
  return id;
}
