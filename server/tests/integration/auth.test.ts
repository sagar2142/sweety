import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { pool } from '../../src/db/pool';
import { app, signUp } from '../helpers';

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(Number), name: 'Asha', email: 'asha@example.com' });
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await signUp({ email: 'hash@example.com', password: 'my-secret-pass' });

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['hash@example.com']);
    expect(rows[0].password_hash).not.toBe('my-secret-pass');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('rejects an email that is already registered (any letter case)', async () => {
    await signUp({ email: 'taken@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'TAKEN@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.fields.email).toBe('An account with this email already exists.');
  });

  it('validates name, email and password', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: ' ', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({
      name: 'Please enter your name.',
      email: 'Please enter a valid email address.',
      password: 'Password must be at least 8 characters.',
    });
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    await signUp({ email: 'login@example.com', password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email: 'LOGIN@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@example.com');
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await signUp({ email: 'login@example.com', password: 'password123' });

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'nope-nope' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe('Invalid email or password.');
    expect(unknownEmail.body.error.message).toBe('Invalid email or password.');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the logged-in user', async () => {
    const { auth, user } = await signUp();
    const res = await request(app).get('/api/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user);
  });

  it('rejects requests without a valid token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set({ Authorization: 'Bearer not-a-token' })).status).toBe(401);
  });
});
