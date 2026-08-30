import { db } from '@/db';
import { geoScans } from '@/db/schema';
import { and, eq, like, sql } from 'drizzle-orm';
import { currentUtcDay, dailyBudgetUsd } from './budget';

/**
 * Admin-side GEO test scans.
 *
 * HOW AN ADMIN SCAN IS MARKED, AND WHY IT IS NOT A NEW COLUMN
 * -----------------------------------------------------------
 * geo_scans has no `source` column and adding one requires an ALTER against
 * the live table. Shipping code that declares a column the table lacks would
 * break the PUBLIC /geo persistence path silently, so that change is
 * deliberately deferred to its own commit after the ALTER is applied.
 *
 * Until then an admin run is marked by writing `ip_address = 'admin:<userId>'`.
 * This is not a hack of convenience — that column's actual semantic role is
 * "the rate-limit key for this scan", and an admin scan genuinely has a
 * different rate-limit key. It gives four things at once:
 *
 *   1. Marks the row unambiguously (no real IP can contain a colon-prefixed
 *      word, and clientIpFrom() only ever yields an IP or 'unknown').
 *   2. Bypasses the public per-IP cap, because the key differs from any real
 *      visitor IP — the public cap logic is untouched.
 *   3. Makes GEO_ADMIN_DAILY_SCAN_CAP a one-line count.
 *   4. Records WHICH admin ran it, which a boolean `source` column would not.
 *
 * It also leaves business_name clean. Prefixing the name would have been the
 * easier marker but would corrupt the Maya Yoga case-study rows and break the
 * "last scan for this fixture" lookup, which matches on name.
 *
 * FORWARD PATH: once `source` exists, backfill with
 *   UPDATE geo_scans SET source = 'admin' WHERE ip_address LIKE 'admin:%';
 * and keep writing the marker as well, so the two never disagree.
 */

export const ADMIN_IP_PREFIX = 'admin:';

export function adminScanKey(userId: string): string {
  // varchar(64). UUIDs are 36 chars, prefix is 6 — comfortably inside.
  return `${ADMIN_IP_PREFIX}${userId}`.slice(0, 64);
}

export function isAdminScanRow(ipAddress: string | null | undefined): boolean {
  return typeof ipAddress === 'string' && ipAddress.startsWith(ADMIN_IP_PREFIX);
}

export const DEFAULT_ADMIN_DAILY_SCAN_CAP = 5;

export function adminDailyScanCap(): number {
  const raw = process.env.GEO_ADMIN_DAILY_SCAN_CAP;
  if (!raw) return DEFAULT_ADMIN_DAILY_SCAN_CAP;
  const n = Number(raw);
  // A malformed value must not silently remove the cap.
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ADMIN_DAILY_SCAN_CAP;
  return Math.floor(n);
}

export interface AdminBudgetSnapshot {
  utcDay: string;
  /** Every scan today, admin and public. */
  scansToday: number;
  adminScansToday: number;
  publicScansToday: number;
  /** Sum of estimated_cost_usd for today, all sources. */
  spentTodayUsd: number;
  budgetUsd: number;
  adminCap: number;
  adminRemaining: number;
  budgetRemainingUsd: number;
}

/**
 * Read-only snapshot for the admin page. Never throws — a failure here must
 * not blank the whole page, so it degrades to zeroes with a flag.
 */
export async function budgetSnapshot(): Promise<AdminBudgetSnapshot & { degraded: boolean }> {
  const utcDay = currentUtcDay();
  const budgetUsd = dailyBudgetUsd();
  const adminCap = adminDailyScanCap();

  const empty = {
    utcDay,
    scansToday: 0,
    adminScansToday: 0,
    publicScansToday: 0,
    spentTodayUsd: 0,
    budgetUsd,
    adminCap,
    adminRemaining: adminCap,
    budgetRemainingUsd: budgetUsd,
    degraded: true,
  };

  try {
    const [totals] = await db
      .select({
        scans: sql<number>`count(*)::int`,
        spend: sql<string>`coalesce(sum(${geoScans.estimatedCostUsd}), 0)::text`,
      })
      .from(geoScans)
      .where(eq(geoScans.utcDay, utcDay));

    const [adminRow] = await db
      .select({ scans: sql<number>`count(*)::int` })
      .from(geoScans)
      .where(
        and(eq(geoScans.utcDay, utcDay), like(geoScans.ipAddress, `${ADMIN_IP_PREFIX}%`))
      );

    const scansToday = totals?.scans ?? 0;
    const adminScansToday = adminRow?.scans ?? 0;
    const spentTodayUsd = Number(totals?.spend ?? 0);

    return {
      utcDay,
      scansToday,
      adminScansToday,
      publicScansToday: Math.max(0, scansToday - adminScansToday),
      spentTodayUsd,
      budgetUsd,
      adminCap,
      adminRemaining: Math.max(0, adminCap - adminScansToday),
      budgetRemainingUsd: Math.max(0, budgetUsd - spentTodayUsd),
      degraded: false,
    };
  } catch (err) {
    console.error('[geo-admin] budget snapshot failed:', err);
    return empty;
  }
}

export type AdminGuardResult =
  | { allowed: true; utcDay: string }
  | { allowed: false; reason: 'admin_cap' | 'budget' | 'unavailable'; message: string };

/**
 * Guard for an admin test scan.
 *
 * Bypasses the per-IP public cap by design, but NOT the money guards: the
 * shared daily budget still applies, plus a separate admin-only scan cap. An
 * admin session must not be able to spend the day's budget by holding down a
 * button.
 *
 * Fails closed on a database error, same reasoning as the public guard: if we
 * cannot prove we are under the caps, we do not spend.
 */
export async function checkAdminGuards(plannedCostUsd: number): Promise<AdminGuardResult> {
  const utcDay = currentUtcDay();
  const cap = adminDailyScanCap();
  const budget = dailyBudgetUsd();

  try {
    const [adminRow] = await db
      .select({ scans: sql<number>`count(*)::int` })
      .from(geoScans)
      .where(
        and(eq(geoScans.utcDay, utcDay), like(geoScans.ipAddress, `${ADMIN_IP_PREFIX}%`))
      );

    if ((adminRow?.scans ?? 0) >= cap) {
      return {
        allowed: false,
        reason: 'admin_cap',
        message: `Admin test-scan cap reached (${cap} per UTC day). Resets at 00:00 UTC. Raise GEO_ADMIN_DAILY_SCAN_CAP if you genuinely need more.`,
      };
    }

    const [spendRow] = await db
      .select({ spend: sql<string>`coalesce(sum(${geoScans.estimatedCostUsd}), 0)::text` })
      .from(geoScans)
      .where(eq(geoScans.utcDay, utcDay));

    const spent = Number(spendRow?.spend ?? 0);
    if (spent + plannedCostUsd > budget) {
      return {
        allowed: false,
        reason: 'budget',
        message: `Daily GEO budget would be exceeded ($${spent.toFixed(4)} spent of $${budget.toFixed(2)}). Admin scans do not bypass the budget.`,
      };
    }

    return { allowed: true, utcDay };
  } catch (err) {
    console.error('[geo-admin] guard check failed, refusing scan:', err);
    return {
      allowed: false,
      reason: 'unavailable',
      message: 'Could not verify the daily caps, so the scan was refused. Check the database connection.',
    };
  }
}

/** Minutes until the UTC day rolls over — drives the cap-reset readout. */
export function minutesUntilUtcReset(now: Date = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.round((next.getTime() - now.getTime()) / 60000));
}
