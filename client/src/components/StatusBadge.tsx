import { glucoseStatus, STATUS_LABELS } from '../lib/glucose';
import { ArrowDownIcon, ArrowUpIcon, CheckIcon } from './Icons';

const ICONS = { low: ArrowDownIcon, normal: CheckIcon, high: ArrowUpIcon };

/** "In range" / "Low" / "High" pill. Uses icon + text, never colour alone. */
export function StatusBadge({ value }: { value: number }) {
  const status = glucoseStatus(value);
  const StatusIcon = ICONS[status];
  return (
    <span className={`badge badge--${status}`}>
      <StatusIcon size={14} strokeWidth={2.5} />
      {STATUS_LABELS[status]}
    </span>
  );
}
