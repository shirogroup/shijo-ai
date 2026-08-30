import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geoScanCells, geoScans, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { isAdminScanRow } from '@/lib/geo/admin';

export const runtime = 'nodejs';

/**
 * Admin-only: the last N GEO scans, with a per-scan engine summary.
 *
 * Read-only. Returns NO raw model output — the list view gets counts and a
 * headline only. Full cell text lives behind the detail endpoint, which is one
 * deliberate click away, so an admin skimming the list is not shown a wall of
 * model prose (or anything a customer typed) by default.
 *
 * `source` is derived, not stored: the geo_scans table has no source column
 * yet (that ALTER is deferred), so an admin run is recognised by its
 * ip_address marker. See lib/geo/admin.ts for why.
 *
 * ip_address is NOT returned. It is a visitor identifier and the list view has
 * no need for it; the derived boolean is all the UI uses.
 */

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

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

    const raw = Number(req.nextUrl.searchParams.get('limit'));
    const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : DEFAULT_LIMIT;

    const scans = await db
      .select({
        id: geoScans.id,
        createdAt: geoScans.createdAt,
        utcDay: geoScans.utcDay,
        businessName: geoScans.businessName,
        city: geoScans.city,
        identityResolved: geoScans.identityResolved,
        band: geoScans.band,
        score: geoScans.score,
        promptCount: geoScans.promptCount,
        cellsAnswered: geoScans.cellsAnswered,
        cellsMentioned: geoScans.cellsMentioned,
        enginesAttempted: geoScans.enginesAttempted,
        enginesAnswered: geoScans.enginesAnswered,
        durationMs: geoScans.durationMs,
        estimatedCostUsd: geoScans.estimatedCostUsd,
        ipAddress: geoScans.ipAddress,
      })
      .from(geoScans)
      .orderBy(desc(geoScans.createdAt))
      .limit(limit);

    // Per-scan engine ok/fail counts in ONE grouped query rather than one
    // query per scan — same reasoning as the N+1 note in /api/admin/users.
    const ids = scans.map((s) => s.id);
    const cellAgg = ids.length
      ? await db
          .select({
            scanId: geoScanCells.scanId,
            engine: geoScanCells.engine,
            total: sql<number>`count(*)::int`,
            ok: sql<number>`count(*) filter (where ${geoScanCells.errorMessage} is null and ${geoScanCells.skipped} = false)::int`,
            mentioned: sql<number>`count(*) filter (where ${geoScanCells.mentioned} = true)::int`,
          })
          .from(geoScanCells)
          .where(inArray(geoScanCells.scanId, ids))
          .groupBy(geoScanCells.scanId, geoScanCells.engine)
      : [];

    const byScan = new Map<string, { engine: string; total: number; ok: number; fail: number; mentioned: number }[]>();
    for (const row of cellAgg) {
      const list = byScan.get(row.scanId) ?? [];
      list.push({
        engine: row.engine,
        total: row.total,
        ok: row.ok,
        fail: row.total - row.ok,
        mentioned: row.mentioned,
      });
      byScan.set(row.scanId, list);
    }

    return NextResponse.json({
      success: true,
      limit,
      scans: scans.map(({ ipAddress, ...s }) => ({
        ...s,
        // Derived, not stored. Do not confuse with a future `source` column.
        isAdminScan: isAdminScanRow(ipAddress),
        engines: (byScan.get(s.id) ?? []).sort((a, b) => a.engine.localeCompare(b.engine)),
      })),
    });
  } catch (error) {
    return serverErrorResponse('GEOADM', 'GEO scans list failed', error);
  }
}
