import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';
import { currentUserId, requireAuth } from '../../middleware/requireAuth';
import { parseBody } from '../../utils/parseBody';
import { loginSchema, registerSchema } from './auth.schemas';
import { findUserById, loginUser, registerUser } from './auth.service';

export const authRouter = Router();

// Slow down password guessing: max 20 login/register attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: { message: 'Too many attempts. Please wait a few minutes and try again.' } },
});

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = parseBody(registerSchema, req.body);
  const result = await registerUser(input);
  res.status(201).json(result);
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const input = parseBody(loginSchema, req.body);
  const result = await loginUser(input);
  res.json(result);
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(currentUserId(req));
  res.json({ user });
});
