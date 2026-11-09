import { isUniqueViolation, pool } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import { checkDailyLimits, READING_MESSAGES, type ReadingInput } from './readings.validation';
import type { Slot } from './slots';

export interface Reading {
  id: number;
  date: string;
  slot: Slot;
  value: number;
  createdAt: string;
  updatedAt: string;
}

interface ReadingRow {
  id: number;
  reading_date: string;
  slot: Slot;
  value_mgdl: number;
  created_at: Date;
  updated_at: Date;
}

export interface ListOptions {
  page: number;
  limit: number;
  from?: string;
  to?: string;
}

export interface PaginatedReadings {
  data: Reading[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const COLUMNS = 'id, reading_date, slot, value_mgdl, created_at, updated_at';
const SLOT_CONSTRAINT = 'readings_one_per_slot_per_day';
const NOT_FOUND = 'Reading not found.';

function toReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    date: row.reading_date,
    slot: row.slot,
    value: row.value_mgdl,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** Newest first. Within a day: After dinner -> Morning. */
export async function listReadings(userId: number, options: ListOptions): Promise<PaginatedReadings> {
  const params: unknown[] = [userId];
  const conditions = ['user_id = $1'];
  if (options.from) {
    params.push(options.from);
    conditions.push(`reading_date >= $${params.length}`);
  }
  if (options.to) {
    params.push(options.to);
    conditions.push(`reading_date <= $${params.length}`);
  }
  const where = conditions.join(' AND ');

  const countResult = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM readings WHERE ${where}`,
    params,
  );
  const total = countResult.rows[0]?.total ?? 0;

  const offset = (options.page - 1) * options.limit;
  const { rows } = await pool.query<ReadingRow>(
    `SELECT ${COLUMNS} FROM readings
     WHERE ${where}
     ORDER BY reading_date DESC, slot DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, options.limit, offset],
  );

  return {
    data: rows.map(toReading),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

/** All readings on one date in slot order (Morning first). */
export async function readingsOnDate(userId: number, date: string): Promise<Reading[]> {
  const { rows } = await pool.query<ReadingRow>(
    `SELECT ${COLUMNS} FROM readings WHERE user_id = $1 AND reading_date = $2 ORDER BY slot`,
    [userId, date],
  );
  return rows.map(toReading);
}

export async function getReading(userId: number, readingId: number): Promise<Reading> {
  const { rows } = await pool.query<ReadingRow>(
    `SELECT ${COLUMNS} FROM readings WHERE id = $1 AND user_id = $2`,
    [readingId, userId],
  );
  if (!rows[0]) throw AppError.notFound(NOT_FOUND);
  return toReading(rows[0]);
}

/** Slots already used on a date, optionally ignoring one reading (the one being edited). */
async function slotsTakenOn(userId: number, date: string, excludeReadingId?: number): Promise<Slot[]> {
  const { rows } = await pool.query<{ slot: Slot }>(
    `SELECT slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeReadingId ?? null],
  );
  return rows.map((row) => row.slot);
}

export async function createReading(userId: number, input: ReadingInput): Promise<Reading> {
  checkDailyLimits(await slotsTakenOn(userId, input.date), input.slot);

  try {
    const { rows } = await pool.query<ReadingRow>(
      `INSERT INTO readings (user_id, reading_date, slot, value_mgdl)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUMNS}`,
      [userId, input.date, input.slot, input.value],
    );
    return toReading(rows[0]!);
  } catch (error) {
    throw translateSlotConflict(error, input.slot);
  }
}

export async function updateReading(userId: number, readingId: number, input: ReadingInput): Promise<Reading> {
  await getReading(userId, readingId); // 404 if it does not exist or belongs to someone else
  checkDailyLimits(await slotsTakenOn(userId, input.date, readingId), input.slot);

  try {
    const { rows } = await pool.query<ReadingRow>(
      `UPDATE readings
       SET reading_date = $3, slot = $4, value_mgdl = $5, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING ${COLUMNS}`,
      [readingId, userId, input.date, input.slot, input.value],
    );
    if (!rows[0]) throw AppError.notFound(NOT_FOUND);
    return toReading(rows[0]);
  } catch (error) {
    throw translateSlotConflict(error, input.slot);
  }
}

export async function deleteReading(userId: number, readingId: number): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [readingId, userId]);
  if (!rowCount) throw AppError.notFound(NOT_FOUND);
}

/**
 * Two requests for the same slot can pass the check above at the same time.
 * The UNIQUE constraint stops the second one; we turn that DB error into
 * the normal friendly message.
 */
function translateSlotConflict(error: unknown, slot: Slot): unknown {
  if (isUniqueViolation(error, SLOT_CONSTRAINT)) {
    return AppError.conflict(READING_MESSAGES.duplicateSlot(slot), 'slot');
  }
  return error;
}
