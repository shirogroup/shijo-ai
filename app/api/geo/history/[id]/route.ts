import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/api/errors';
import { getUserScan } from '@/lib/geo/history';
import { isUuid, resolveGeoViewer } from '@/lib/geo/viewer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/geo/history/[id] — one of the caller's own scans, with every
 * engine x prompt cell: whether the business was mentioned, what matched, the
 * stored snippet and any citations.
 *
 * Ownership is enforced inside getUserScan's WHERE clause. A scan belonging to
 * someone else and a scan that does not exist both return the same 404 — the
 * response must not let a caller distinguish them.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await resolveGeoViewer();
    if (!viewer.ok) {
      return NextResponse.json(
        { success: false, error: viewer.error, upgradeUrl: viewer.upgradeUrl },
        { status: viewer.status }
      );
    }

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const found = await getUserScan(viewer.userId, id);
    if (!found) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...found });
  } catch (error) {
    return serverErrorResponse('GEOHISTID', 'GEO history detail failed', error);
  }
}
