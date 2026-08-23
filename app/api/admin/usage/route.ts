import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, usageLogs } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, desc, count, sum, sql, gte } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { MODEL_PRICING } from '@/lib/ai/pricing';

export const runtime = 'nodejs';

/**
 * Admin API-spend overview.
 *
 * Answers the questions that were previously unanswerable from inside the app:
 * what did the API cost today / this month, which tools cost the most, and is
 * a paying customer above or below water.
 *
 * ⚠️ Only rows written after 2026-08-23 carry a real cost. Everything before
 * that has api_cost_usd = 0 because input tokens were never recorded, and no
 * back-fill is possible. The response flags this explicitly rather than
 * letting a zero read as "free".
 */
const COST_TRACKING_STARTED = '2026-08-23';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requester = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days') || 30), 1), 365);
    const since = new Date(Date.now() - days * 86_400_000);

    const cost = sql<string>`COALESCE(SUM(${usageLogs.apiCostUsd}), 0)`;
    const inTok = sql<string>`COALESCE(SUM((${usageLogs.metadata}->>'inputTokens')::bigint), 0)`;
    const outTok = sql<string>`COALESCE(SUM((${usageLogs.metadata}->>'outputTokens')::bigint), 0)`;

    const [byDay, byTool, byPlan, byUser, untracked] = await Promise.all([
      db.select({
          day: sql<string>`to_char(${usageLogs.createdAt}, 'YYYY-MM-DD')`,
          generations: count(usageLogs.id), costUsd: cost, inputTokens: inTok, outputTokens: outTok,
        }).from(usageLogs).where(gte(usageLogs.createdAt, since))
        .groupBy(sql`to_char(${usageLogs.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(desc(sql`to_char(${usageLogs.createdAt}, 'YYYY-MM-DD')`)),

      db.select({
          tool: usageLogs.action, generations: count(usageLogs.id),
          costUsd: cost, inputTokens: inTok, outputTokens: outTok,
        }).from(usageLogs).where(gte(usageLogs.createdAt, since))
        .groupBy(usageLogs.action).orderBy(desc(cost)),

      db.select({
          plan: users.planTier, generations: count(usageLogs.id), costUsd: cost,
        }).from(usageLogs).innerJoin(users, eq(users.id, usageLogs.userId))
        .where(gte(usageLogs.createdAt, since)).groupBy(users.planTier).orderBy(desc(cost)),

      // Margin per user: what they pay monthly vs what they cost us.
      db.select({
          userId: usageLogs.userId, email: users.email, plan: users.planTier,
          generations: count(usageLogs.id), costUsd: cost,
        }).from(usageLogs).innerJoin(users, eq(users.id, usageLogs.userId))
        .where(gte(usageLogs.createdAt, since))
        .groupBy(usageLogs.userId, users.email, users.planTier)
        .orderBy(desc(cost)).limit(100),

      // How much of the window predates cost tracking — so a low total is
      // never mistaken for low spend.
      db.select({ rows: count(usageLogs.id) }).from(usageLogs)
        .where(sql`${usageLogs.createdAt} >= ${since} AND (${usageLogs.metadata}->>'inputTokens') IS NULL`),
    ]);

    const PLAN_REVENUE: Record<string, number> = { free: 0, pro: 29, growth: 199, enterprise: 0 };
    const withMargin = byUser.map((u) => {
      const revenue = PLAN_REVENUE[u.plan ?? 'free'] ?? 0;
      const c = Number(u.costUsd);
      return { ...u, costUsd: c, monthlyRevenueUsd: revenue, marginUsd: Math.round((revenue - c) * 100) / 100 };
    });

    return NextResponse.json({
      success: true,
      windowDays: days,
      costTrackingStarted: COST_TRACKING_STARTED,
      rowsWithoutCostData: untracked[0]?.rows ?? 0,
      modelRates: MODEL_PRICING,
      totals: {
        generations: byDay.reduce((n, d) => n + Number(d.generations), 0),
        costUsd: Math.round(byDay.reduce((n, d) => n + Number(d.costUsd), 0) * 10000) / 10000,
      },
      byDay, byTool, byPlan, byUser: withMargin,
    });
  } catch (error) {
    return serverErrorResponse('ADU', 'Admin usage API error', error, 'Could not load usage stats.');
  }
}
