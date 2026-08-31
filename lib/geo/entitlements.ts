import { db } from '@/db';
import { geoScans } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

/**
 * GEO scan entitlements per plan.
 *
 * THE SHAPE OF THE RULE, because it is easy to get subtly wrong:
 *
 *   anonymous  -> 1 scan per IP per UTC DAY   (existing, unchanged)
 *   free       -> same as anonymous; signing in on Free grants nothing extra
 *   pro        -> 4 scans per CALENDAR MONTH  (displayed "Standard", $29)
 *   plus       -> 30 scans per calendar month (displayed "Plus", $79)
 *   growth     -> 100 scans per calendar month (displayed "Pro", $199)
 *   enterprise -> 100, same as growth until Enterprise is actually sold
 *
 * Note the unit changes between anonymous (per day) and paid (per month).
 * That is intentional: the anonymous cap exists to stop abuse of a free
 * public endpoint, the paid caps exist to meter a purchased allowance. They
 * are different controls answering different questions, so they are counted
 * against different windows and live in different functions.
 *
 * A signed-in paid user is NOT also subject to the per-IP day cap — otherwise
 * a $199 customer sharing an office IP with a colleague would be blocked by a
 * control meant for anonymous abuse.
 */

export type GeoPlanKey = 'free' | 'pro' | 'plus' | 'growth' | 'enterprise';

export interface GeoEntitlement {
  /** Scans per calendar month. 0 means "no signed-in allowance". */
  monthlyScans: number;
  /** Distinct brands/businesses trackable. Informational for now. */
  brands: number;
  csvExport: boolean;
  pdfDownload: boolean;
  /** Show the CTA into the existing faq-generator / ai-overview-optimizer. */
  toolCta: boolean;
}

export const GEO_ENTITLEMENTS: Record<GeoPlanKey, GeoEntitlement> = {
  free:       { monthlyScans: 0,   brands: 1, csvExport: false, pdfDownload: false, toolCta: false },
  pro:        { monthlyScans: 4,   brands: 1, csvExport: false, pdfDownload: false, toolCta: false },
  plus:       { monthlyScans: 30,  brands: 1, csvExport: false, pdfDownload: false, toolCta: true  },
  growth:     { monthlyScans: 100, brands: 5, csvExport: true,  pdfDownload: true,  toolCta: true  },
  enterprise: { monthlyScans: 100, brands: 5, csvExport: true,  pdfDownload: true,  toolCta: true  },
};

export function entitlementFor(planTier: string | null | undefined): GeoEntitlement {
  const key = (planTier ?? 'free') as GeoPlanKey;
  return GEO_ENTITLEMENTS[key] ?? GEO_ENTITLEMENTS.free;
}

/** First day of the current UTC calendar month, as YYYY-MM-DD. */
export function currentMonthStart(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export type GeoQuotaResult =
  | { allowed: true; used: number; limit: number; remaining: number }
  | {
      allowed: false;
      reason: 'no_plan_allowance' | 'month_cap' | 'unavailable';
      used: number;
      limit: number;
      message: string;
      upgradeUrl: string;
    };

const UPGRADE_URL = '/pricing';

/**
 * Monthly quota check for a SIGNED-IN user.
 *
 * Counts only rows attributable to this user, excluding admin test scans so
 * QA never eats a customer's allowance. Runs before any engine call — when it
 * refuses, nothing is spent.
 *
 * Fails closed on a database error, same reasoning as every other guard here:
 * if we cannot prove the caller is under their limit, we do not spend money
 * on their behalf.
 */
export async function checkGeoMonthlyQuota(
  userId: string,
  planTier: string | null | undefined,
  now: Date = new Date()
): Promise<GeoQuotaResult> {
  const ent = entitlementFor(planTier);

  if (ent.monthlyScans <= 0) {
    return {
      allowed: false,
      reason: 'no_plan_allowance',
      used: 0,
      limit: 0,
      message:
        'Your current plan does not include saved GEO scans. Standard includes 4 a month, Plus 30.',
      upgradeUrl: UPGRADE_URL,
    };
  }

  try {
    const monthStart = currentMonthStart(now);
    const [row] = await db
      .select({ used: sql<number>`count(*)::int` })
      .from(geoScans)
      .where(
        and(
          eq(geoScans.userId, userId),
          gte(geoScans.utcDay, monthStart),
          // Admin QA runs must not consume a customer's allowance.
          eq(geoScans.source, 'public')
        )
      );

    const used = row?.used ?? 0;
    if (used >= ent.monthlyScans) {
      return {
        allowed: false,
        reason: 'month_cap',
        used,
        limit: ent.monthlyScans,
        message: `You have used all ${ent.monthlyScans} GEO scans on your plan this month. Your allowance resets on the 1st (UTC).`,
        upgradeUrl: UPGRADE_URL,
      };
    }

    return { allowed: true, used, limit: ent.monthlyScans, remaining: ent.monthlyScans - used };
  } catch (err) {
    console.error('[geo] monthly quota check failed, refusing scan:', err);
    return {
      allowed: false,
      reason: 'unavailable',
      used: 0,
      limit: ent.monthlyScans,
      message: 'Could not verify your plan allowance right now. Please try again shortly.',
      upgradeUrl: UPGRADE_URL,
    };
  }
}
