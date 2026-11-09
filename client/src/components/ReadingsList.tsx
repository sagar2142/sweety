import { formatDate, formatDateWithWeekday } from '../lib/dates';
import { SLOT_LABELS } from '../lib/slots';
import type { Reading } from '../types';
import { EditIcon, TrashIcon } from './Icons';
import { StatusBadge } from './StatusBadge';

interface ReadingsListProps {
  readings: Reading[];
  today: string;
  editingId?: number;
  /** Set to false when the surrounding card already names the date. */
  showDateHeadings?: boolean;
  onEdit?: (reading: Reading) => void;
  onDelete?: (reading: Reading) => void;
}

/** Readings grouped under a heading per date. Edit/Delete buttons are optional. */
export function ReadingsList({
  readings,
  today,
  editingId,
  showDateHeadings = true,
  onEdit,
  onDelete,
}: ReadingsListProps) {
  const groups = groupByDate(readings);

  return (
    <div className="reading-groups">
      {groups.map(([date, dayReadings]) => (
        <section key={date} className="reading-group" aria-label={formatDate(date)}>
          {showDateHeadings && (
            <h3 className="reading-group__date">
              {formatDateWithWeekday(date)}
              {date === today && <span className="tag">Today</span>}
            </h3>
          )}
          <ul className="reading-rows">
            {dayReadings.map((reading) => (
              <li key={reading.id} className={`reading-row${reading.id === editingId ? ' reading-row--editing' : ''}`}>
                <span className="reading-row__slot">{SLOT_LABELS[reading.slot]}</span>
                <span className="reading-row__value">
                  <strong>{reading.value}</strong> <span className="unit">mg/dl</span>
                </span>
                <span className="reading-row__status">
                  <StatusBadge value={reading.value} />
                </span>
                {(onEdit || onDelete) && (
                  <span className="reading-row__actions">
                    {onEdit && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEdit(reading)}
                        aria-label={`Edit ${SLOT_LABELS[reading.slot]} reading on ${formatDate(reading.date)}`}
                        title="Edit"
                      >
                        <EditIcon size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => onDelete(reading)}
                        aria-label={`Delete ${SLOT_LABELS[reading.slot]} reading on ${formatDate(reading.date)}`}
                        title="Delete"
                      >
                        <TrashIcon size={18} />
                      </button>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Keeps the incoming order and groups consecutive readings by date. */
function groupByDate(readings: Reading[]): [string, Reading[]][] {
  const groups = new Map<string, Reading[]>();
  for (const reading of readings) {
    const group = groups.get(reading.date) ?? [];
    group.push(reading);
    groups.set(reading.date, group);
  }
  return [...groups.entries()];
}
