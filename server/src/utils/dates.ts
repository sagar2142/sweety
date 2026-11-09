// All dates in the API are calendar dates in 'YYYY-MM-DD' format.
// Working with strings (instead of JS Date objects) avoids timezone surprises:
// 'YYYY-MM-DD' strings also compare correctly with < and >.

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** True for a real calendar date such as '2026-02-28' (rejects '2026-02-30'). */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Today's date in the given IANA timezone, e.g. todayIn('Asia/Kolkata') -> '2026-10-15'. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Number of days in a month (month is 1–12). */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Adds (or subtracts) whole days to a 'YYYY-MM-DD' date. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
