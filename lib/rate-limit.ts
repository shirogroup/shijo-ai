import { db } from '@/db';
import { signupThrottle } from '@/db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';

/**
 * Abuse throttle for unauthenticated public endpoints.
 *
 * Added 2026-08-22 after /api/auth/register was used as a spam relay for
 * ~19 hours (KB §37/§38). Deliberately NOT built on the pre-existing
 * `rate_limits` table: that table's `user_id` is NOT NULL and foreign-keyed
 * to `users`, so it can only ever throttle someone who has already
 * registered — useless against the anonymous traffic that caused this.
 *
 * ── Design constraint: ZERO friction for legitimate users ──
 * No challenge, no extra step, no visible UI. A real person signing up once
 * never comes close to these ceilings. The limits below are set an order of
 * magnitude above plausible human behaviour and an order of magnitude below
 * what an abuse run needs to be worthwhile.
 *
 * ── Fails OPEN, on purpose ──
 * Every failure path allows the request. If the migration hasn't been run
 * yet, or the database is briefly unreachable, signups must keep working.
 * A throttle that takes the product down is worse than the abuse it
 * prevents — and this repo has been bitten before by code shipping ahead of
 * a manual migration (KB §13, §32). The edge-level Vercel WAF rule is the
 * primary defence; this is defence in depth.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** true when the check could not run (e.g. table missing) and we allowed by default */
  degraded: boolean;
}

const ALLOW: RateLimitResult = { allowed: true, degraded: false };

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs);

  try {
    const [existing] = await db
      .select({ id: signupThrottle.id, count: signupThrottle.count })
      .from(signupThrottle)
      .where(and(eq(signupThrottle.key, key), gt(signupThrottle.windowStart, windowStart)))
      .limit(1);

    if (!existing) {
      // No live window for this key — start one.
      await db.insert(signupThrottle).values({ key, count: 1, windowStart: new Date() });
      return ALLOW;
    }

    if ((existing.count ?? 0) >= limit) {
      return { allowed: false, degraded: false };
    }

    await db
      .update(signupThrottle)
      .set({ count: sql`${signupThrottle.count} + 1` })
      .where(eq(signupThrottle.id, existing.id));

    return ALLOW;
  } catch (err) {
    // Fail open — see the header comment. Logged loudly so a missing
    // migration surfaces in Vercel logs rather than silently disabling
    // the throttle forever.
    console.error('[RATE_LIMIT][DEGRADED] Throttle check failed, allowing request. key=%s', key, err);
    return { allowed: true, degraded: true };
  }
}

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; the left-most entry is
 * the client. Spoofable in principle, which is precisely why this is depth
 * behind the Vercel WAF rule rather than the primary control.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

/**
 * Opportunistic cleanup of expired throttle rows. Called on a small
 * fraction of requests so the table doesn't grow without bound, and never
 * allowed to fail a request.
 */
export async function pruneRateLimits(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - olderThanMs);
    await db.delete(signupThrottle).where(sql`${signupThrottle.windowStart} < ${cutoff}`);
  } catch {
    // Non-critical.
  }
}
