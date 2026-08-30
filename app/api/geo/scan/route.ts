import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geoScanCells, geoScans } from '@/db/schema';
import { clientIpFrom } from '@/lib/rate-limit';
import { serverErrorResponse } from '@/lib/api/errors';
import { checkGuards, estimateScanCostUsd } from '@/lib/geo/budget';
import { configuredEngines, runScan } from '@/lib/geo/orchestrator';
import { resolveIdentity } from '@/lib/geo/places';
import { buildLocalPrompts, normalisePrompts } from '@/lib/geo/prompts';
import { ENGINE_IDS, MAX_PROMPTS } from '@/lib/geo/types';

export const runtime = 'nodejs';
// Fanning out to five engines can take a while; the default serverless
// budget is not enough for a full 5×8 grid.
export const maxDuration = 120;

/**
 * POST /api/geo/scan — public, unauthenticated.
 *
 * This is the only public endpoint in the app that spends money on
 * third-party APIs without a session behind it, so the ordering below is
 * deliberate and must not be rearranged:
 *
 *   1. Validate input.
 *   2. Resolve identity (Places) — cheap, and needed to build prompts.
 *   3. Check per-IP cap AND daily budget.
 *   4. ONLY THEN fan out to the answer engines.
 *
 * Steps 3 and 4 must stay in that order: when a cap trips, the response is
 * a message and ZERO engine calls are made.
 */

const MAX_FIELD_LEN = 200;

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFrom(req.headers);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest('Invalid request.');
    }

    const raw = (body ?? {}) as Record<string, unknown>;
    const businessName = String(raw.businessName ?? '').trim();
    const websiteUrl = String(raw.websiteUrl ?? '').trim();
    const city = String(raw.city ?? '').trim();

    if (!businessName) return badRequest('Please enter a business name.');
    if (!city) return badRequest('Please enter a city.');
    if (
      businessName.length > MAX_FIELD_LEN ||
      city.length > MAX_FIELD_LEN ||
      websiteUrl.length > 500
    ) {
      return badRequest('One or more fields is too long.');
    }

    // ── 2. Identity ──────────────────────────────────────────────────
    // Never throws; falls back to the raw input with resolved:false.
    const identity = await resolveIdentity({ businessName, websiteUrl, city });

    const supplied = normalisePrompts(raw.prompts);
    const prompts = supplied.length ? supplied : buildLocalPrompts(identity);

    if (!prompts.length) {
      return badRequest('Could not build any prompts for that business.');
    }

    // ── 3. Guards, BEFORE any paid call ──────────────────────────────
    const engines = configuredEngines();
    const plannedCost = estimateScanCostUsd(
      engines.length ? engines : ENGINE_IDS,
      Math.min(prompts.length, MAX_PROMPTS)
    );

    const guard = await checkGuards(ip, plannedCost);
    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.message, reason: guard.reason },
        // 429 for the rate/budget caps, 503 when we could not verify them.
        { status: guard.reason === 'unavailable' ? 503 : 429 }
      );
    }

    // If literally nothing is configured, say so plainly rather than
    // returning an all-blank grid that reads like "you are invisible".
    if (!engines.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The checker is not configured on this environment yet. No engines are available.',
          reason: 'no_engines',
        },
        { status: 503 }
      );
    }

    // ── 4. Fan out ───────────────────────────────────────────────────
    const result = await runScan({ identity, prompts });

    // ── Persist. A DB failure must not lose the user their results, so
    // this is best-effort and the response is returned either way.
    let scanId: string | null = null;
    try {
      const [row] = await db
        .insert(geoScans)
        .values({
          businessName,
          websiteUrl: websiteUrl || null,
          city,
          domain: identity.domain,
          placeId: identity.placeId,
          resolvedName: identity.resolved ? identity.displayName : null,
          placeTypes: identity.types,
          identityResolved: identity.resolved,
          // Persist null, never 0, for bands where we deliberately withheld a
          // number. Storing a real 0 here would later chart as "this business
          // was invisible" when what actually happened is we could not measure.
          score:
            result.score.band === 'insufficient' || result.score.band === 'unverified'
              ? null
              : result.score.score,
          band: result.score.band,
          promptCount: prompts.length,
          cellsAnswered: result.score.answered,
          cellsMentioned: result.score.mentions,
          enginesAttempted: result.score.enginesAttempted,
          enginesAnswered: result.score.enginesAnswered,
          ipAddress: ip,
          utcDay: guard.utcDay,
          estimatedCostUsd: String(plannedCost),
          durationMs: result.durationMs,
        })
        .returning({ id: geoScans.id });

      scanId = row?.id ?? null;

      if (scanId && result.cells.length) {
        await db.insert(geoScanCells).values(
          result.cells.map((c) => ({
            scanId: scanId as string,
            engine: c.engine,
            prompt: c.prompt,
            mentioned: c.mentioned,
            matchedOn: c.matchedOn,
            snippet: c.snippet || null,
            citations: c.citations,
            errorMessage: c.error ?? null,
            skipped: Boolean(c.skipped),
            latencyMs: c.latencyMs ?? null,
          }))
        );
      }
    } catch (err) {
      // Logged, not surfaced. The user still gets their scan.
      console.error('[geo] failed to persist scan:', err);
    }

    return NextResponse.json({ success: true, ...result, scanId });
  } catch (error) {
    return serverErrorResponse('GEO', 'GEO scan failed', error);
  }
}
