-- Manual DB change for 2026-07-19 — run this in the Neon SQL Editor, same
-- workflow as the other files in this folder (this sandbox cannot reach
-- Neon's endpoints directly).
--
-- Root cause: db/schema.ts declares a `name` column on keyword_clusters
-- (varchar(255), nullable), and that's what the app's queries expect —
-- but the actual live table in Neon never had this column added. Found
-- via a live Vercel Runtime Log for GET /api/account/export (the GDPR
-- data-export button), which failed with:
--   error: column "name" does not exist
--   query: select "id", "user_id", "name", "created_at" from "keyword_clusters" ...
-- This is a schema-drift bug (code/DB out of sync), not an application
-- logic bug — no code change is needed, just this migration.
--
-- Corresponds to: db/schema.ts (keywordClusters table, `name` field)

ALTER TABLE keyword_clusters
  ADD COLUMN IF NOT EXISTS name varchar(255);

-- Verify it worked:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'keyword_clusters' AND column_name = 'name';
