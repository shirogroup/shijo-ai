import { GeoHealthClient } from './GeoHealthClient';

/**
 * /admin/geo-health — vendor health, budget and QA for the public /geo checker.
 *
 * Sits inside the existing app/admin/layout.tsx shell (nav + chrome) and is
 * gated the same way every other admin page is: middleware.ts requires a
 * session for /admin/*, and every /api/admin/geo-* route re-checks isAdmin
 * against the database. The page itself renders an access-denied state if the
 * API returns 403, matching app/admin/users, /tickets and /terms.
 */
export default function AdminGeoHealthPage() {
  return <GeoHealthClient />;
}
