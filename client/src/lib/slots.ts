import type { Slot } from '../types';

export interface SlotOption {
  value: Slot;
  label: string;
  /** Short hint shown under the label in the form */
  hint: string;
}

/** The 4 time slots in the order they happen during a day. */
export const SLOT_OPTIONS: SlotOption[] = [
  { value: 'morning_fasting', label: 'Morning (fasting)', hint: 'Before eating' },
  { value: 'after_breakfast', label: 'After breakfast', hint: '~2 hours after' },
  { value: 'after_lunch', label: 'After lunch', hint: '~2 hours after' },
  { value: 'after_dinner', label: 'After dinner', hint: '~2 hours after' },
];

export const SLOT_LABELS = Object.fromEntries(SLOT_OPTIONS.map((slot) => [slot.value, slot.label])) as Record<
  Slot,
  string
>;

export const MAX_READINGS_PER_DAY = SLOT_OPTIONS.length;

export function isSlot(value: unknown): value is Slot {
  return SLOT_OPTIONS.some((slot) => slot.value === value);
}
