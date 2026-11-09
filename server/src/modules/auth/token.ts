import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

/** Creates a signed JWT whose subject ("sub") is the user id. */
export function signToken(userId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Returns the user id stored in a valid token, or null if the token is invalid/expired. */
export function verifyToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = typeof payload === 'object' ? Number(payload.sub) : NaN;
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}
