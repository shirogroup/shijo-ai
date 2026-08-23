-- ============================================================================
-- SHIJO.AI — abuse hardening migration
-- Created 2026-08-22, after 373,147 spam-registered accounts were purged and
-- the entire attacker IP trail was lost with them (see SHIJO_AI_KB.md §44.5).
--
-- Run in the Neon SQL Editor against the production database.
-- Safe to run before or after the code deploy, and safe to re-run.
--
-- WHAT THIS DOES
--   1. Stores the signup IP + user agent on the user row, so abuse triage
--      survives even if related tables are cleaned up.
--   2. Stops user deletion from destroying the Terms-acceptance record.
--   3. Adds an admin-managed IP/CIDR blocklist.
--   4. Adds the signup throttle table (idempotent — included here so this is
--      the single migration to run if the earlier one was skipped).
-- ============================================================================

-- ── 1. Signup origin on the user row ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip         varchar(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_user_agent text;

CREATE INDEX IF NOT EXISTS idx_users_signup_ip   ON users (signup_ip);
CREATE INDEX IF NOT EXISTS idx_users_created_at  ON users (created_at);


-- ── 2. Preserve Terms-acceptance records when a user is deleted ─────────────
-- Previously: user_id NOT NULL + ON DELETE CASCADE. Deleting a user erased
-- the proof they accepted the Terms — and the person most likely to dispute
-- it is a former user. It also erased the signup IP/user agent, which is what
-- made the abuse incident un-investigable after cleanup.
--
-- After this, the acceptance row survives with email, versions, IP, user
-- agent and timestamp intact; only the user_id link goes null.
--
-- Retention note: keeping a minimal contract-formation record after account
-- deletion is consistent with what the Privacy Policy already states
-- ("some records may be retained ... for legitimate business purposes").
-- Confirm with the planned attorney review (KB §13).

ALTER TABLE terms_acceptances ALTER COLUMN user_id DROP NOT NULL;

-- Drop BOTH possible names. The original constraint was created by Postgres
-- under its default naming (<table>_<column>_fkey), NOT Drizzle's convention.
-- Dropping only the Drizzle-style name leaves the original CASCADE in place,
-- and when two foreign keys exist on the same column CASCADE wins — so the
-- fix silently does nothing. Confirmed live on 2026-08-22: pg_constraint had
-- terms_acceptances_user_id_fkey (confdeltype 'c') alongside the new
-- terms_acceptances_user_id_users_id_fk (confdeltype 'n').
ALTER TABLE terms_acceptances
  DROP CONSTRAINT IF EXISTS terms_acceptances_user_id_fkey;

ALTER TABLE terms_acceptances
  DROP CONSTRAINT IF EXISTS terms_acceptances_user_id_users_id_fk;

ALTER TABLE terms_acceptances
  ADD CONSTRAINT terms_acceptances_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


-- ── 3. Admin-managed blocklist ──────────────────────────────────────────────
-- Lives here rather than in Vercel's firewall because the Hobby plan allows
-- only 3 custom firewall rules (1 already used by the register rate limit),
-- so a list that grows over time cannot live there.
-- Accepts a bare address or a CIDR prefix, e.g. '20.151.0.0/16'.

CREATE TABLE IF NOT EXISTS blocked_ips (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  varchar(64) NOT NULL UNIQUE,
  reason      text,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamp NOT NULL DEFAULT now(),
  last_hit_at timestamp,
  hit_count   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips (ip_address);


-- ── 4. Signup throttle (idempotent; harmless if already created) ────────────
CREATE TABLE IF NOT EXISTS signup_throttle (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          varchar(255) NOT NULL,
  count        integer      NOT NULL DEFAULT 0,
  window_start timestamp    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_throttle_key_window
  ON signup_throttle (key, window_start);


-- ============================================================================
-- VERIFICATION — run these after, all four should return rows
-- ============================================================================
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name='users' AND column_name IN ('signup_ip','signup_user_agent');
--
-- SELECT is_nullable FROM information_schema.columns
--  WHERE table_name='terms_acceptances' AND column_name='user_id';   -- expect YES
--
-- SELECT confdeltype FROM pg_constraint
--  WHERE conname='terms_acceptances_user_id_users_id_fk';            -- expect 'n' (SET NULL)
--
-- SELECT to_regclass('blocked_ips'), to_regclass('signup_throttle'); -- expect both non-null
