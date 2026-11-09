import { describe, expect, it } from 'vitest';
import { dailyRange, monthToDateRange, previousMonthRange } from '../../src/modules/reports/dateRanges';
import { addDays, isValidIsoDate, todayIn } from '../../src/utils/dates';

describe('report date ranges', () => {
  // The example from the assignment: selected date 15 Oct 2026.
  it('daily range is just the selected date', () => {
    expect(dailyRange('2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });

  it('month-to-date runs from the 1st of the month to the selected date', () => {
    expect(monthToDateRange('2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  it('monthly is the whole previous month', () => {
    expect(previousMonthRange('2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('monthly in January goes back to December of the previous year', () => {
    expect(previousMonthRange('2027-01-10')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });

  it('monthly handles February in leap and non-leap years', () => {
    expect(previousMonthRange('2028-03-05')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(previousMonthRange('2026-03-05')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});

describe('date helpers', () => {
  it('accepts only real YYYY-MM-DD dates', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('15-10-2026')).toBe(false);
    expect(isValidIsoDate('2026-1-5')).toBe(false);
    expect(isValidIsoDate(20261015)).toBe(false);
  });

  it('works out "today" in the configured timezone', () => {
    // 20:00 UTC on 14 Oct is already 15 Oct in India (UTC+5:30).
    const instant = new Date('2026-10-14T20:00:00Z');
    expect(todayIn('UTC', instant)).toBe('2026-10-14');
    expect(todayIn('Asia/Kolkata', instant)).toBe('2026-10-15');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
});
