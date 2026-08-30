import { ScanDetailClient } from './ScanDetailClient';

/**
 * /admin/geo-health/scan/[scanId] — full engine x prompt grid for one scan.
 *
 * Nested under /admin so it inherits the admin shell and the middleware
 * session gate; the data behind it is gated by the isAdmin check inside
 * /api/admin/geo-scans/[id].
 */
export default async function AdminGeoScanDetailPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  return <ScanDetailClient scanId={scanId} />;
}
