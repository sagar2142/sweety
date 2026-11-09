import { useCallback, useState } from 'react';
import { readingsApi } from '../api';
import { Alert } from '../components/Alert';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { PageLoader } from '../components/PageLoader';
import { Pagination } from '../components/Pagination';
import { ReadingForm } from '../components/ReadingForm';
import { ReadingsList } from '../components/ReadingsList';
import { Toast } from '../components/Toast';
import { TodayProgress } from '../components/TodayProgress';
import { useAsync } from '../hooks/useAsync';
import { formatDate, todayLocal } from '../lib/dates';
import { SLOT_LABELS } from '../lib/slots';
import type { Reading, ReadingInput } from '../types';

const PAGE_SIZE = 20;

export function ReadingsPage() {
  const today = todayLocal();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Reading | null>(null);
  const [deleting, setDeleting] = useState<Reading | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');

  const list = useAsync(() => readingsApi.list({ page, limit: PAGE_SIZE }), [page]);
  const todays = useAsync(() => readingsApi.list({ from: today, to: today }), [today]);

  const dismissToast = useCallback(() => setToast(''), []);

  /** Reloads the list (optionally jumping to another page) and today's progress. */
  function refresh(goToPage = page) {
    if (goToPage !== page) setPage(goToPage); // changing page reloads the list by itself
    else list.reload();
    todays.reload();
  }

  async function handleSave(input: ReadingInput) {
    if (editing) {
      await readingsApi.update(editing.id, input);
      setEditing(null);
      setToast('Reading updated.');
      refresh();
    } else {
      await readingsApi.create(input);
      setToast(`${SLOT_LABELS[input.slot]} reading added for ${formatDate(input.date)}.`);
      refresh(1); // newest readings are on page 1
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await readingsApi.remove(deleting.id);
      if (editing?.id === deleting.id) setEditing(null);
      // If that was the last reading on this page, go back one page.
      const wasLastOnPage = list.data?.data.length === 1 && page > 1;
      setDeleting(null);
      setToast('Reading deleted.');
      refresh(wasLastOnPage ? page - 1 : page);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete the reading.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const readings = list.data?.data ?? [];
  const total = list.data?.pagination.total ?? 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Readings</h1>
          <p className="page-subtitle">Log up to 4 blood glucose readings a day – one for each time slot.</p>
        </div>
      </div>

      <div className="readings-layout">
        <div className="readings-layout__side">
          <section className={`card${editing ? ' card--highlight' : ''}`} aria-labelledby="reading-form-title">
            <div className="card__header">
              <h2 id="reading-form-title" className="card__title">
                {editing ? 'Edit reading' : 'Add a reading'}
              </h2>
              {editing && (
                <p className="card__subtitle">
                  {SLOT_LABELS[editing.slot]} on {formatDate(editing.date)}
                </p>
              )}
            </div>
            <ReadingForm
              key={editing?.id ?? 'new'}
              today={today}
              initial={editing ? { date: editing.date, slot: editing.slot, value: editing.value } : undefined}
              onSubmit={handleSave}
              onCancel={editing ? () => setEditing(null) : undefined}
            />
          </section>

          <section className="card" aria-labelledby="today-title">
            <div className="card__header">
              <h2 id="today-title" className="card__title">
                Today
              </h2>
              <p className="card__subtitle">{formatDate(today)}</p>
            </div>
            {todays.error ? (
              <Alert>{todays.error}</Alert>
            ) : (
              <TodayProgress readings={todays.data?.data ?? []} />
            )}
          </section>
        </div>

        <section className="card readings-layout__main" aria-labelledby="readings-title" aria-busy={list.loading}>
          <div className="card__header card__header--row">
            <h2 id="readings-title" className="card__title">
              Your readings
            </h2>
            {total > 0 && <span className="count-pill">{total} total</span>}
          </div>

          {list.error && (
            <Alert
              action={
                <button type="button" className="btn btn--secondary btn--sm" onClick={list.reload}>
                  Try again
                </button>
              }
            >
              {list.error}
            </Alert>
          )}

          {list.loading && !list.data && <PageLoader label="Loading readings…" />}

          {list.data && readings.length === 0 && (
            <EmptyState
              title="No readings yet"
              description="Add your first reading with the form. It will show up here."
            />
          )}

          {readings.length > 0 && (
            <ReadingsList
              readings={readings}
              today={today}
              editingId={editing?.id}
              onEdit={setEditing}
              onDelete={(reading) => {
                setDeleteError('');
                setDeleting(reading);
              }}
            />
          )}

          {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
        </section>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this reading?"
        confirmLabel="Delete reading"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      >
        {deleting && (
          <p>
            <strong>
              {SLOT_LABELS[deleting.slot]} · {deleting.value} mg/dl
            </strong>{' '}
            on {formatDate(deleting.date)} will be removed. This cannot be undone.
          </p>
        )}
        {deleteError && <Alert>{deleteError}</Alert>}
      </ConfirmDialog>

      <Toast message={toast} onDismiss={dismissToast} />
    </>
  );
}
