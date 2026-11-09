// CLI entry point: `npm run seed`
// Creates (or re-creates) a demo user with realistic sample readings from the
// 1st of last month up to today, so every report has data to show.
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { SLOTS, type Slot } from '../modules/readings/slots';
import { addDays, formatIsoDate, todayIn } from '../utils/dates';
import { pool } from './pool';

const DEMO_USER = {
  name: 'Demo Patient',
  email: 'demo@sweety.app',
  password: 'Demo@1234',
};

// Typical value ranges (mg/dl) per slot, so the data looks believable.
const SLOT_RANGES: Record<Slot, [min: number, max: number]> = {
  morning_fasting: [82, 135],
  after_breakfast: [120, 205],
  after_lunch: [115, 215],
  after_dinner: [125, 230],
};

/** Small deterministic random generator: same seed -> same demo data every run. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

async function seed(): Promise<void> {
  const random = createRandom(42);
  const today = todayIn(env.APP_TIMEZONE);
  const [year, month] = today.split('-').map(Number) as [number, number];
  const startDate = month === 1 ? formatIsoDate(year - 1, 12, 1) : formatIsoDate(year, month - 1, 1);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Start fresh: deleting the user also deletes their readings (ON DELETE CASCADE).
    await client.query('DELETE FROM users WHERE LOWER(email) = $1', [DEMO_USER.email]);

    const passwordHash = await bcrypt.hash(DEMO_USER.password, env.BCRYPT_SALT_ROUNDS);
    const { rows } = await client.query<{ id: number }>(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [DEMO_USER.name, DEMO_USER.email, passwordHash],
    );
    const userId = rows[0]!.id;

    let count = 0;
    for (let date = startDate; date <= today; date = addDays(date, 1)) {
      // Today only has the first two slots filled, so the demo user can add more.
      const slotsForDay = date === today ? SLOTS.slice(0, 2) : SLOTS;

      for (const slot of slotsForDay) {
        // Skip ~12% of readings on past days to make the data feel real.
        if (date !== today && random() < 0.12) continue;

        const [min, max] = SLOT_RANGES[slot];
        let value = Math.round(min + random() * (max - min));
        if (random() < 0.04) value = Math.round(250 + random() * 60); // occasional high
        if (random() < 0.03) value = Math.round(62 + random() * 10); // occasional low

        await client.query(
          'INSERT INTO readings (user_id, reading_date, slot, value_mgdl) VALUES ($1, $2, $3, $4)',
          [userId, date, slot, value],
        );
        count += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded demo user ${DEMO_USER.email} / ${DEMO_USER.password} with ${count} readings (${startDate} to ${today}).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error: Error) => {
    console.error(`Seeding failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
