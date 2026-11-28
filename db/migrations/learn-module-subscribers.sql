-- Optional Module 1 list. Apply once to the existing Neon database
-- (DATABASE_URL). The app does not run this file itself.
-- No new provider. Table: learn_module_subscribers.

CREATE TABLE IF NOT EXISTS learn_module_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  name varchar(80),
  unsubscribe_token varchar(64) NOT NULL,
  unsubscribed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
