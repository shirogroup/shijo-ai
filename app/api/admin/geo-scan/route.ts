import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geoScanCells, geoScans, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { adminScanKey, checkAdminGuards } from '@/lib/geo/admin';
import { estimateScanCostUsd } from '@/lib/geo/budget';
import { configuredEngines, runScan } from '@/lib/geo/orchestrator';
import { resolveIdentity } from '@/lib/geo/places';
import { buildLocalPrompts, normalisePrompts } from '@/lib/geo/prompts';
import { ENGINE_IDS, MAX_PROMPTS } from '@/lib/geo/types';

export const runtime = 'nodejs';
// RAISED 120 -> 240 on 2026-08-30, matching app/api/geo/scan/route.ts. The
// two routes run the identical pipeline, so their ceilings must move together
// — an admin QA scan that survives where the public one dies would hide the
// exact failure QA exists to catch. Measured runs: 93s and 108s. Under
// Vercel's 300s platform maximum; do not raise above 300.
export const maxDuration = 240;

/**
 * Admin-only GEO test scan.
 *
 * WHAT IT BYPASSES AND WHAT IT DOES NOT
 *   Bypasses: the public one-scan-per-IP-per-UTC-day cap. That cap exists to
 *             stop anonymous abuse of a free public endpoint; it is not a
 *             money control and it should not obstruct QA.
 *   Honours:  GEO_DAILY_BUDGET_USD (shared with public scans) AND a separate
 *             GEO_ADMIN_DAILY_SCAN_CAP, default 5. Both are money controls.
 *             An admin holding down a button must not be able to spend the
 *             day's budget.
 *
 * Both guards run BEFORE any engine call, exactly like the public route. Do
 * not reorder: when a cap trips the response must cost nothing.
 *
 * The public route (app/api/geo/scan/route.ts) is untouched by this file. This
 * is a second, separately-gated entry point into the same pipeline, not a flag
 * on the existing one — so there is no way for an admin-only code path to
 * change what a visitor experiences.
 */

const MAX_FIELD_LEN = 200;

export async function POST(req: NextRequest) {
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    }
    const raw = (body ?? {}) as Record<string, unknown>;
    const businessName = String(raw.businessName ?? '').trim();
    const websiteUrl = String(raw.websiteUrl ?? '').trim();
    const city = String(raw.city ?? '').trim();

    if (!businessName) {
      return NextResponse.json({ success: false, error: 'Business name is required.' }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ success: false, error: 'City is required.' }, { status: 400 });
    }
    if (businessName.length > MAX_FIELD_LEN || city.length > MAX_FIELD_LEN || websiteUrl.length > 500) {
      return NextResponse.json({ success: false, error: 'One or more fields is too long.' }, { status: 400 });
    }

    const identity = await resolveIdentity({ businessName, websiteUrl, city });
    const supplied = normalisePrompts(raw.prompts);
    const prompts = supplied.length ? supplied : buildLocalPrompts(identity);
    if (!prompts.length) {
      return NextResponse.json(
        { success: false, error: 'Could not build any prompts for that business.' },
        { status: 400 }
      );
    }

    // ── Money guards, before anything is spent ───────────────────────
    const engines = configuredEngines();
    const plannedCost = estimateScanCostUsd(
      engines.length ? engines : ENGINE_IDS,
      Math.min(prompts.length, MAX_PROMPTS)
    );

    const guard = await checkAdminGuards(plannedCost);
    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.message, reason: guard.reason },
        { status: guard.reason === 'unavailable' ? 503 : 429 }
      );
    }

    if (!engines.length) {
      return NextResponse.json(
        {
          success: false,
          reason: 'no_engines',
          error: 'No engines are configured on this environment. Run the vendor pings to see which credentials are missing.',
        },
        { status: 503 }
      );
    }

    const result = await runScan({ identity, prompts });

    // Persist. Best-effort: a write failure must not cost the admin the run.
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
          // Marker instead of a real IP — see lib/geo/admin.ts. Also the key
          // the admin daily cap counts, and it keeps admin runs out of the
          // public per-IP cap entirely.
          ipAddress: adminScanKey(requester.id),
          // source is now authoritative; the ip_address marker is still
          // written so old rows and new rows classify identically.
          userId: requester.id,
          source: 'admin',
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
      console.error('[geo-admin] failed to persist admin scan:', err);
    }

    return NextResponse.json({ success: true, ...result, scanId, isAdminScan: true });
  } catch (error) {
    return serverErrorResponse('GEOADM', 'Admin GEO scan failed', error);
  }
}
