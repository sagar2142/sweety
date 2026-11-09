import type { ReactNode } from 'react';
import type { ReportSummary } from '../types';
import { EmptyState } from './EmptyState';
import { CalendarIcon } from './Icons';

interface SummaryCardProps {
  title: string;
  /** Human readable date range, e.g. "1 Oct – 15 Oct 2026" */
  rangeLabel: string;
  summary?: ReportSummary;
  emptyTitle: string;
  emptyAction?: ReactNode;
}

/** Average, highest, lowest and count for one report period. */
export function SummaryCard({ title, rangeLabel, summary, emptyTitle, emptyAction }: SummaryCardProps) {
  const titleId = `summary-${title.toLowerCase().replace(/\W+/g, '-')}`;

  return (
    <article className="card summary-card" aria-labelledby={titleId}>
      <header className="summary-card__header">
        <h2 id={titleId} className="summary-card__title">
          {title}
        </h2>
        <p className="summary-card__range">
          <CalendarIcon size={16} />
          {rangeLabel}
        </p>
      </header>

      {!summary ? (
        <div className="summary-card__placeholder" aria-hidden="true" />
      ) : summary.count === 0 || summary.average === null ? (
        <EmptyState compact title={emptyTitle} description="Readings you add will be summarised here." action={emptyAction} />
      ) : (
        <div className="summary-card__content">
          <p className="summary-card__hero">
            <span className="hero-value">{summary.average.toFixed(1)}</span>
            <span className="hero-unit">mg/dl average</span>
          </p>
          <dl className="stat-list">
            <div className="stat">
              <dt>Highest</dt>
              <dd>
                {summary.highest} <span className="unit">mg/dl</span>
              </dd>
            </div>
            <div className="stat">
              <dt>Lowest</dt>
              <dd>
                {summary.lowest} <span className="unit">mg/dl</span>
              </dd>
            </div>
            <div className="stat">
              <dt>Readings</dt>
              <dd>{summary.count}</dd>
            </div>
          </dl>
        </div>
      )}
    </article>
  );
}
