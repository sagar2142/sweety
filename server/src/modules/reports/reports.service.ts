import { pool } from '../../db/pool';
import { readingsOnDate, type Reading } from '../readings/readings.service';
import { dailyRange, monthToDateRange, previousMonthRange, type DateRange } from './dateRanges';

export interface ReportSummary extends DateRange {
  count: number;
  /** null when there are no readings in the range */
  highest: number | null;
  lowest: number | null;
  /** Rounded to 1 decimal place */
  average: number | null;
}

export interface DailyReport extends ReportSummary {
  readings: Reading[];
}

interface SummaryRow {
  count: number;
  highest: number | null;
  lowest: number | null;
  average: string | null;
}

async function summarise(userId: number, range: DateRange): Promise<ReportSummary> {
  const { rows } = await pool.query<SummaryRow>(
    `SELECT COUNT(*)::int                       AS count,
            MAX(value_mgdl)::int                AS highest,
            MIN(value_mgdl)::int                AS lowest,
            ROUND(AVG(value_mgdl)::numeric, 1)  AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, range.from, range.to],
  );
  const row = rows[0]!;
  return {
    ...range,
    count: row.count,
    highest: row.highest,
    lowest: row.lowest,
    // NUMERIC comes back from pg as a string (to keep precision) – convert it.
    average: row.average === null ? null : Number(row.average),
  };
}

export async function getDailyReport(userId: number, date: string): Promise<DailyReport> {
  const [summary, readings] = await Promise.all([
    summarise(userId, dailyRange(date)),
    readingsOnDate(userId, date),
  ]);
  return { ...summary, readings };
}

export function getMonthToDateReport(userId: number, date: string): Promise<ReportSummary> {
  return summarise(userId, monthToDateRange(date));
}

export function getMonthlyReport(userId: number, date: string): Promise<ReportSummary> {
  return summarise(userId, previousMonthRange(date));
}
