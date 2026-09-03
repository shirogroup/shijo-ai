import { db } from '@/db';
import { geoScanCells, geoScans } from '@/db/schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

/**
 * Read path for a customer's own GEO scan history.
 *
 * Every scan has been persisted since 2026-08-31 — geo_scans carries the
 * signed-in user's id and geo_scan_cells carries the full per-engine,
 * per-prompt detail with snippets and citations. Until now none of it was ever
 * read back on a customer-facing path: geo_scans was queried only by the admin
 * routes and by the quota counter, so a paying customer could never see a scan
 * again once the tab was closed. This module is that missing read path, and it
 * is what the paid plan actually sells (see lib/geo/entitlements.ts).
 *
 * OWNERSHIP IS ENFORCED IN THE QUERY, NOT ABOVE IT. Every function here takes
 * a userId and filters on it in SQL. A scan id is a uuid, but it is still a
 * value that arrives from the client, so it is never the only thing standing
 * between one customer and another customer's scan. Do not add a helper that
 * looks a scan up by id alone and checks the owner afterwards — that is the
 * shape this file exists to prevent.
 *
 * Anonymous scans have user_id NULL and are therefore invisible here by
 * construction: eq(geoScans.userId, userId) never matches NULL.
 */

/** Hard ceiling on rows returned, so a crafted ?limit cannot ask for everything. */
export const MAX_HISTORY_LIMIT = 200;
export const DEFAULT_HISTORY_LIMIT = 50;

export interface EngineSummary {
  engine: string;
  total: number;
  ok: number;
  fail: number;
  mentioned: number;
}

export interface HistoryScan {
  id: string;
  createdAt: Date;
  utcDay: string;
  businessName: string;
  websiteUrl: string | null;
  city: string | null;
  identityResolved: boolean;
  band: string | null;
  score: number | null;
  promptCount: number;
  cellsAnswered: number;
  cellsMentioned: number;
  enginesAttempted: number;
  enginesAnswered: number;
  engines: EngineSummary[];
}

export function clampLimit(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_HISTORY_LIMIT;
  return Math.min(Math.floor(n), MAX_HISTORY_LIMIT);
}

/**
 * A user's scans, newest first, with a per-scan engine breakdown.
 *
 * The engine breakdown is ONE grouped query over all returned scan ids rather
 * than one query per scan — same reasoning as the N+1 note in
 * app/api/admin/geo-scans/route.ts.
 *
 * Only source = 'public' rows are returned. Admin QA runs are excluded here
 * for the same reason they are excluded from the quota count: they are ours,
 * not the customer's, and showing them would make a customer's history read
 * as though we had been scanning on their account.
 */
export async function listUserScans(
  userId: string,
  limit: number = DEFAULT_HISTORY_LIMIT
): Promise<HistoryScan[]> {
  const scans = await db
    .select({
      id: geoScans.id,
      createdAt: geoScans.createdAt,
      utcDay: geoScans.utcDay,
      businessName: geoScans.businessName,
      websiteUrl: geoScans.websiteUrl,
      city: geoScans.city,
      identityResolved: geoScans.identityResolved,
      band: geoScans.band,
      score: geoScans.score,
      promptCount: geoScans.promptCount,
      cellsAnswered: geoScans.cellsAnswered,
      cellsMentioned: geoScans.cellsMentioned,
      enginesAttempted: geoScans.enginesAttempted,
      enginesAnswered: geoScans.enginesAnswered,
    })
    .from(geoScans)
    .where(and(eq(geoScans.userId, userId), eq(geoScans.source, 'public')))
    .orderBy(desc(geoScans.createdAt))
    .limit(limit);

  if (!scans.length) return [];

  const ids = scans.map((s) => s.id);
  const cellAgg = await db
    .select({
      scanId: geoScanCells.scanId,
      engine: geoScanCells.engine,
      total: sql<number>`count(*)::int`,
      ok: sql<number>`count(*) filter (where ${geoScanCells.errorMessage} is null and ${geoScanCells.skipped} = false)::int`,
      mentioned: sql<number>`count(*) filter (where ${geoScanCells.mentioned} = true)::int`,
    })
    .from(geoScanCells)
    .where(inArray(geoScanCells.scanId, ids))
    .groupBy(geoScanCells.scanId, geoScanCells.engine);

  const byScan = new Map<string, EngineSummary[]>();
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

  return scans.map((s) => ({
    ...s,
    engines: (byScan.get(s.id) ?? []).sort((a, b) => a.engine.localeCompare(b.engine)),
  }));
}

export interface ScanCell {
  id: string;
  engine: string;
  prompt: string;
  mentioned: boolean;
  matchedOn: unknown;
  snippet: string | null;
  citations: unknown;
  errorMessage: string | null;
  skipped: boolean;
}

/**
 * One scan owned by this user, with its full cell grid.
 *
 * Returns null when the scan does not exist OR is not this user's — the caller
 * cannot tell those apart, and must not: distinguishing them would confirm the
 * existence of another customer's scan id.
 */
export async function getUserScan(
  userId: string,
  scanId: string
): Promise<{ scan: HistoryScan; cells: ScanCell[] } | null> {
  const [scan] = await db
    .select({
      id: geoScans.id,
      createdAt: geoScans.createdAt,
      utcDay: geoScans.utcDay,
      businessName: geoScans.businessName,
      websiteUrl: geoScans.websiteUrl,
      city: geoScans.city,
      identityResolved: geoScans.identityResolved,
      band: geoScans.band,
      score: geoScans.score,
      promptCount: geoScans.promptCount,
      cellsAnswered: geoScans.cellsAnswered,
      cellsMentioned: geoScans.cellsMentioned,
      enginesAttempted: geoScans.enginesAttempted,
      enginesAnswered: geoScans.enginesAnswered,
    })
    .from(geoScans)
    // userId is part of the WHERE, not a check afterwards. See the file note.
    .where(
      and(
        eq(geoScans.id, scanId),
        eq(geoScans.userId, userId),
        eq(geoScans.source, 'public')
      )
    )
    .limit(1);

  if (!scan) return null;

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
    })
    .from(geoScanCells)
    .where(eq(geoScanCells.scanId, scan.id))
    .orderBy(asc(geoScanCells.engine), asc(geoScanCells.createdAt));

  const engineMap = new Map<string, EngineSummary>();
  for (const c of cells) {
    const e = engineMap.get(c.engine) ?? {
      engine: c.engine,
      total: 0,
      ok: 0,
      fail: 0,
      mentioned: 0,
    };
    e.total += 1;
    if (!c.errorMessage && !c.skipped) e.ok += 1;
    else e.fail += 1;
    if (c.mentioned) e.mentioned += 1;
    engineMap.set(c.engine, e);
  }

  return {
    scan: {
      ...scan,
      engines: [...engineMap.values()].sort((a, b) => a.engine.localeCompare(b.engine)),
    },
    cells,
  };
}
