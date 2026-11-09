// Dates are passed around as 'YYYY-MM-DD' strings (same as the API).

const pad2 = (value: number) => String(value).padStart(2, '0');

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Today's date in the browser's timezone. */
export function todayLocal(): string {
  return toIsoDate(new Date());
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = parts(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parts(isoDate: string): [number, number, number] {
  return isoDate.split('-').map(Number) as [number, number, number];
}

function toUtcDate(isoDate: string): Date {
  const [year, month, day] = parts(isoDate);
  return new Date(Date.UTC(year, month - 1, day));
}

const fullFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayMonthFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekdayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** '2026-10-15' -> '15 Oct 2026' */
export function formatDate(isoDate: string): string {
  return fullFormat.format(toUtcDate(isoDate));
}

/** '2026-10-15' -> 'Thu 15 Oct 2026' */
export function formatDateWithWeekday(isoDate: string): string {
  return weekdayFormat.format(toUtcDate(isoDate));
}

/** '2026-10-15' -> 'October 2026' */
export function formatMonth(isoDate: string): string {
  return monthFormat.format(toUtcDate(isoDate));
}

/** ('2026-10-01', '2026-10-15') -> '1 Oct – 15 Oct 2026' */
export function formatRange(from: string, to: string): string {
  if (from === to) return formatDate(from);
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${dayMonthFormat.format(toUtcDate(from))} – ${formatDate(to)}`;
  }
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/** First and last day of the month that contains `isoDate`. */
export function monthBounds(isoDate: string): { from: string; to: string } {
  const [year, month] = parts(isoDate);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad2(month)}-01`, to: `${year}-${pad2(month)}-${pad2(lastDay)}` };
}

export function addDays(isoDate: string, days: number): string {
  const date = toUtcDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}
