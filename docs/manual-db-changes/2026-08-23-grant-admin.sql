-- 2026-08-23 — grant admin access to the account that owns the product
--
-- WHY THIS EXISTS
-- The admin panel has four pages (/admin/users, /admin/signups, /admin/terms,
-- /admin/tickets) plus the new /admin/usage cost dashboard. Every one of them
-- is gated on users.is_admin. Checked live on 2026-08-23:
--
--   srikanth@shiroapps.com  ->  is_admin = false
--   /api/admin/users     403
--   /api/admin/signups   403
--   /api/admin/tickets   403
--   /api/admin/usage     403
--
-- So the admin panel has been built but never usable by its owner. The gate
-- itself works correctly — a non-admin is properly refused, which is the
-- behaviour you want. There is simply nobody on the other side of it.
--
-- ⚠️ REVIEW BEFORE RUNNING. This grants full access to every user record,
-- signup log, support ticket and billing figure in the product. Claude did not
-- and cannot run this — granting privileges is yours to do deliberately.
--
-- Check who (if anyone) currently has it:
--     SELECT email, is_admin, created_at FROM users WHERE is_admin = true;
--
-- Then grant, to ONE named address — never a pattern match:

UPDATE users
SET    is_admin = true
WHERE  email = 'srikanth@shiroapps.com';

-- Verify exactly one row changed and it is the right one:
--     SELECT email, is_admin FROM users WHERE is_admin = true;
--
-- To revoke:
--     UPDATE users SET is_admin = false WHERE email = 'srikanth@shiroapps.com';
