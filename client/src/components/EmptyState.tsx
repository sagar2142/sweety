import type { ReactNode } from 'react';
import { DropIcon } from './Icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
      <span className="empty-state__icon">
        <DropIcon size={compact ? 20 : 24} />
      </span>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__text">{description}</p>}
      {action}
    </div>
  );
}
