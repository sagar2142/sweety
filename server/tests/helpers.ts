import request from 'supertest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { addDays, todayIn } from '../src/utils/dates';

export const app = createApp();

let userCounter = 0;

/** Registers a fresh user and returns their token plus an "Authorization" header. */
export async function signUp(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  userCounter += 1;
  const body = {
    name: 'Test User',
    email: `user${userCounter}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`Sign up failed: ${JSON.stringify(res.body)}`);
  return {
    user: res.body.user as { id: number; name: string; email: string },
    token: res.body.token as string,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}

export const today = () => todayIn(env.APP_TIMEZONE);
export const daysFromToday = (days: number) => addDays(today(), days);
