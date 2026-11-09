import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/requireAuth';
import { authRouter } from './modules/auth/auth.routes';
import { readingsRouter } from './modules/readings/readings.routes';
import { reportsRouter } from './modules/reports/reports.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs (rate limiting) behind nginx/docker
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/readings', requireAuth, readingsRouter);
  app.use('/api/reports', requireAuth, reportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
