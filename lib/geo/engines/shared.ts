import type { BusinessIdentity, EngineId } from '../types';

/**
 * Shared plumbing for the five GEO answer-engine adapters.
 *
 * Contract every adapter follows:
 *   - `isConfigured()` reports whether its key(s) exist. Never throws,
 *     never reads a value into a log line.
 *   - `run()` resolves with { text, citations } or throws. The orchestrator
 *     turns a throw into an "unavailable" cell — never a false negative.
 *
 * Nothing here may log an API key, a full request body, or a response body
 * containing credentials. Error messages surfaced to the browser are
 * deliberately generic and status-code-only.
 */

export interface EngineAnswer {
  text: string;
  citations: string[];
}

export interface EngineAdapter {
  id: EngineId;
  isConfigured(): boolean;
  /** Human-safe reason shown when isConfigured() is false. */
  missingKeyReason(): string;
  run(prompt: string, identity: BusinessIdentity): Promise<EngineAnswer>;
}

/** Per-engine wall-clock ceiling. A slow engine must not hold the whole
 *  scan open — the user is waiting on a page load. */
export const ENGINE_TIMEOUT_MS = 25_000;

/**
 * fetch with an AbortController timeout.
 * Throws EngineError on timeout so the orchestrator can label the cell.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = ENGINE_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new EngineError('Timed out waiting for a response.');
    }
    throw new EngineError('Could not reach the service.');
  } finally {
    clearTimeout(timer);
  }
}

/** Error type whose message is always safe to show a user. */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/**
 * Turn a non-2xx into a safe error. The response BODY is deliberately not
 * included — provider error bodies sometimes echo the submitted key or
 * request headers, and this string ends up in the database and the browser.
 */
export function throwForStatus(res: Response): never {
  if (res.status === 401 || res.status === 403) {
    throw new EngineError('Authentication with this engine failed.');
  }
  if (res.status === 429) {
    throw new EngineError('Rate limited by this engine.');
  }
  throw new EngineError(`Engine returned HTTP ${res.status}.`);
}

/** Deduplicate and sanity-check citation URLs. */
export function cleanCitations(urls: (string | undefined | null)[]): string[] {
  const out = new Set<string>();
  for (const u of urls) {
    if (typeof u !== 'string') continue;
    const trimmed = u.trim();
    if (!/^https?:\/\//i.test(trimmed)) continue;
    out.add(trimmed);
    if (out.size >= 12) break;
  }
  return [...out];
}

/** Trim an engine answer down to a snippet for storage and display. */
export function toSnippet(text: string, max = 600): string {
  const collapsed = (text || '').replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The instruction wrapped around every prompt.
 *
 * Two things this must do, and one it must never do:
 *  - Ask for a normal recommendation answer with real named businesses.
 *  - Ask for websites, because a domain match is one of our two signals.
 *  - NEVER mention the business we are testing for. Naming it would
 *    guarantee a mention and make the whole score meaningless.
 */
export function wrapPrompt(prompt: string, identity: BusinessIdentity): string {
  const where = identity.city ? ` The user is in ${identity.city}.` : '';
  return (
    `${prompt}${where}\n\n` +
    'Answer as you normally would for someone asking this question. ' +
    'Name specific real businesses and include their website addresses where you know them.'
  );
}
