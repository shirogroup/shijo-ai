import { db } from '@/db';
import { geoScans } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import {
  ENGINE_COST_ESTIMATE_USD,
  SCANS_PER_IP_PER_UTC_DAY,
  type EngineId,
} from './types';

/**
 * Spend and abuse guards for the public /geo checker.
 *
 * /geo is unauthenticated, so there is no account to rate-limit against and
 * every scan fans out to up to 5 paid APIs. Two independent guards:
 *
 *   1. Per-IP daily cap  — one scan per IP per UTC day.
 *   2. Daily budget      — estimated spend across ALL scans today must stay
 *                          under GEO_DAILY_BUDGET_USD (default 25).
 *
 * Both are checked BEFORE any engine call. When either trips, the caller
 * returns a message and makes zero API calls — that is the whole point, so
 * do not move these checks after the fan-out.
 *
 * Honest limitation, stated rather than hidden: an IP cap is trivially
 * defeated by anyone who wants to (mobile networks rotate, VPNs are free,
 * and NAT means one office shares an IP). It is a cost-control speed bump,
 * not a security control. The daily budget cap is the real backstop, since
 * it holds regardless of how the requests arrive.
 */

export const DEFAULT_DAILY_BUDGET_USD = 25;

export function currentUtcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function dailyBudgetUsd(): number {
  const raw = process.env.GEO_DAILY_BUDGET_USD;
  if (!raw) return DEFAULT_DAILY_BUDGET_USD;
  const parsed = Number(raw);
  // A malformed value must not silently disable the guard.
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DAILY_BUDGET_USD;
  return parsed;
}

/** Conservative pre-flight cost estimate for a planned scan. */
export function estimateScanCostUsd(
  engines: EngineId[],
  promptCount: number
): number {
  const perPrompt = engines.reduce(
    (sum, e) => sum + (ENGINE_COST_ESTIMATE_USD[e] ?? 0.01),
    0
  );
  return Number((perPrompt * promptCount).toFixed(4));
}

export type GuardResult =
  | { allowed: true; utcDay: string; spentTodayUsd: number; budgetUsd: number }
  | { allowed: false; reason: 'ip_cap' | 'budget' | 'unavailable'; message: string };

/**
 * Check both guards. Returns allowed:false with a user-safe message when
 * either trips.
 *
 * Fail-closed on database errors. A DB outage means we cannot prove the
 * caller is under either limit, and the failure mode of guessing wrong is
 * unbounded spend on five paid APIs from an anonymous endpoint. Refusing
 * the scan is recoverable; an unmetered bill is not.
 */
export async function checkGuards(
  ipAddress: string,
  plannedCostUsd: number,
  now: Date = new Date(),
  opts: { skipIpCap?: boolean } = {}
): Promise<GuardResult> {
  const utcDay = currentUtcDay(now);
  const budgetUsd = dailyBudgetUsd();

  try {
    // skipIpCap is set for SIGNED-IN callers, who are metered against their
    // plan's monthly allowance instead (see lib/geo/entitlements.ts). The
    // budget guard below still runs — skipping the IP cap must never mean
    // skipping the money guard.
    const [ipRow] = opts.skipIpCap
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(geoScans)
          .where(and(eq(geoScans.ipAddress, ipAddress), eq(geoScans.utcDay, utcDay)));

    if (!opts.skipIpCap && (ipRow?.count ?? 0) >= SCANS_PER_IP_PER_UTC_DAY) {
      return {
        allowed: false,
        reason: 'ip_cap',
        message:
          'You have already run a free scan today. The free checker allows one scan per day — try again tomorrow (limits reset at midnight UTC).',
      };
    }

    const [spendRow] = await db
      .select({
        total: sql<string>`coalesce(sum(${geoScans.estimatedCostUsd}), 0)::text`,
      })
      .from(geoScans)
      .where(eq(geoScans.utcDay, utcDay));

    const spentTodayUsd = Number(spendRow?.total ?? 0);

    if (spentTodayUsd + plannedCostUsd > budgetUsd) {
      return {
        allowed: false,
        reason: 'budget',
        message:
          'The free checker has reached its daily limit. Please try again tomorrow.',
      };
    }

    return { allowed: true, utcDay, spentTodayUsd, budgetUsd };
  } catch (err) {
    console.error('[geo] guard check failed, refusing scan:', err);
    return {
      allowed: false,
      reason: 'unavailable',
      message:
        'The free checker is temporarily unavailable. Please try again shortly.',
    };
  }
}
