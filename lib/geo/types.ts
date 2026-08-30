/**
 * Shared types for the public GEO (Generative Engine Optimization) checker
 * served at /geo.
 *
 * Scope note (read before extending): /geo is a PUBLIC, unauthenticated,
 * free checker. It is deliberately NOT one of the 12 dashboard tools —
 * lib/tools/registry.ts stays at exactly 12 entries so every "12 tools"
 * claim in public copy, metadata, JSON-LD and the welcome email stays
 * true. Do not add a 13th registry entry without also updating that copy,
 * which currently sits behind an ads freeze.
 *
 * This module is types only — no runtime imports, so it is safe to import
 * from both client and server components.
 */

/** The five answer engines a scan can query. */
export type EngineId =
  | 'openai'
  | 'gemini'
  | 'perplexity'
  | 'claude'
  | 'dataforseo';

export const ENGINE_IDS: EngineId[] = [
  'openai',
  'gemini',
  'perplexity',
  'claude',
  'dataforseo',
];

/** Customer-facing engine labels. Deliberately vendor-neutral where the
 *  product rule requires it: the AI vendor behind the 12 dashboard tools
 *  must not be named in marketing copy. These labels describe engines the
 *  user is asking us to QUERY on their behalf, which is a different thing
 *  and is why naming them here is correct — the user needs to know which
 *  surface was checked for the result to mean anything. */
export const ENGINE_LABELS: Record<EngineId, string> = {
  openai: 'ChatGPT Search',
  gemini: 'Google Gemini',
  perplexity: 'Perplexity',
  claude: 'Claude',
  dataforseo: 'Google AI Overview',
};

/** Identity resolved from Google Places, used to decide what counts as a
 *  "mention" and to build local prompts. */
export interface BusinessIdentity {
  /** Places resource id, e.g. "places/ChIJ..." */
  placeId: string | null;
  /** Canonical display name from Places, or the user's input if unresolved. */
  displayName: string;
  formattedAddress: string | null;
  /** Places type strings, e.g. ["yoga_studio", "gym"]. */
  types: string[];
  googleMapsUri: string | null;
  /** Bare host from the submitted website, lowercased, no www. */
  domain: string | null;
  city: string;
  /** True when Places actually resolved the business; false when we fell
   *  back to the raw form input (missing key, no match, or API failure). */
  resolved: boolean;
  /** Human-readable reason when resolved === false. Never contains secrets. */
  unresolvedReason?: string;
}

/** One engine's answer to one prompt. */
export interface ScanCell {
  engine: EngineId;
  prompt: string;
  /** Name or domain appeared in the answer text. */
  mentioned: boolean;
  /** Which signal matched — useful for showing the user WHY we scored it. */
  matchedOn: ('name' | 'domain')[];
  /** Trimmed excerpt of the engine's answer. Never the full response. */
  snippet: string;
  /** URLs the engine cited, deduped. */
  citations: string[];
  /** Set when this engine/prompt failed. A failed cell renders as
   *  "unavailable", never as a false negative — a missing answer is not
   *  evidence of absence, and showing it as "not mentioned" would be a
   *  fabricated result. */
  error?: string;
  /** Engine was skipped because its API key is not configured. */
  skipped?: boolean;
  latencyMs?: number;
}

export interface EngineSummary {
  engine: EngineId;
  label: string;
  /** Cells where mentioned === true. */
  mentions: number;
  /** Cells that returned a usable answer (success, error or not). */
  answered: number;
  /** Cells that errored or were skipped. */
  unavailable: number;
  /** null when the engine produced no usable answers at all — distinct
   *  from 0, which means "answered and never mentioned you". */
  rate: number | null;
  configured: boolean;
}

export interface ScanScore {
  /** 0-100, computed only over cells that actually answered. */
  score: number;
  /** Total cells that answered. */
  answered: number;
  /** Total cells that mentioned the business. */
  mentions: number;
  /** Engines that returned at least one usable answer. */
  enginesAnswered: number;
  /** Engines asked for. */
  enginesAttempted: number;
  /** Plain-language band for the UI. */
  band: 'strong' | 'moderate' | 'weak' | 'absent' | 'insufficient';
}

export interface ScanResult {
  scanId: string | null;
  identity: BusinessIdentity;
  prompts: string[];
  cells: ScanCell[];
  engines: EngineSummary[];
  score: ScanScore;
  /** Engines that could not run at all this scan, with a safe reason. */
  degraded: { engine: EngineId; label: string; reason: string }[];
  startedAt: string;
  durationMs: number;
}

export interface ScanRequest {
  businessName: string;
  websiteUrl: string;
  city: string;
  /** Optional caller-supplied prompts. Empty/absent → generated locally. */
  prompts?: string[];
}

/** Hard caps. These are product limits, not tuning knobs — raising
 *  MAX_PROMPTS multiplies cost by engine count. */
export const MAX_PROMPTS = 8;
export const SCANS_PER_IP_PER_UTC_DAY = 1;
export const MAX_CONCURRENT_ENGINES = 3;

/** Rough per-call cost estimates in USD, used only to stop the day's spend
 *  crossing GEO_DAILY_BUDGET_USD. These are intentionally conservative
 *  (over-estimates) — the budget guard should trip early rather than late.
 *  They are NOT billing figures and must never be shown to a user as a
 *  price. */
export const ENGINE_COST_ESTIMATE_USD: Record<EngineId, number> = {
  openai: 0.012,
  gemini: 0.006,
  perplexity: 0.006,
  claude: 0.008,
  dataforseo: 0.003,
};
