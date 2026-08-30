import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { pingAll, vendorConfiguration } from '@/lib/geo/health';
import { budgetSnapshot, minutesUntilUtcReset } from '@/lib/geo/admin';

export const runtime = 'nodejs';
// Six vendor pings in parallel, each capped at 12s.
export const maxDuration = 60;

/**
 * Admin-only GEO vendor health.
 *
 *   GET  — config strip + budget snapshot. No outbound calls, no cost.
 *   POST — actually pings every vendor. Costs a fraction of a cent for
 *          Perplexity, Claude and Places (no free auth-check endpoint exists
 *          for those three).
 *
 * Deliberately does NOT touch the public /geo per-IP cap in either direction:
 * pings write nothing to geo_scans and consume no visitor allowance.
 *
 * Auth follows the same inline pattern as every other /api/admin/* route —
 * session, then a fresh isAdmin read from the database. Not extracted to a
 * shared helper on purpose: the existing routes each re-check independently
 * and introducing a second pattern here would be worse than the duplication.
 */

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const requester = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!requester || !requester.isAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { requester };
}

export async function GET() {
  try {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;

    const budget = await budgetSnapshot();
    return NextResponse.json({
      success: true,
      vendors: vendorConfiguration(),
      budget,
      utcResetInMinutes: minutesUntilUtcReset(),
      serverUtcNow: new Date().toISOString(),
    });
  } catch (error) {
    return serverErrorResponse('GEOADM', 'GEO health GET failed', error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;

    const startedAt = Date.now();
    const results = await pingAll();

    return NextResponse.json({
      success: true,
      pings: results,
      allOk: results.every((r) => r.ok),
      durationMs: Date.now() - startedAt,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    return serverErrorResponse('GEOADM', 'GEO health ping failed', error);
  }
}
