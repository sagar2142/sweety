// Simple bands used to label readings in the UI. These are common general
// guideline values for display only – not medical advice.
export const LOW_BELOW = 70;
export const HIGH_ABOVE = 180;

export type GlucoseStatus = 'low' | 'normal' | 'high';

export function glucoseStatus(value: number): GlucoseStatus {
  if (value < LOW_BELOW) return 'low';
  if (value > HIGH_ABOVE) return 'high';
  return 'normal';
}

export const STATUS_LABELS: Record<GlucoseStatus, string> = {
  low: 'Low',
  normal: 'In range',
  high: 'High',
};
