-- Manual DB change applied 2026-07-17 via Neon SQL Editor (confirmed working
-- by user - both is_admin column and terms_acceptances table verified present).
-- This is NOT a drizzle-kit generated migration (db/migrations/ is untouched)
-- - kept here purely as a record of what was run and why, since it was
-- applied by hand rather than through the normal db:push workflow.
--
-- Adds: users.is_admin flag, and the terms_acceptances audit table.
-- Corresponds to: db/schema.ts (users.isAdmin, termsAcceptances table)

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  name varchar(255),
  terms_version varchar(20) NOT NULL,
  privacy_version varchar(20) NOT NULL,
  ip_address varchar(64),
  user_agent text,
  accepted_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user ON terms_acceptances(user_id);

-- Once you have a login on shijo.ai, flip your own account to admin so you
-- can access /admin/terms (replace the email):
-- UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
