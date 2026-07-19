-- Normalize contact/submission timestamps to INTEGER milliseconds.
--
-- The created_at/updated_at columns are INTEGER, but writers were inconsistent:
-- src/lib/db/queries/guests.ts wrote ISO-8601 text (new Date().toISOString())
-- while every other path wrote Date.now() (ms). SQLite's loose typing let the
-- text land in the INTEGER column, so ORDER BY / range queries were wrong and
-- values mixed seconds, ms, and ISO strings.
--
-- guests.ts is now fixed to Date.now(); this backfills existing rows to ms:
--   * text (ISO-8601)      -> epoch seconds * 1000
--   * integer < 1e11 (sec) -> * 1000
--   * integer >= 1e11 (ms) -> unchanged
--
-- NOTE (documented follow-up): the columns still carry DEFAULT (unixepoch())
-- (seconds). That default is dormant — all 9 insert paths provide an explicit
-- Date.now() value — so it is left as-is here; changing a column default
-- requires a full table rebuild (contact/submission carry FKs + indexes).

UPDATE contact SET created_at = CASE
    WHEN typeof(created_at) = 'text' THEN CAST(strftime('%s', created_at) AS INTEGER) * 1000
    WHEN created_at < 100000000000 THEN created_at * 1000
    ELSE created_at END
  WHERE created_at IS NOT NULL;

UPDATE contact SET updated_at = CASE
    WHEN typeof(updated_at) = 'text' THEN CAST(strftime('%s', updated_at) AS INTEGER) * 1000
    WHEN updated_at < 100000000000 THEN updated_at * 1000
    ELSE updated_at END
  WHERE updated_at IS NOT NULL;

UPDATE submission SET created_at = CASE
    WHEN typeof(created_at) = 'text' THEN CAST(strftime('%s', created_at) AS INTEGER) * 1000
    WHEN created_at < 100000000000 THEN created_at * 1000
    ELSE created_at END
  WHERE created_at IS NOT NULL;

UPDATE submission SET updated_at = CASE
    WHEN typeof(updated_at) = 'text' THEN CAST(strftime('%s', updated_at) AS INTEGER) * 1000
    WHEN updated_at < 100000000000 THEN updated_at * 1000
    ELSE updated_at END
  WHERE updated_at IS NOT NULL;
