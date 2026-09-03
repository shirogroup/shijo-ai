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
 *   pro        -> 30 scans per CALENDAR MONTH  (displayed "Standard", $29)
 *   plus       -> 100 scans per calendar month (displayed "Plus", $79)
 *   growth     -> 300 scans per calendar month (displayed "Pro", $199)
 *   enterprise -> 300, same as growth until Enterprise is actually sold
 *
 * ── 2026-09-03 REPRICE — read this before changing a number here ──────
 *
 * The ladder used to be pro 4 / plus 30 / growth 100 against a free tier of
 * 1 scan per IP per day (~30 a month). So the $29 plan gave 7.5x FEWER scans
 * than free, and a customer had to reach $79 just to match what they already
 * had for nothing. Paid also had no features: csvExport, pdfDownload and
 * toolCta were declared on this type and read NOWHERE in the codebase, and
 * geo_scans was never read back on any customer-facing path. A customer's $29
 * changed one number in this file and nothing else.
 *
 * Cost per scan is ~$0.28 (ENGINE_COST_ESTIMATE_USD x MAX_PROMPTS = 8, and
 * those are deliberate over-estimates). The old 4-scan cap was therefore
 * defending $1.12 of COGS on a $29 product. At 30 scans COGS is ~$8.40 and
 * gross margin is ~71%.
 *
 * The decision that shapes this table: the free daily scan is a MARKETING
 * ASSET and stays. So paid does not sell scans — free already gives those
 * away. Paid sells THE RECORD: history, trend over time, and an export you
 * can send a client. Volume is raised only so the pricing page stops arguing
 * against buying; it is not the differentiator.
 *
 * If you raise a number here, re-check GEO_DAILY_BUDGET_USD in budget.ts
 * (default $25/day, about 89 scans account-wide, shared with free traffic).
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
  /**
   * Read back your own past scans: the history list, the score trend and the
   * per-engine detail of an earlier scan.
   *
   * This is THE paid differentiator, not scan volume. Anyone can run a scan
   * for free; only a paying customer keeps the record. Enforced in
   * app/api/geo/history/route.ts and app/api/geo/history/[id]/route.ts.
   */
  history: boolean;
  /** Download the history, or one scan's cells, as CSV. Enforced in app/api/geo/export/route.ts. */
  csvExport: boolean;
  /**
   * Show the print-to-PDF report action in the dashboard. There is no server
   * side PDF renderer and no PDF dependency — the report is a print stylesheet
   * the browser saves as PDF. Do not read this flag as "a PDF file is generated".
   */
  pdfDownload: boolean;
  /** Show the CTA into the existing faq-generator / ai-overview-optimizer. */
  toolCta: boolean;
}

export const GEO_ENTITLEMENTS: Record<GeoPlanKey, GeoEntitlement> = {
  free:       { monthlyScans: 0,   brands: 1,  history: false, csvExport: false, pdfDownload: false, toolCta: false },
  pro:        { monthlyScans: 30,  brands: 1,  history: true,  csvExport: true,  pdfDownload: true,  toolCta: false },
  plus:       { monthlyScans: 100, brands: 3,  history: true,  csvExport: true,  pdfDownload: true,  toolCta: true  },
  growth:     { monthlyScans: 300, brands: 10, history: true,  csvExport: true,  pdfDownload: true,  toolCta: true  },
  enterprise: { monthlyScans: 300, brands: 10, history: true,  csvExport: true,  pdfDownload: true,  toolCta: true  },
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
        'Your current plan does not include saved GEO scans. Standard includes 30 a month with full history and export.',
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
