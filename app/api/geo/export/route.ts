import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/api/errors';
import { getUserScan, listUserScans, MAX_HISTORY_LIMIT } from '@/lib/geo/history';
import { isUuid, resolveGeoViewer } from '@/lib/geo/viewer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/geo/export — the caller's own GEO data as CSV.
 *
 *   /api/geo/export             -> one row per scan (the history summary)
 *   /api/geo/export?scanId=UUID -> one row per engine x prompt cell of that scan
 *
 * This is the "send it to a client" artifact, and it is the second half of what
 * the paid plan buys. Gated on entitlement.csvExport, which until 2026-09-03
 * was a field nothing read.
 *
 * Ownership is enforced by the history helpers, which filter on userId in SQL.
 */

/**
 * RFC 4180 field escaping. Snippets are free model text and routinely contain
 * commas, quotes and newlines, so this is not optional decoration.
 *
 * The leading-character guard is deliberate: a value starting = + - @ or a
 * control char is interpreted as a formula by Excel and Google Sheets when the
 * file is opened. Prefixing a single quote neutralises that without altering
 * what a human reads. This matters more than usual here because the text comes
 * from third-party model output, not from us.
 */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (Array.isArray(value)) s = value.join(' | ');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function csvRow(fields: unknown[]): string {
  return fields.map(csvField).join(',');
}

/** A filename safe in a Content-Disposition header and on Windows. */
function safeSlug(input: string, fallback: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || fallback;
}

function csvResponse(rows: string[], filename: string): NextResponse {
  // BOM so Excel opens UTF-8 correctly; without it, accented business names
  // arrive mojibaked and the export looks broken to the customer.
  const body = '﻿' + rows.join('\r\n') + '\r\n';
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const viewer = await resolveGeoViewer();
    if (!viewer.ok) {
      return NextResponse.json(
        { success: false, error: viewer.error, upgradeUrl: viewer.upgradeUrl },
        { status: viewer.status }
      );
    }
    if (!viewer.entitlement.csvExport) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSV export is part of Standard and above.',
          upgradeUrl: '/pricing',
        },
        { status: 402 }
      );
    }

    const scanId = req.nextUrl.searchParams.get('scanId');

    // ── One scan, cell by cell ────────────────────────────────────────
    if (scanId) {
      if (!isUuid(scanId)) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      const found = await getUserScan(viewer.userId, scanId);
      if (!found) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      const { scan, cells } = found;
      const rows = [
        csvRow([
          'Business',
          'City',
          'Scanned (UTC)',
          'Engine',
          'Prompt',
          'Mentioned',
          'Matched on',
          'Snippet',
          'Citations',
          'Status',
        ]),
        ...cells.map((c) =>
          csvRow([
            scan.businessName,
            scan.city,
            scan.createdAt.toISOString(),
            c.engine,
            c.prompt,
            c.mentioned ? 'yes' : 'no',
            Array.isArray(c.matchedOn) ? c.matchedOn.join(' | ') : '',
            c.snippet,
            Array.isArray(c.citations) ? c.citations.join(' | ') : '',
            c.errorMessage ? `error: ${c.errorMessage}` : c.skipped ? 'not asked' : 'answered',
          ])
        ),
      ];
      const day = scan.createdAt.toISOString().slice(0, 10);
      return csvResponse(
        rows,
        `shijo-ai-visibility-${safeSlug(scan.businessName, 'scan')}-${day}.csv`
      );
    }

    // ── Whole history, one row per scan ───────────────────────────────
    const scans = await listUserScans(viewer.userId, MAX_HISTORY_LIMIT);
    const rows = [
      csvRow([
        'Scanned (UTC)',
        'Business',
        'Website',
        'City',
        'Score',
        'Band',
        'Prompts',
        'Cells answered',
        'Cells mentioning you',
        'Engines attempted',
        'Engines answered',
        'Identity resolved',
        'Scan ID',
      ]),
      ...scans.map((s) =>
        csvRow([
          s.createdAt.toISOString(),
          s.businessName,
          s.websiteUrl,
          s.city,
          // A null score is a band we deliberately withheld a number for
          // (insufficient / unverified). Exporting it as 0 would chart as
          // "this business was invisible", which is a different claim.
          s.score === null ? '' : s.score,
          s.band,
          s.promptCount,
          s.cellsAnswered,
          s.cellsMentioned,
          s.enginesAttempted,
          s.enginesAnswered,
          s.identityResolved ? 'yes' : 'no',
          s.id,
        ])
      ),
    ];
    const today = new Date().toISOString().slice(0, 10);
    return csvResponse(rows, `shijo-ai-visibility-history-${today}.csv`);
  } catch (error) {
    return serverErrorResponse('GEOEXP', 'GEO export failed', error);
  }
}
