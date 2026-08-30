-- ============================================================================
-- SHIJO.AI — geo_scans + geo_scan_cells (public /geo visibility checker)
-- Created 2026-08-29.
--
-- WHY THIS IS HAND-WRITTEN INSTEAD OF `drizzle-kit generate`:
--   db/migrations holds exactly ONE drizzle migration, 0000_flowery_colonel_
--   america, snapshotted 2026-01-19. Every schema change since then —
--   support_tickets, terms_acceptances, the email-verification columns,
--   keyword_clusters.name, signup_throttle, blocked_ips and the rest of the
--   2026-08-22 abuse hardening — was applied through THIS folder and was
--   never folded back into the drizzle snapshot.
--
--   So the drizzle snapshot is ~7 months stale. Running `drizzle-kit
--   generate` now would diff db/schema.ts against January and emit a
--   migration that recreates or alters a dozen tables the 12 dashboard
--   tools depend on — not just the two new ones below. Applying that would
--   be actively destructive. Reconciling the snapshot with production is a
--   separate, deliberate job (and needs the schema-drift audit in
--   2026-07-19-schema-drift-audit-READONLY.sql run first).
--
-- WHAT THIS DOES: creates two NEW tables. It alters nothing that exists.
--   There is deliberately no foreign key to `users` — /geo is public and
--   unauthenticated, so scans are keyed by IP + UTC day, not by account.
--
-- SAFE TO RUN BEFORE OR AFTER THE CODE DEPLOY, with one caveat:
--   lib/geo/budget.ts fails CLOSED, not open. Until these tables exist,
--   checkGuards() cannot verify the per-IP cap or the daily budget, so it
--   refuses every scan and /geo returns "temporarily unavailable". That is
--   intentional — an unmetered public endpoint fanning out to five paid
--   APIs is not a failure mode worth risking. Nothing else in the app is
--   affected; the 12 tools, auth and billing do not touch these tables.
--
-- Run in the Neon SQL Editor against the production database.
-- ============================================================================

CREATE TABLE IF NOT EXISTS geo_scans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What the visitor typed.
  business_name       varchar(255)  NOT NULL,
  website_url         varchar(500),
  city                varchar(255),
  -- Normalised bare host (no scheme, no www) used for domain matching.
  domain              varchar(255),

  -- Identity resolved from Google Places; all null when unresolved.
  place_id            varchar(255),
  resolved_name       varchar(255),
  place_types         jsonb,
  identity_resolved   boolean       NOT NULL DEFAULT false,

  -- Scoring snapshot. `score` is intentionally NULLABLE: it is left null
  -- when band = 'insufficient' so that "we could not measure this" is never
  -- silently stored, or later charted, as a real zero.
  score               integer,
  band                varchar(20),
  prompt_count        integer       NOT NULL DEFAULT 0,
  cells_answered      integer       NOT NULL DEFAULT 0,
  cells_mentioned     integer       NOT NULL DEFAULT 0,
  engines_attempted   integer       NOT NULL DEFAULT 0,
  engines_answered    integer       NOT NULL DEFAULT 0,

  -- Rate-limit key: first hop of x-forwarded-for, paired with utc_day for
  -- the one-scan-per-IP-per-day cap.
  ip_address          varchar(64)   NOT NULL,
  utc_day             date          NOT NULL,

  -- Conservative pre-flight cost estimate, summed per day against
  -- GEO_DAILY_BUDGET_USD. NOT a billing figure, never shown to a user.
  estimated_cost_usd  numeric(10,4) NOT NULL DEFAULT 0,

  duration_ms         integer,
  created_at          timestamp     NOT NULL DEFAULT now()
);

-- Supports the per-IP daily cap: WHERE ip_address = $1 AND utc_day = $2
CREATE INDEX IF NOT EXISTS idx_geo_scans_ip_day
  ON geo_scans (ip_address, utc_day);

-- Supports the daily budget sum: WHERE utc_day = $1
CREATE INDEX IF NOT EXISTS idx_geo_scans_utc_day
  ON geo_scans (utc_day);

CREATE INDEX IF NOT EXISTS idx_geo_scans_created_at
  ON geo_scans (created_at);


CREATE TABLE IF NOT EXISTS geo_scan_cells (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       uuid NOT NULL REFERENCES geo_scans(id) ON DELETE CASCADE,

  -- openai | gemini | perplexity | claude | dataforseo
  engine        varchar(30) NOT NULL,
  prompt        text        NOT NULL,

  mentioned     boolean     NOT NULL DEFAULT false,
  matched_on    jsonb,       -- ('name' | 'domain')[]
  snippet       text,
  citations     jsonb,       -- string[]

  -- A row with error_message set, or skipped = true, is EXCLUDED from
  -- scoring. It means "we did not get an answer", never "you were not
  -- mentioned". Do not write reporting that treats these as negatives.
  error_message text,
  skipped       boolean     NOT NULL DEFAULT false,

  latency_ms    integer,
  created_at    timestamp   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_scan_cells_scan
  ON geo_scan_cells (scan_id);

CREATE INDEX IF NOT EXISTS idx_geo_scan_cells_engine
  ON geo_scan_cells (engine);


-- ============================================================================
-- VERIFY (run after, expect 2 rows and 5 indexes):
--
--   SELECT table_name FROM information_schema.tables
--    WHERE table_name IN ('geo_scans','geo_scan_cells');
--
--   SELECT indexname FROM pg_indexes
--    WHERE tablename IN ('geo_scans','geo_scan_cells')
--      AND indexname LIKE 'idx_%';
-- ============================================================================
