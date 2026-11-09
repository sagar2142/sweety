import { describe, expect, it } from 'vitest';
import { formatDate, formatRange, monthBounds } from './dates';
import { glucoseStatus } from './glucose';
import { validateReadingForm } from './validation';

describe('date formatting', () => {
  it('formats dates like the assignment examples', () => {
    expect(formatDate('2026-10-15')).toBe('15 Oct 2026');
    expect(formatRange('2026-10-01', '2026-10-15')).toBe('1 Oct – 15 Oct 2026');
    expect(formatRange('2026-10-15', '2026-10-15')).toBe('15 Oct 2026');
    expect(formatRange('2026-12-20', '2027-01-05')).toBe('20 Dec 2026 – 5 Jan 2027');
  });

  it('finds the first and last day of a month', () => {
    expect(monthBounds('2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});

describe('validateReadingForm', () => {
  const today = '2026-10-15';

  it('returns typed input when everything is valid', () => {
    expect(validateReadingForm({ date: today, slot: 'after_lunch', value: ' 140 ' }, today)).toEqual({
      errors: {},
      input: { date: today, slot: 'after_lunch', value: 140 },
    });
  });

  it('collects one message per invalid field', () => {
    expect(validateReadingForm({ date: '2026-10-20', slot: '', value: '' }, today).errors).toEqual({
      date: 'Date cannot be in the future.',
      slot: 'Please choose a time slot.',
      value: 'Please enter a glucose value.',
    });
  });
});

describe('glucoseStatus', () => {
  it('labels low, in-range and high values', () => {
    expect(glucoseStatus(69)).toBe('low');
    expect(glucoseStatus(70)).toBe('normal');
    expect(glucoseStatus(180)).toBe('normal');
    expect(glucoseStatus(181)).toBe('high');
  });
});
