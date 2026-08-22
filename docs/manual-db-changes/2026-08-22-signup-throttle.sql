-- ============================================================================
-- SHIJO.AI — signup_throttle table
-- Created 2026-08-22, after /api/auth/register was used as a spam relay
-- for ~19 hours (see SHIJO_AI_KB.md §37/§38).
--
-- WHY A NEW TABLE, not the existing `rate_limits`:
--   `rate_limits.user_id` is NOT NULL and foreign-keyed to `users`, so that
--   table can only ever throttle someone who has ALREADY registered. The
--   traffic that needs throttling here is anonymous by definition. That gap
--   is precisely why the abuse ran unchecked.
--
-- SAFE TO RUN BEFORE OR AFTER THE CODE DEPLOY:
--   lib/rate-limit.ts fails OPEN. If this table does not exist yet, the
--   throttle check logs "[RATE_LIMIT][DEGRADED]" and allows the request, so
--   registration keeps working either way. Run it whenever convenient — but
--   until it runs, the app-level throttle is inactive and the Vercel WAF
--   rule is the only rate limit in place.
--
-- Run in the Neon SQL Editor against the production database.
-- ============================================================================

CREATE TABLE IF NOT EXISTS signup_throttle (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           varchar(255) NOT NULL,
  count         integer      NOT NULL DEFAULT 0,
  window_start  timestamp    NOT NULL DEFAULT now()
);

-- Supports the only query shape the app issues:
--   WHERE key = $1 AND window_start > $2
CREATE INDEX IF NOT EXISTS idx_signup_throttle_key_window
  ON signup_throttle (key, window_start);

-- ── Verification (expect: table with 4 columns, plus the index) ──
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'signup_throttle'
--  ORDER BY ordinal_position;
--
-- SELECT indexname FROM pg_indexes WHERE tablename = 'signup_throttle';

-- ── Once live, useful to watch ──
-- Keys currently near or over their ceiling (10/hr per IP, 3/day per email):
-- SELECT key, count, window_start
--   FROM signup_throttle
--  WHERE count >= 3
--  ORDER BY count DESC
--  LIMIT 50;
