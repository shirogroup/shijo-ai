-- Manual DB change for 2026-07-18 — run this in the Neon SQL Editor,
-- same workflow used for 2026-07-17-admin-terms-acceptances.sql (this
-- sandbox cannot reach Neon's endpoints directly, so this file is
-- delivered as SQL rather than applied automatically).
--
-- Adds: support_tickets table, backing the new Contact page + admin
-- ticket panel at /admin/tickets.
-- Corresponds to: db/schema.ts (supportTickets table)

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  subject varchar(255) NOT NULL,
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  resolved_at timestamp
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

-- Verify it worked:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'support_tickets';
