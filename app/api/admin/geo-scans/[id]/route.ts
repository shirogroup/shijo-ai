import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geoScanCells, geoScans, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { asc, eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { isAdminScanRow } from '@/lib/geo/admin';

export const runtime = 'nodejs';

/**
 * Admin-only: full detail for one scan — every engine x prompt cell, with
 * snippet, citations and the identity payload.
 *
 * This is the one place raw-ish model text is exposed, and only because
 * diagnosing "why did this cell not count as a mention" is impossible without
 * it. Still bounded: snippets were already truncated to ~600 chars at write
 * time by toSnippet(), so there is no full model response stored to leak.
 *
 * ip_address is NOT returned even here. The derived isAdminScan boolean is all
 * the UI needs, and a raw visitor IP has no diagnostic value on this page.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Guard against a malformed id reaching Postgres as a bad uuid cast,
    // which would surface as a 500 instead of an honest 404.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [scan] = await db.select().from(geoScans).where(eq(geoScans.id, id)).limit(1);
    if (!scan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const cells = await db
      .select({
        id: geoScanCells.id,
        engine: geoScanCells.engine,
        prompt: geoScanCells.prompt,
        mentioned: geoScanCells.mentioned,
        matchedOn: geoScanCells.matchedOn,
        snippet: geoScanCells.snippet,
        citations: geoScanCells.citations,
        errorMessage: geoScanCells.errorMessage,
        skipped: geoScanCells.skipped,
        latencyMs: geoScanCells.latencyMs,
      })
      .from(geoScanCells)
      .where(eq(geoScanCells.scanId, id))
      .orderBy(asc(geoScanCells.engine), asc(geoScanCells.createdAt));

    const { ipAddress, ...safeScan } = scan;

    return NextResponse.json({
      success: true,
      scan: {
        ...safeScan,
        isAdminScan: isAdminScanRow(ipAddress),
      },
      cells,
      // Distinct prompts in run order, so the UI can build the grid without
      // re-deriving it and risking a different order than the cells.
      prompts: [...new Set(cells.map((c) => c.prompt))],
      engines: [...new Set(cells.map((c) => c.engine))].sort(),
    });
  } catch (error) {
    return serverErrorResponse('GEOADM', 'GEO scan detail failed', error);
  }
}
