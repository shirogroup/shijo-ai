import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geoScanCells, geoScans, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { checkGeoMonthlyQuota, entitlementFor } from '@/lib/geo/entitlements';
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
//
// RAISED 120 -> 240 on 2026-08-30 on measured evidence, not caution. Two live
// five-engine scans took 93s and 108s — the second within 12s of the old 120s
// ceiling. Worse, DataForSEO was failing FAST in both runs (invalid location
// field), so its 8 cells cost almost nothing; once it actually returns AI
// Overviews those cells get slower, and the per-engine timeout also went
// 25s -> 45s. Both push the total up. At 120s the next scan was a coin flip
// on a 504, which fails the whole run rather than degrading gracefully.
//
// 240 is under Vercel's 300s platform maximum (Hobby and Pro alike, with
// Fluid compute). Do not raise it above 300.
export const maxDuration = 240;

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

    // Who is asking? A signed-in user is metered against their PLAN's monthly
    // allowance; an anonymous visitor stays on the per-IP day cap. These are
    // different controls: the IP cap stops abuse of a free public endpoint,
    // the plan cap meters a purchased allowance. A paying customer must not be
    // blocked by the anonymous control — otherwise two colleagues behind one
    // office IP would lock each other out of a plan they paid for.
    //
    // getSession() is deliberately allowed to fail soft: /geo is public first,
    // so a session lookup problem degrades the caller to anonymous rather than
    // breaking the page.
    let session: { userId: string } | null = null;
    try {
      session = await getSession();
    } catch {
      session = null;
    }

    let signedInUser: { id: string; planTier: string } | null = null;
    if (session) {
      const [u] = await db
        .select({ id: users.id, planTier: users.planTier })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      if (u) signedInUser = u;
    }

    // ── 2026-09-04 BUG FIX. Read this before simplifying it back. ────
    //
    // This used to be `if (signedInUser)`, unconditionally. A Free account has
    // monthlyScans: 0, and checkGeoMonthlyQuota refuses any plan whose
    // allowance is <= 0 with reason 'no_plan_allowance' — so a signed-in Free
    // user was handed a 402 and could not scan AT ALL, while a logged-out
    // visitor on the same machine got their scan. Signing up made the product
    // strictly worse, and it silently contradicted three things at once: this
    // module's own rule that "free -> same as anonymous", the pricing page's
    // "1 AI visibility scan per day" under the Free plan, and the entire ad
    // funnel, which pays to turn visitors into exactly those signed-in Free
    // accounts.
    //
    // The plan meter is for plans that HAVE an allowance. A Free account has
    // none, so it falls through to the same per-IP day cap as an anonymous
    // visitor — which is what "signing in on Free grants nothing extra" was
    // always meant to say.
    const hasPlanAllowance = signedInUser
      ? entitlementFor(signedInUser.planTier).monthlyScans > 0
      : false;

    if (signedInUser && hasPlanAllowance) {
      const quota = await checkGeoMonthlyQuota(signedInUser.id, signedInUser.planTier);
      if (!quota.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: quota.message,
            reason: quota.reason,
            upgradeUrl: quota.upgradeUrl,
            used: quota.used,
            limit: quota.limit,
          },
          // 402 Payment Required for a plan-allowance refusal — semantically
          // right, and distinguishable by the client from the 429 an
          // anonymous visitor gets. 503 only when we could not verify.
          { status: quota.reason === 'unavailable' ? 503 : 402 }
        );
      }
    }

    // Budget guard always applies. The per-IP day cap is skipped only for a
    // caller who was ALREADY metered against a paid allowance above — a $199
    // customer must not be locked out by a control meant for anonymous abuse.
    //
    // A signed-in Free user is deliberately NOT skipped: nothing metered them,
    // so the day cap is the only thing standing between the free checker and
    // unbounded spend across five paid APIs.
    const guard = await checkGuards(ip, plannedCost, new Date(), {
      skipIpCap: hasPlanAllowance,
    });
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
          // Null for anonymous visitors — that is the normal case on a public
          // endpoint, and it is what makes per-user monthly metering possible
          // for the signed-in ones.
          userId: signedInUser?.id ?? null,
          source: 'public',
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
