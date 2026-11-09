import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { readingsApi, reportsApi } from '../api';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { PlusIcon } from '../components/Icons';
import { MonthChart } from '../components/MonthChart';
import { PageLoader } from '../components/PageLoader';
import { ReadingsList } from '../components/ReadingsList';
import { SummaryCard } from '../components/SummaryCard';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatMonth, formatRange, isIsoDate, monthBounds, todayLocal } from '../lib/dates';

export function ReportsPage() {
  const today = todayLocal();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('date') ?? '';
  const date = isIsoDate(param) && param <= today ? param : today;
  const [dateInput, setDateInput] = useState(date);
  const [dateError, setDateError] = useState('');

  const reports = useAsync(
    () => Promise.all([reportsApi.daily(date), reportsApi.monthToDate(date), reportsApi.monthly(date)]),
    [date],
  );
  const [daily, monthToDate, monthly] = reports.data ?? [];

  // Chart: every reading in the selected month (up to today for the current month).
  const month = monthBounds(date);
  const chartTo = month.to > today ? today : month.to;
  const chart = useAsync(() => readingsApi.list({ from: month.from, to: chartTo, limit: 200 }), [month.from, chartTo]);
  const chartReadings = chart.data?.data ?? [];

  function selectDate(value: string) {
    setDateInput(value);
    if (!value || !isIsoDate(value)) return setDateError('Please pick a valid date.');
    if (value > today) return setDateError('Date cannot be in the future.');
    setDateError('');
    setSearchParams(value === today ? {} : { date: value }, { replace: true });
  }

  const addReadingLink = (
    <Link to="/" className="btn btn--secondary btn--sm">
      <PlusIcon size={16} />
      Add a reading
    </Link>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Highest, lowest and average readings for the day and month you pick.</p>
        </div>

        <div className="date-picker">
          <div className="field">
            <label className="field__label" htmlFor="report-date">
              Report date
            </label>
            <input
              id="report-date"
              className="input"
              type="date"
              max={today}
              value={dateInput}
              aria-invalid={dateError ? true : undefined}
              aria-describedby={dateError ? 'report-date-error' : undefined}
              onChange={(event) => selectDate(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => selectDate(today)}
            disabled={date === today && !dateError}
          >
            Today
          </button>
          {dateError && (
            <p id="report-date-error" className="field__error date-picker__error">
              {dateError}
            </p>
          )}
        </div>
      </div>

      {reports.error && (
        <Alert
          action={
            <button type="button" className="btn btn--secondary btn--sm" onClick={reports.reload}>
              Try again
            </button>
          }
        >
          {reports.error}
        </Alert>
      )}

      <div className="summary-grid" aria-busy={reports.loading}>
        <SummaryCard
          title="Daily"
          rangeLabel={formatDate(date)}
          summary={daily}
          emptyTitle="No readings on this day"
          emptyAction={addReadingLink}
        />
        <SummaryCard
          title="Month-to-date"
          rangeLabel={formatRange(month.from, date)}
          summary={monthToDate}
          emptyTitle="No readings this month yet"
        />
        <SummaryCard
          title="Monthly"
          rangeLabel={monthly ? formatRange(monthly.from, monthly.to) : 'Previous month'}
          summary={monthly}
          emptyTitle="No readings last month"
        />
      </div>

      <div className="reports-layout">
        <section className="card" aria-labelledby="daily-readings-title">
          <div className="card__header">
            <h2 id="daily-readings-title" className="card__title">
              Readings on {formatDate(date)}
            </h2>
            <p className="card__subtitle">Each reading with its time slot.</p>
          </div>
          {!daily && reports.loading && <PageLoader label="Loading report…" />}
          {daily && daily.readings.length === 0 && (
            <EmptyState compact title="Nothing logged on this day" description="Pick another date or add a reading." />
          )}
          {daily && daily.readings.length > 0 && (
            <ReadingsList readings={daily.readings} today={today} showDateHeadings={false} />
          )}
        </section>

        <section className="card" aria-labelledby="chart-title">
          <div className="card__header">
            <h2 id="chart-title" className="card__title">
              Readings in {formatMonth(date)}
            </h2>
            <p className="card__subtitle">One line per time slot, {formatRange(month.from, chartTo)}.</p>
          </div>
          {chart.error && <Alert>{chart.error}</Alert>}
          {!chart.data && chart.loading && <PageLoader label="Loading chart…" />}
          {chart.data && chartReadings.length === 0 && (
            <EmptyState
              compact
              title={`No readings in ${formatMonth(date)}`}
              description="The chart appears once you add readings."
            />
          )}
          {chartReadings.length > 0 && <MonthChart readings={chartReadings} from={month.from} to={chartTo} />}
        </section>
      </div>
    </>
  );
}
