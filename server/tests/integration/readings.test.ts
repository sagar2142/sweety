import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, daysFromToday, signUp, today } from '../helpers';

let auth: { Authorization: string };

beforeEach(async () => {
  ({ auth } = await signUp());
});

function addReading(body: Record<string, unknown>, headers = auth) {
  return request(app).post('/api/readings').set(headers).send(body);
}

describe('POST /api/readings', () => {
  it('creates a reading', async () => {
    const res = await addReading({ date: today(), slot: 'morning_fasting', value: 98 });

    expect(res.status).toBe(201);
    expect(res.body.reading).toMatchObject({ id: expect.any(Number), date: today(), slot: 'morning_fasting', value: 98 });
  });

  it('requires a value', async () => {
    const res = await addReading({ date: today(), slot: 'morning_fasting' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.value).toBe('Please enter a glucose value.');
  });

  it('rejects values outside 40–600', async () => {
    const res = await addReading({ date: today(), slot: 'morning_fasting', value: 700 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects a future date', async () => {
    const res = await addReading({ date: daysFromToday(1), slot: 'morning_fasting', value: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Date cannot be in the future.');
  });

  it('allows only one reading per slot per day', async () => {
    await addReading({ date: today(), slot: 'after_lunch', value: 150 });

    const res = await addReading({ date: today(), slot: 'after_lunch', value: 160 });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You already have an After lunch reading for this date.');
  });

  it('allows the same slot on a different day', async () => {
    await addReading({ date: today(), slot: 'after_lunch', value: 150 });
    const res = await addReading({ date: daysFromToday(-1), slot: 'after_lunch', value: 160 });
    expect(res.status).toBe(201);
  });

  it('allows a maximum of 4 readings per day', async () => {
    const date = daysFromToday(-2);
    for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      expect((await addReading({ date, slot, value: 120 })).status).toBe(201);
    }

    const res = await addReading({ date, slot: 'after_dinner', value: 130 });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You can add only 4 readings per day.');
  });

  it('requires login', async () => {
    const res = await request(app).post('/api/readings').send({ date: today(), slot: 'after_lunch', value: 100 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/readings', () => {
  it('lists readings newest first with pagination', async () => {
    await addReading({ date: daysFromToday(-1), slot: 'morning_fasting', value: 101 });
    await addReading({ date: today(), slot: 'morning_fasting', value: 102 });
    await addReading({ date: today(), slot: 'after_dinner', value: 103 });

    const page1 = await request(app).get('/api/readings?page=1&limit=2').set(auth);
    const page2 = await request(app).get('/api/readings?page=2&limit=2').set(auth);

    expect(page1.status).toBe(200);
    expect(page1.body.data.map((r: { value: number }) => r.value)).toEqual([103, 102]);
    expect(page1.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(page2.body.data.map((r: { value: number }) => r.value)).toEqual([101]);
  });

  it('filters by date range', async () => {
    await addReading({ date: daysFromToday(-5), slot: 'morning_fasting', value: 101 });
    await addReading({ date: today(), slot: 'morning_fasting', value: 102 });

    const res = await request(app).get(`/api/readings?from=${daysFromToday(-1)}&to=${today()}`).set(auth);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].value).toBe(102);
  });

  it('rejects invalid pagination values', async () => {
    const res = await request(app).get('/api/readings?page=0').set(auth);
    expect(res.status).toBe(400);
  });

  it("only shows the logged-in user's own readings", async () => {
    await addReading({ date: today(), slot: 'morning_fasting', value: 101 });
    const other = await signUp();

    const res = await request(app).get('/api/readings').set(other.auth);

    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });
});

describe('PUT /api/readings/:id', () => {
  it('updates a reading', async () => {
    const created = await addReading({ date: today(), slot: 'after_lunch', value: 150 });

    const res = await request(app)
      .put(`/api/readings/${created.body.reading.id}`)
      .set(auth)
      .send({ date: today(), slot: 'after_lunch', value: 175 });

    expect(res.status).toBe(200);
    expect(res.body.reading.value).toBe(175);
  });

  it('cannot move a reading into a slot that is already taken', async () => {
    await addReading({ date: today(), slot: 'after_lunch', value: 150 });
    const dinner = await addReading({ date: today(), slot: 'after_dinner', value: 180 });

    const res = await request(app)
      .put(`/api/readings/${dinner.body.reading.id}`)
      .set(auth)
      .send({ date: today(), slot: 'after_lunch', value: 180 });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You already have an After lunch reading for this date.');
  });

  it("returns 404 for another user's reading", async () => {
    const created = await addReading({ date: today(), slot: 'after_lunch', value: 150 });
    const other = await signUp();

    const res = await request(app)
      .put(`/api/readings/${created.body.reading.id}`)
      .set(other.auth)
      .send({ date: today(), slot: 'after_lunch', value: 175 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/readings/:id', () => {
  it('deletes a reading', async () => {
    const created = await addReading({ date: today(), slot: 'after_lunch', value: 150 });

    const res = await request(app).delete(`/api/readings/${created.body.reading.id}`).set(auth);
    const list = await request(app).get('/api/readings').set(auth);

    expect(res.status).toBe(204);
    expect(list.body.data).toEqual([]);
  });

  it("cannot delete another user's reading", async () => {
    const created = await addReading({ date: today(), slot: 'after_lunch', value: 150 });
    const other = await signUp();

    const res = await request(app).delete(`/api/readings/${created.body.reading.id}`).set(other.auth);

    expect(res.status).toBe(404);
  });
});
