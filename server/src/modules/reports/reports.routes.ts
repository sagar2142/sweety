import { Router, type Request } from 'express';
import { env } from '../../config/env';
import { currentUserId } from '../../middleware/requireAuth';
import { AppError } from '../../utils/AppError';
import { todayIn } from '../../utils/dates';
import { optionalDateParam } from '../../utils/queryParams';
import { READING_MESSAGES } from '../readings/readings.validation';
import { getDailyReport, getMonthlyReport, getMonthToDateReport } from './reports.service';

export const reportsRouter = Router();

/** The ?date= the report is for. Defaults to today; cannot be in the future. */
function selectedDate(req: Request): string {
  const today = todayIn(env.APP_TIMEZONE);
  const date = optionalDateParam(req.query.date, 'date') ?? today;
  if (date > today) throw AppError.badRequest(READING_MESSAGES.dateInFuture, 'date');
  return date;
}

// GET /api/reports/daily?date=2026-10-15          -> 15 Oct 2026 (with the list of readings)
reportsRouter.get('/daily', async (req, res) => {
  const report = await getDailyReport(currentUserId(req), selectedDate(req));
  res.json({ report });
});

// GET /api/reports/month-to-date?date=2026-10-15  -> 1 Oct – 15 Oct 2026
reportsRouter.get('/month-to-date', async (req, res) => {
  const report = await getMonthToDateReport(currentUserId(req), selectedDate(req));
  res.json({ report });
});

// GET /api/reports/monthly?date=2026-10-15        -> 1 Sep – 30 Sep 2026 (previous month)
reportsRouter.get('/monthly', async (req, res) => {
  const report = await getMonthlyReport(currentUserId(req), selectedDate(req));
  res.json({ report });
});
