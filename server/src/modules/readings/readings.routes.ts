import { Router } from 'express';
import { env } from '../../config/env';
import { currentUserId } from '../../middleware/requireAuth';
import { todayIn } from '../../utils/dates';
import { idParam, optionalDateParam, positiveIntParam } from '../../utils/queryParams';
import { createReading, deleteReading, getReading, listReadings, updateReading } from './readings.service';
import { validateReadingInput } from './readings.validation';

export const readingsRouter = Router();

const NOT_FOUND = 'Reading not found.';

// GET /api/readings?page=1&limit=20&from=2026-10-01&to=2026-10-31
readingsRouter.get('/', async (req, res) => {
  const result = await listReadings(currentUserId(req), {
    page: positiveIntParam(req.query.page, 'page', 1),
    limit: positiveIntParam(req.query.limit, 'limit', 20, 200),
    from: optionalDateParam(req.query.from, 'from'),
    to: optionalDateParam(req.query.to, 'to'),
  });
  res.json(result);
});

readingsRouter.get('/:id', async (req, res) => {
  const reading = await getReading(currentUserId(req), idParam(req.params.id, NOT_FOUND));
  res.json({ reading });
});

readingsRouter.post('/', async (req, res) => {
  const input = validateReadingInput(req.body, todayIn(env.APP_TIMEZONE));
  const reading = await createReading(currentUserId(req), input);
  res.status(201).json({ reading });
});

readingsRouter.put('/:id', async (req, res) => {
  const readingId = idParam(req.params.id, NOT_FOUND);
  const input = validateReadingInput(req.body, todayIn(env.APP_TIMEZONE));
  const reading = await updateReading(currentUserId(req), readingId, input);
  res.json({ reading });
});

readingsRouter.delete('/:id', async (req, res) => {
  await deleteReading(currentUserId(req), idParam(req.params.id, NOT_FOUND));
  res.status(204).end();
});
