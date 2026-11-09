import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, daysFromToday, signUp } from '../helpers';

// Uses the assignment's example: selected date 15 Oct 2026.
const SELECTED = '2026-10-15';

let auth: { Authorization: string };

async function addReading(date: string, slot: string, value: number) {
  const res = await request(app).post('/api/readings').set(auth).send({ date, slot, value });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
}

beforeEach(async () => {
  ({ auth } = await signUp());

  // Previous month (September)
  await addReading('2026-09-01', 'morning_fasting', 90);
  await addReading('2026-09-30', 'after_dinner', 210);
  // Earlier in October (inside month-to-date)
  await addReading('2026-10-01', 'morning_fasting', 100);
  // The selected day
  await addReading(SELECTED, 'after_lunch', 101);
  await addReading(SELECTED, 'morning_fasting', 101);
  await addReading(SELECTED, 'after_dinner', 100);
  // After the selected date (outside every report)
  await addReading('2026-10-20', 'morning_fasting', 300);
});

function getReport(type: string, date = SELECTED) {
  return request(app).get(`/api/reports/${type}?date=${date}`).set(auth);
}

describe('GET /api/reports/daily', () => {
  it('summarises the selected day and lists its readings in slot order', async () => {
    const res = await getReport('daily');

    expect(res.status).toBe(200);
    expect(res.body.report).toMatchObject({
      from: SELECTED,
      to: SELECTED,
      count: 3,
      highest: 101,
      lowest: 100,
      average: 100.7, // (101 + 101 + 100) / 3 = 100.666… rounded to 1 decimal
    });
    expect(res.body.report.readings.map((r: { slot: string }) => r.slot)).toEqual([
      'morning_fasting',
      'after_lunch',
      'after_dinner',
    ]);
  });

  it('returns an empty report for a day without readings', async () => {
    const res = await getReport('daily', '2026-10-10');

    expect(res.body.report).toEqual({
      from: '2026-10-10',
      to: '2026-10-10',
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      readings: [],
    });
  });

  it('rejects a future date', async () => {
    const res = await getReport('daily', daysFromToday(1));
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Date cannot be in the future.');
  });
});

describe('GET /api/reports/month-to-date', () => {
  it('covers the 1st of the month up to the selected date', async () => {
    const res = await getReport('month-to-date');

    expect(res.body.report).toEqual({
      from: '2026-10-01',
      to: SELECTED,
      count: 4,
      highest: 101,
      lowest: 100,
      average: 100.5,
    });
  });
});

describe('GET /api/reports/monthly', () => {
  it('covers the whole previous month', async () => {
    const res = await getReport('monthly');

    expect(res.body.report).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      count: 2,
      highest: 210,
      lowest: 90,
      average: 150,
    });
  });

  it("does not include other users' readings", async () => {
    const other = await signUp();
    const res = await request(app).get(`/api/reports/monthly?date=${SELECTED}`).set(other.auth);
    expect(res.body.report.count).toBe(0);
  });
});
