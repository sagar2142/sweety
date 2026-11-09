/** The 4 time slots a reading can belong to, in the order they happen during a day. */
export const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'] as const;

export type Slot = (typeof SLOTS)[number];

export const SLOT_LABELS: Record<Slot, string> = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

/** One reading per slot, so at most 4 readings per day. */
export const MAX_READINGS_PER_DAY = SLOTS.length;

export function isSlot(value: unknown): value is Slot {
  return typeof value === 'string' && (SLOTS as readonly string[]).includes(value);
}
