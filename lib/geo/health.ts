import { fetchWithTimeout } from './engines/shared';
import { ENGINE_LABELS, type EngineId } from './types';

/**
 * Vendor connectivity pings for the admin GEO health page.
 *
 * Purpose: answer "is this key actually valid RIGHT NOW", which nothing else
 * can. A key's presence in the Vercel dashboard proves only that a string
 * exists. These make one tiny request per vendor and report the HTTP status.
 *
 * DELIBERATELY SEPARATE from lib/geo/engines/*. Those adapters sit on the live
 * public /geo path; this file is admin-only diagnostics. Keeping them apart
 * means a change here can never alter what a visitor experiences. The small
 * duplication of endpoint URLs is the price, and it is worth paying.
 *
 * COST: most of these are free (auth-check endpoints). Perplexity and Places
 * have no free validation endpoint, so those two cost a fraction of a cent per
 * ping. The UI says so.
 *
 * SECURITY: never returns a response body, only status + a coarse error class.
 * Vendor error bodies sometimes echo the submitted key.
 */

const PING_TIMEOUT_MS = 12_000;

export type VendorId = EngineId | 'places';

export const VENDOR_LABELS: Record<VendorId, string> = {
  ...ENGINE_LABELS,
  places: 'Google Places',
};

/** Free = no per-call charge for the ping itself. */
export const PING_IS_FREE: Record<VendorId, boolean> = {
  openai: true,
  gemini: true,
  claude: false,
  perplexity: false,
  dataforseo: true,
  places: false,
};

export interface PingResult {
  vendor: VendorId;
  label: string;
  configured: boolean;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  /** Coarse class only — never a raw provider message. */
  errorClass:
    | null
    | 'not_configured'
    | 'auth_failed'
    | 'rate_limited'
    | 'timeout'
    | 'network'
    | 'bad_status'
    | 'unexpected';
  freePing: boolean;
}

function classify(status: number): PingResult['errorClass'] {
  if (status === 401 || status === 403) return 'auth_failed';
  if (status === 429) return 'rate_limited';
  return 'bad_status';
}

async function timed(
  vendor: VendorId,
  configured: boolean,
  run: () => Promise<Response>
): Promise<PingResult> {
  const base = {
    vendor,
    label: VENDOR_LABELS[vendor],
    configured,
    freePing: PING_IS_FREE[vendor],
  };
  if (!configured) {
    return { ...base, ok: false, httpStatus: null, latencyMs: null, errorClass: 'not_configured' };
  }
  const t0 = Date.now();
  try {
    const res = await run();
    const latencyMs = Date.now() - t0;
    return {
      ...base,
      ok: res.ok,
      httpStatus: res.status,
      latencyMs,
      errorClass: res.ok ? null : classify(res.status),
    };
  } catch (err) {
    const latencyMs = Date.now() - t0;
    const isTimeout =
      err instanceof Error && /timed out/i.test(err.message);
    // Logged server-side only; never returned.
    console.error(`[geo-health] ${vendor} ping failed:`, err);
    return {
      ...base,
      ok: false,
      httpStatus: null,
      latencyMs,
      errorClass: isTimeout ? 'timeout' : 'network',
    };
  }
}

export async function pingAll(): Promise<PingResult[]> {
  const {
    OPENAI_API_KEY,
    GEMINI_API_KEY,
    PERPLEXITY_API_KEY,
    ANTHROPIC_API_KEY,
    DATAFORSEO_LOGIN,
    DATAFORSEO_PASSWORD,
    GOOGLE_PLACES_API_KEY,
  } = process.env;

  const jobs: Promise<PingResult>[] = [
    // Free: model list is an auth check with no inference cost.
    timed('openai', Boolean(OPENAI_API_KEY), () =>
      fetchWithTimeout(
        'https://api.openai.com/v1/models',
        { method: 'GET', headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } },
        PING_TIMEOUT_MS
      )
    ),

    // Free: model list.
    timed('gemini', Boolean(GEMINI_API_KEY), () =>
      fetchWithTimeout(
        'https://generativelanguage.googleapis.com/v1beta/models',
        { method: 'GET', headers: { 'x-goog-api-key': GEMINI_API_KEY as string } },
        PING_TIMEOUT_MS
      )
    ),

    // Not free: no auth-only endpoint exists, so this is a 1-token completion.
    timed('perplexity', Boolean(PERPLEXITY_API_KEY), () =>
      fetchWithTimeout(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
        },
        PING_TIMEOUT_MS
      )
    ),

    // Not free, but ~1 token. No tools, so no web-search charge.
    timed('claude', Boolean(ANTHROPIC_API_KEY), () =>
      fetchWithTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY as string,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        },
        PING_TIMEOUT_MS
      )
    ),

    // Free: account-info endpoint, validates Basic auth without a SERP task.
    timed('dataforseo', Boolean(DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD), () =>
      fetchWithTimeout(
        'https://api.dataforseo.com/v3/appendix/user_data',
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`
            ).toString('base64')}`,
          },
        },
        PING_TIMEOUT_MS
      )
    ),

    // Not free: Places bills per Text Search. Smallest possible query.
    timed('places', Boolean(GOOGLE_PLACES_API_KEY), () =>
      fetchWithTimeout(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY as string,
            'X-Goog-FieldMask': 'places.id',
          },
          body: JSON.stringify({ textQuery: 'coffee', maxResultCount: 1 }),
        },
        PING_TIMEOUT_MS
      )
    ),
  ];

  return Promise.all(jobs);
}

/** Config strip: which vendors have credentials. Names only, never values. */
export function vendorConfiguration(): { vendor: VendorId; label: string; configured: boolean }[] {
  return [
    { vendor: 'openai' as const, configured: Boolean(process.env.OPENAI_API_KEY) },
    { vendor: 'gemini' as const, configured: Boolean(process.env.GEMINI_API_KEY) },
    { vendor: 'perplexity' as const, configured: Boolean(process.env.PERPLEXITY_API_KEY) },
    { vendor: 'claude' as const, configured: Boolean(process.env.ANTHROPIC_API_KEY) },
    {
      vendor: 'dataforseo' as const,
      configured: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
    },
    { vendor: 'places' as const, configured: Boolean(process.env.GOOGLE_PLACES_API_KEY) },
  ].map((v) => ({ ...v, label: VENDOR_LABELS[v.vendor] }));
}
