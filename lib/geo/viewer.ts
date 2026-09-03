import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { entitlementFor, type GeoEntitlement } from './entitlements';

/**
 * Resolve "who is asking, and what does their plan let them read" for the GEO
 * history endpoints.
 *
 * Deliberately shared rather than repeated in each route: the three history
 * endpoints must agree exactly on who is allowed to read a scan back. Three
 * copies of a session lookup plus a plan lookup is three chances for them to
 * drift, and the one that drifts becomes the way a free account reads paid
 * data.
 *
 * This only READS the session (getSession) and the user's plan tier. It does
 * not create, refresh, or alter a session, and it is not an authorisation
 * change to the app — /dashboard is already gated by middleware.ts. It is a
 * plan-entitlement check layered on top of the session that already exists.
 *
 * planTier comes from the users table on every request rather than from the
 * JWT, deliberately: a downgrade must take effect immediately, and a token
 * issued while the user was on Standard would otherwise keep reading history
 * until it expired.
 */
export type ViewerResult =
  | { ok: true; userId: string; planTier: string; entitlement: GeoEntitlement }
  | { ok: false; status: 401 | 402; error: string; upgradeUrl?: string };

export async function resolveGeoViewer(): Promise<ViewerResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, error: 'Please sign in to view your scan history.' };
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) {
    return { ok: false, status: 401, error: 'Please sign in to view your scan history.' };
  }

  const planTier = user.planTier || 'free';
  const entitlement = entitlementFor(planTier);

  if (!entitlement.history) {
    // 402 Payment Required, matching the shape app/api/geo/scan/route.ts
    // already uses for a plan-allowance refusal, so the client can tell an
    // upgrade prompt apart from a sign-in prompt without string matching.
    return {
      ok: false,
      status: 402,
      error:
        'Saved scan history is part of Standard and above. Your free scans are not stored.',
      upgradeUrl: '/pricing',
    };
  }

  return { ok: true, userId: user.id, planTier, entitlement };
}

/** Shared uuid guard: a malformed id must 404, not reach Postgres as a bad cast and 500. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
