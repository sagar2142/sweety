import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

/** 404 for any /api route that does not exist. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found.`));
}

/**
 * Turns every error into the same JSON shape: { error: { message, fields? } }.
 * Unexpected errors are logged and hidden behind a generic message.
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { message: error.message, fields: error.fields } });
    return;
  }

  // Malformed JSON body sent by the client (thrown by express.json()).
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: { message: 'Request body must be valid JSON.' } });
    return;
  }

  if (env.NODE_ENV !== 'test') console.error(error);
  res.status(500).json({ error: { message: 'Something went wrong on our side. Please try again.' } });
}
