import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/api/errors';
import { clampLimit, listUserScans } from '@/lib/geo/history';
import { resolveGeoViewer } from '@/lib/geo/viewer';
import { checkGeoMonthlyQuota } from '@/lib/geo/entitlements';

export const runtime = 'nodejs';
// Never cached: this is per-user data behind a session cookie, and a cached
// response here would be one customer's history served to the next caller.
export const dynamic = 'force-dynamic';

/**
 * GET /api/geo/history — the signed-in customer's own past scans.
 *
 * This is the paid feature. Free accounts get a 402 with an upgrade URL, not
 * an empty list: an empty list would read as "you have no scans", which is a
 * different and untrue statement.
 *
 * Also returns the caller's current allowance so the dashboard can show
 * "N of M used this month" without a second round trip. Quota failures are
 * reported as nulls rather than failing the whole request — a customer should
 * still see their history if the counter is briefly unavailable.
 */
export async function GET(req: NextRequest) {
  try {
    const viewer = await resolveGeoViewer();
    if (!viewer.ok) {
      return NextResponse.json(
        { success: false, error: viewer.error, upgradeUrl: viewer.upgradeUrl },
        { status: viewer.status }
      );
    }

    const limit = clampLimit(req.nextUrl.searchParams.get('limit'));
    const scans = await listUserScans(viewer.userId, limit);

    let usage: { used: number; limit: number; remaining: number } | null = null;
    try {
      const quota = await checkGeoMonthlyQuota(viewer.userId, viewer.planTier);
      usage = quota.allowed
        ? { used: quota.used, limit: quota.limit, remaining: quota.remaining }
        : { used: quota.used, limit: quota.limit, remaining: 0 };
    } catch {
      usage = null;
    }

    return NextResponse.json({
      success: true,
      planTier: viewer.planTier,
      entitlement: {
        monthlyScans: viewer.entitlement.monthlyScans,
        csvExport: viewer.entitlement.csvExport,
        pdfDownload: viewer.entitlement.pdfDownload,
      },
      usage,
      count: scans.length,
      scans,
    });
  } catch (error) {
    return serverErrorResponse('GEOHIST', 'GEO history list failed', error);
  }
}
