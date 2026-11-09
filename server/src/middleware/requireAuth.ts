import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../modules/auth/token';
import { AppError } from '../utils/AppError';

/**
 * Reads the "Authorization: Bearer <token>" header, verifies the JWT and
 * stores the user id on the request. Rejects the request with 401 otherwise.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized();
  }

  const userId = verifyToken(token);
  if (userId === null) {
    throw AppError.unauthorized('Your session has expired. Please log in again.');
  }

  req.userId = userId;
  next();
}

/** Returns the logged-in user's id. Use only in routes behind requireAuth. */
export function currentUserId(req: Request): number {
  if (req.userId === undefined) throw AppError.unauthorized();
  return req.userId;
}
