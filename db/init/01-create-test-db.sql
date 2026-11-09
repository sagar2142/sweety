-- Runs once, the first time the Postgres container starts with an empty volume.
-- The main database (POSTGRES_DB) is created automatically; this adds a
-- separate database for the automated tests so they never touch real data.
CREATE DATABASE sweety_test OWNER sweety;
