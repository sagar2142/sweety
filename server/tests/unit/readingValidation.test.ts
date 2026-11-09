import { describe, expect, it } from 'vitest';
import {
  checkDailyLimits,
  READING_MESSAGES,
  validateReadingInput,
} from '../../src/modules/readings/readings.validation';
import { AppError } from '../../src/utils/AppError';

const TODAY = '2026-10-15';
const valid = { date: '2026-10-15', slot: 'after_lunch', value: 120 };

/** Runs the validator and returns the field errors it throws (or {} if valid). */
function fieldErrors(body: unknown): Record<string, string> {
  try {
    validateReadingInput(body, TODAY);
    return {};
  } catch (error) {
    if (error instanceof AppError) return error.fields ?? {};
    throw error;
  }
}

describe('validateReadingInput', () => {
  it('returns clean data for a valid reading', () => {
    expect(validateReadingInput(valid, TODAY)).toEqual(valid);
  });

  it('accepts a numeric string value and converts it', () => {
    expect(validateReadingInput({ ...valid, value: ' 95 ' }, TODAY).value).toBe(95);
  });

  it.each([undefined, null, ''])('requires a value (got %j)', (value) => {
    expect(fieldErrors({ ...valid, value }).value).toBe(READING_MESSAGES.valueRequired);
  });

  it.each([39, 601, -5, 'abc', '12abc'])('rejects %j as out of range', (value) => {
    expect(fieldErrors({ ...valid, value }).value).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('accepts the boundary values 40 and 600', () => {
    expect(fieldErrors({ ...valid, value: 40 })).toEqual({});
    expect(fieldErrors({ ...valid, value: 600 })).toEqual({});
  });

  it('rejects decimals', () => {
    expect(fieldErrors({ ...valid, value: 120.5 }).value).toBe(READING_MESSAGES.valueWholeNumber);
  });

  it('rejects a date in the future but allows today', () => {
    expect(fieldErrors({ ...valid, date: '2026-10-16' }).date).toBe('Date cannot be in the future.');
    expect(fieldErrors({ ...valid, date: TODAY })).toEqual({});
  });

  it('rejects missing and impossible dates', () => {
    expect(fieldErrors({ ...valid, date: '' }).date).toBe(READING_MESSAGES.dateRequired);
    expect(fieldErrors({ ...valid, date: '2026-02-30' }).date).toBe(READING_MESSAGES.dateInvalid);
  });

  it('rejects an unknown slot', () => {
    expect(fieldErrors({ ...valid, slot: 'midnight_snack' }).slot).toBe(READING_MESSAGES.slotRequired);
  });

  it('reports every invalid field at once', () => {
    expect(Object.keys(fieldErrors({}))).toEqual(['date', 'slot', 'value']);
  });
});

describe('checkDailyLimits', () => {
  it('allows a free slot', () => {
    expect(() => checkDailyLimits(['morning_fasting'], 'after_lunch')).not.toThrow();
  });

  it('rejects a slot that is already used, naming the slot', () => {
    expect(() => checkDailyLimits(['after_lunch'], 'after_lunch')).toThrow(
      'You already have an After lunch reading for this date.',
    );
  });

  it('rejects a 5th reading with the daily-limit message', () => {
    const fullDay = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'] as const;
    expect(() => checkDailyLimits([...fullDay], 'after_dinner')).toThrow('You can add only 4 readings per day.');
  });
});
