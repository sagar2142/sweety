-- Users who can sign in. Passwords are stored only as bcrypt hashes.
CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Emails are unique regardless of letter case (Sam@x.com == sam@x.com).
CREATE UNIQUE INDEX users_email_lower_key ON users (LOWER(email));

-- The 4 fixed time slots. Enum values sort in the order they are declared,
-- so ORDER BY slot gives Morning -> After breakfast -> After lunch -> After dinner.
CREATE TYPE reading_slot AS ENUM (
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner'
);

CREATE TABLE readings (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reading_date DATE         NOT NULL,
  slot         reading_slot NOT NULL,
  value_mgdl   SMALLINT     NOT NULL CHECK (value_mgdl BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

  -- One reading per slot per day. With exactly 4 slots this also guarantees
  -- the "maximum 4 readings per day" rule at the database level, even if two
  -- requests arrive at the same time.
  CONSTRAINT readings_one_per_slot_per_day UNIQUE (user_id, reading_date, slot)
);

-- The unique constraint above creates an index on (user_id, reading_date, slot),
-- which already serves every query we run (by user, by user + date range).
