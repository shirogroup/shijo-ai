-- Manual DB change for 2026-07-18 (later same day) — run this in the Neon
-- SQL Editor, same workflow as the other files in this folder (this
-- sandbox cannot reach Neon's endpoints directly).
--
-- Adds: a "reason" column to support_tickets, backing the new "Reason for
-- contacting" dropdown on the Contact page and its badge in /admin/tickets.
-- Corresponds to: db/schema.ts (supportTickets table, `reason` field)

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS reason varchar(30) NOT NULL DEFAULT 'general';

-- Verify it worked:
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'reason';
