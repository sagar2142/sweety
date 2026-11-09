import { daysInMonth, formatIsoDate } from '../../utils/dates';

export interface DateRange {
  from: string;
  to: string;
}

function splitDate(isoDate: string): [year: number, month: number] {
  const [year, month] = isoDate.split('-').map(Number) as [number, number];
  return [year, month];
}

/** Daily report: just the selected date. 2026-10-15 -> 15 Oct – 15 Oct */
export function dailyRange(date: string): DateRange {
  return { from: date, to: date };
}

/** Month-to-date: 1st of the month up to the selected date. 2026-10-15 -> 1 Oct – 15 Oct */
export function monthToDateRange(date: string): DateRange {
  const [year, month] = splitDate(date);
  return { from: formatIsoDate(year, month, 1), to: date };
}

/** Monthly: the whole month before the selected date. 2026-10-15 -> 1 Sep – 30 Sep */
export function previousMonthRange(date: string): DateRange {
  const [year, month] = splitDate(date);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  return {
    from: formatIsoDate(prevYear, prevMonth, 1),
    to: formatIsoDate(prevYear, prevMonth, daysInMonth(prevYear, prevMonth)),
  };
}
