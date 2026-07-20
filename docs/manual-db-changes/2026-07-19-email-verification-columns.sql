-- Adds soft email-verification support to the users table.
-- Non-blocking: emailVerified defaults to false and never gates login or
-- tool access — it's a trust signal shown in the dashboard bell icon only.
--
-- Run this in Neon's SQL Editor, then confirm via:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'users' AND column_name LIKE 'email_verif%';
-- (should return 4 rows: email_verified, email_verification_token,
--  email_verification_sent_at, email_verified_at, email_verified_ip — 5 rows)

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_ip varchar(64);

CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users (email_verification_token);
