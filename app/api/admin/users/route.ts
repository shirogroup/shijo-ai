import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, usageLogs, supportTickets } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, desc, count, max } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requester = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Aggregate per-user usage and ticket counts in two grouped queries
    // rather than one row-per-user query per user (N+1) — this is meant to
    // be a lightweight admin overview, not a per-user drill-down.
    const [usageByUser, ticketsByUser, allUsers] = await Promise.all([
      db
        .select({
          userId: usageLogs.userId,
          totalActions: count(usageLogs.id),
          lastActiveAt: max(usageLogs.createdAt),
        })
        .from(usageLogs)
        .groupBy(usageLogs.userId),
      db
        .select({
          userId: supportTickets.userId,
          ticketCount: count(supportTickets.id),
        })
        .from(supportTickets)
        .groupBy(supportTickets.userId),
      db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
        limit: 1000,
      }),
    ]);

    const usageMap = new Map(usageByUser.map((u) => [u.userId, u]));
    const ticketMap = new Map(
      ticketsByUser.filter((t) => t.userId !== null).map((t) => [t.userId as string, t.ticketCount])
    );

    const enriched = allUsers.map((u) => {
      const usage = usageMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        planTier: u.planTier,
        subscriptionStatus: u.subscriptionStatus,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        totalActions: usage?.totalActions ?? 0,
        lastActiveAt: usage?.lastActiveAt ?? null,
        ticketCount: ticketMap.get(u.id) ?? 0,
      };
    });

    const summary = {
      totalUsers: allUsers.length,
      activeLast7Days: enriched.filter(
        (u) => u.lastActiveAt && new Date(u.lastActiveAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
      paidUsers: enriched.filter((u) => u.planTier && u.planTier !== 'free').length,
      neverActive: enriched.filter((u) => !u.lastActiveAt).length,
    };

    return NextResponse.json({ users: enriched, summary });
  } catch (error) {
    return serverErrorResponse('ADU', 'Admin users list error', error, 'Could not load users.');
  }
}
