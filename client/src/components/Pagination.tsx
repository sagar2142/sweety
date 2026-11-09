import type { Pagination as PaginationInfo } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Readings pages">
      <p className="pagination__summary">
        Showing <strong>{first}</strong>–<strong>{last}</strong> of <strong>{total}</strong>
      </p>
      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeftIcon size={18} />
          Previous
        </button>
        <span className="pagination__page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </nav>
  );
}
