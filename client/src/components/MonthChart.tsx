import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePrefersDark } from '../hooks/usePrefersDark';
import { eachDay, formatDate } from '../lib/dates';
import { HIGH_ABOVE, LOW_BELOW } from '../lib/glucose';
import { SLOT_LABELS, SLOT_OPTIONS } from '../lib/slots';
import type { Reading, Slot } from '../types';

// Categorical colours, one per slot, in a fixed order. Checked for colour-blind
// separation and contrast against the card background in both themes.
const THEMES = {
  light: {
    series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
    surface: '#ffffff',
    grid: '#e2e8f0',
    axis: '#475569',
    band: '#64748b',
  },
  dark: {
    series: ['#3987e5', '#d95926', '#199e70', '#c98500'],
    surface: '#131c2e',
    grid: '#26324a',
    axis: '#a9b6c9',
    band: '#94a3b8',
  },
};

type ChartRow = { date: string; day: number } & Partial<Record<Slot, number>>;

function buildRows(readings: Reading[], from: string, to: string): ChartRow[] {
  const rows = new Map<string, ChartRow>(
    eachDay(from, to).map((date) => [date, { date, day: Number(date.slice(8, 10)) }]),
  );
  for (const reading of readings) {
    const row = rows.get(reading.date);
    if (row) row[reading.slot] = reading.value;
  }
  return [...rows.values()];
}

interface MonthChartProps {
  readings: Reading[];
  from: string;
  to: string;
}

export function MonthChart({ readings, from, to }: MonthChartProps) {
  const theme = usePrefersDark() ? THEMES.dark : THEMES.light;
  const rows = buildRows(readings, from, to);
  const values = readings.map((reading) => reading.value);
  const yMin = Math.max(0, Math.floor((Math.min(...values, LOW_BELOW) - 10) / 50) * 50);
  const yMax = Math.ceil((Math.max(...values, HIGH_ABOVE) + 10) / 50) * 50;

  return (
    <div className="month-chart">
      <ul className="chart-legend" aria-label="Chart legend">
        {SLOT_OPTIONS.map((slot, index) => (
          <li key={slot.value}>
            <span className="chart-legend__key" style={{ background: theme.series[index] }} aria-hidden="true" />
            {slot.label}
          </li>
        ))}
        <li>
          <span className="chart-legend__band" aria-hidden="true" />
          {LOW_BELOW}–{HIGH_ABOVE} mg/dl band
        </li>
      </ul>

      <div
        className="month-chart__plot"
        role="img"
        aria-label={`Line chart of glucose readings from ${formatDate(from)} to ${formatDate(to)}, one line per time slot.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <ReferenceArea
              y1={LOW_BELOW}
              y2={HIGH_ABOVE}
              fill={theme.band}
              fillOpacity={0.1}
              strokeOpacity={0}
              ifOverflow="hidden"
            />
            <XAxis
              dataKey="day"
              tick={{ fill: theme.axis, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.grid }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: theme.axis, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                if (!active || !row) return null;
                return (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip__title">{formatDate(row.date)}</p>
                    <ul>
                      {SLOT_OPTIONS.map((slot, index) => (
                        <li key={slot.value}>
                          <span
                            className="chart-legend__key"
                            style={{ background: theme.series[index] }}
                            aria-hidden="true"
                          />
                          <span className="chart-tooltip__label">{SLOT_LABELS[slot.value]}</span>
                          <strong>{row[slot.value] !== undefined ? `${row[slot.value]} mg/dl` : '–'}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }}
            />
            {SLOT_OPTIONS.map((slot, index) => (
              <Line
                key={slot.value}
                type="linear"
                dataKey={slot.value}
                name={slot.label}
                stroke={theme.series[index]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                connectNulls
                dot={{ r: 4, fill: theme.series[index], stroke: theme.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: theme.series[index], stroke: theme.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="chart-table">
        <summary>Show the data as a table</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                {SLOT_OPTIONS.map((slot) => (
                  <th key={slot.value} scope="col">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) => SLOT_OPTIONS.some((slot) => row[slot.value] !== undefined))
                .map((row) => (
                  <tr key={row.date}>
                    <th scope="row">{formatDate(row.date)}</th>
                    {SLOT_OPTIONS.map((slot) => (
                      <td key={slot.value}>{row[slot.value] ?? '–'}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
