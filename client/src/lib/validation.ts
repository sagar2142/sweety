import type { ReadingInput } from '../types';
import { isIsoDate } from './dates';
import { isSlot } from './slots';

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;

/** Same messages as the API, so the user sees identical wording either way. */
export const READING_MESSAGES = {
  dateRequired: 'Please select a date.',
  dateInvalid: 'Please enter a valid date.',
  dateInFuture: 'Date cannot be in the future.',
  slotRequired: 'Please choose a time slot.',
  valueRequired: 'Please enter a glucose value.',
  valueRange: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  valueWholeNumber: `Value must be a whole number between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
} as const;

/** What the form holds while the user is typing (the value is still text). */
export interface ReadingFormValues {
  date: string;
  slot: string;
  value: string;
}

export type ReadingFormErrors = Partial<Record<keyof ReadingFormValues, string>>;

export function validateReadingForm(
  values: ReadingFormValues,
  today: string,
): { errors: ReadingFormErrors; input?: ReadingInput } {
  const errors: ReadingFormErrors = {};

  if (!values.date) errors.date = READING_MESSAGES.dateRequired;
  else if (!isIsoDate(values.date)) errors.date = READING_MESSAGES.dateInvalid;
  else if (values.date > today) errors.date = READING_MESSAGES.dateInFuture;

  if (!isSlot(values.slot)) errors.slot = READING_MESSAGES.slotRequired;

  const rawValue = values.value.trim();
  const value = Number(rawValue);
  if (rawValue === '') errors.value = READING_MESSAGES.valueRequired;
  else if (!Number.isFinite(value) || value < MIN_VALUE || value > MAX_VALUE) errors.value = READING_MESSAGES.valueRange;
  else if (!Number.isInteger(value)) errors.value = READING_MESSAGES.valueWholeNumber;

  if (Object.keys(errors).length > 0) return { errors };
  return { errors, input: { date: values.date, slot: values.slot as ReadingInput['slot'], value } };
}
