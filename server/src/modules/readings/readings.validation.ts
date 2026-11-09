import { AppError, type FieldErrors } from '../../utils/AppError';
import { isValidIsoDate } from '../../utils/dates';
import { isSlot, MAX_READINGS_PER_DAY, SLOT_LABELS, type Slot } from './slots';

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;

/** Every user-facing message for reading validation, in one place. */
export const READING_MESSAGES = {
  dateRequired: 'Please select a date.',
  dateInvalid: 'Please enter a valid date (YYYY-MM-DD).',
  dateInFuture: 'Date cannot be in the future.',
  slotRequired: 'Please choose a time slot.',
  valueRequired: 'Please enter a glucose value.',
  valueRange: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  valueWholeNumber: `Value must be a whole number between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  maxPerDay: `You can add only ${MAX_READINGS_PER_DAY} readings per day.`,
  duplicateSlot: (slot: Slot) => `You already have ${withArticle(SLOT_LABELS[slot])} reading for this date.`,
} as const;

/** 'After lunch' -> 'an After lunch', 'Morning (fasting)' -> 'a Morning (fasting)' */
function withArticle(label: string): string {
  return /^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`;
}

export interface ReadingInput {
  date: string;
  slot: Slot;
  value: number;
}

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

function validateValue(raw: unknown): { value?: number; error?: string } {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return { error: READING_MESSAGES.valueRequired };
  }

  let value: number;
  if (typeof raw === 'number') {
    value = raw;
  } else if (typeof raw === 'string' && NUMBER_PATTERN.test(raw.trim())) {
    value = Number(raw.trim());
  } else {
    return { error: READING_MESSAGES.valueRange };
  }

  if (!Number.isFinite(value) || value < MIN_VALUE || value > MAX_VALUE) {
    return { error: READING_MESSAGES.valueRange };
  }
  if (!Number.isInteger(value)) {
    return { error: READING_MESSAGES.valueWholeNumber };
  }
  return { value };
}

function validateDate(raw: unknown, today: string): string | undefined {
  if (raw === undefined || raw === null || raw === '') return READING_MESSAGES.dateRequired;
  if (!isValidIsoDate(raw)) return READING_MESSAGES.dateInvalid;
  if (raw > today) return READING_MESSAGES.dateInFuture;
  return undefined;
}

/**
 * Checks the shape and value rules of a reading (the rules that do not need
 * the database). Returns the clean input or throws a 400 with one message
 * per invalid field.
 *
 * @param today today's date ('YYYY-MM-DD') in the app timezone
 */
export function validateReadingInput(body: unknown, today: string): ReadingInput {
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const fields: FieldErrors = {};

  const dateError = validateDate(data.date, today);
  if (dateError) fields.date = dateError;

  if (!isSlot(data.slot)) fields.slot = READING_MESSAGES.slotRequired;

  const { value, error: valueError } = validateValue(data.value);
  if (valueError) fields.value = valueError;

  if (Object.keys(fields).length > 0) throw AppError.validation(fields);

  return { date: data.date as string, slot: data.slot as Slot, value: value! };
}

/**
 * Rules that depend on the readings already saved for that day.
 * `slotsTakenThatDay` must NOT include the reading being edited.
 */
export function checkDailyLimits(slotsTakenThatDay: Slot[], slot: Slot): void {
  if (slotsTakenThatDay.length >= MAX_READINGS_PER_DAY) {
    throw AppError.conflict(READING_MESSAGES.maxPerDay, 'date');
  }
  if (slotsTakenThatDay.includes(slot)) {
    throw AppError.conflict(READING_MESSAGES.duplicateSlot(slot), 'slot');
  }
}
