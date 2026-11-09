import { SLOT_OPTIONS, MAX_READINGS_PER_DAY } from '../lib/slots';
import type { Reading } from '../types';
import { CheckIcon } from './Icons';

/** Shows which of today's 4 slots already have a reading. */
export function TodayProgress({ readings }: { readings: Reading[] }) {
  const bySlot = new Map(readings.map((reading) => [reading.slot, reading]));
  const done = bySlot.size;

  return (
    <div className="today-progress">
      <div className="today-progress__header">
        <p className="today-progress__count">
          <strong>{done}</strong> of {MAX_READINGS_PER_DAY} readings logged today
        </p>
        <div
          className="progress"
          role="progressbar"
          aria-label="Readings logged today"
          aria-valuemin={0}
          aria-valuemax={MAX_READINGS_PER_DAY}
          aria-valuenow={done}
        >
          <span className="progress__fill" style={{ width: `${(done / MAX_READINGS_PER_DAY) * 100}%` }} />
        </div>
      </div>
      <ul className="slot-checklist">
        {SLOT_OPTIONS.map((slot) => {
          const reading = bySlot.get(slot.value);
          return (
            <li key={slot.value} className={`slot-check${reading ? ' slot-check--done' : ''}`}>
              <span className="slot-check__icon" aria-hidden="true">
                {reading ? <CheckIcon size={14} strokeWidth={3} /> : null}
              </span>
              <span className="slot-check__label">{slot.label}</span>
              <span className="slot-check__value">
                {reading ? (
                  <>
                    {reading.value} <span className="unit">mg/dl</span>
                  </>
                ) : (
                  'Not logged'
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
