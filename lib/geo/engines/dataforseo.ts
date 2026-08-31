import {
  cleanCitations,
  fetchWithTimeout,
  throwForStatus,
  type EngineAdapter,
  type EngineAnswer,
} from './shared';
import type { BusinessIdentity } from '../types';

/**
 * DataForSEO — Google AI Mode / AI Overview SERP.
 * Docs: https://dataforseo.com/apis/serp-api/google-ai-mode-serp-api
 *
 * Unlike the other four adapters this is not a chat model: it returns what
 * Google's AI Overview actually shows for a query. That makes it the
 * closest proxy to what a real searcher sees, which is why it is worth the
 * extra shape-handling below.
 *
 * Auth is HTTP Basic over DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD, per the
 * brief. Both must be present or the engine is treated as unconfigured.
 *
 * "live/advanced" is used so a scan completes inside one request. The
 * task_post/task_get queue would require polling and would not fit a
 * synchronous page load.
 */

const ENDPOINT =
  'https://api.dataforseo.com/v3/serp/google/ai_mode/live/advanced';

// This endpoint is slower than the chat engines — it is scraping a live
// SERP, not streaming tokens.
const TIMEOUT_MS = 45_000;

interface DfsItem {
  type?: string;
  text?: string;
  // AI Mode/Overview payloads nest references under a few different keys
  // depending on block type; all are optional.
  references?: { url?: string; source?: string }[];
  items?: DfsItem[];
}
interface DfsPayload {
  status_code?: number;
  status_message?: string;
  tasks?: {
    status_code?: number;
    status_message?: string;
    result?: {
      items?: DfsItem[];
    }[];
  }[];
}

/** Walk the nested item tree collecting text and reference URLs. */
function harvest(items: DfsItem[] | undefined, text: string[], urls: string[]): void {
  for (const item of items ?? []) {
    if (typeof item.text === 'string' && item.text.trim()) {
      text.push(item.text.trim());
    }
    for (const ref of item.references ?? []) {
      if (ref?.url) urls.push(ref.url);
    }
    if (Array.isArray(item.items)) harvest(item.items, text, urls);
  }
}

export const dataforseoAdapter: EngineAdapter = {
  id: 'dataforseo',

  isConfigured() {
    return Boolean(
      process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
    );
  },

  missingKeyReason() {
    return 'This engine is not configured on this environment.';
  },

  async run(prompt: string, identity: BusinessIdentity): Promise<EngineAnswer> {
    const login = process.env.DATAFORSEO_LOGIN as string;
    const password = process.env.DATAFORSEO_PASSWORD as string;
    const basic = Buffer.from(`${login}:${password}`).toString('base64');

    const res = await fetchWithTimeout(
      ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basic}`,
        },
        // DataForSEO expects an ARRAY of task objects, not a bare object.
        body: JSON.stringify([
          {
            keyword: prompt,
            language_code: 'en',
            // LOCATION — fixed 2026-08-30 after every cell failed with
            // status 40501 ("invalid field: one of the fields in the POST
            // request is invalid", confirmed against
            // https://docs.dataforseo.com/v3/appendix-errors/). Not an auth
            // failure — that is 40100, and the credentials ping returns 200.
            //
            // The previous value was location_name: "<City>,United States",
            // e.g. "Austin,United States". DataForSEO resolves location_name
            // against its own locations list, which uses "City,Region,Country"
            // ("Austin,Texas,United States"), so the two-part string matched
            // nothing and invalidated the whole task.
            //
            // Using location_code 2840 (United States) rather than rebuilding
            // the city string, deliberately: 2840 is a documented, stable
            // numeric identifier that cannot be malformed, whereas any
            // city string I cannot verify against their locations list is
            // another guess — and a second invalid guess costs another full
            // scan to discover.
            //
            // Losing city-level targeting costs less than it appears: the
            // prompts themselves already carry the locality ("What are the
            // best yoga studios IN DALLAS?"), so the local signal reaches
            // Google through the query text. Narrowing location_code to a
            // city is a refinement to make once a value is confirmed against
            // their locations endpoint, not a prerequisite.
            location_code: 2840,
            device: 'desktop',
          },
        ]),
      },
      TIMEOUT_MS
    );

    if (!res.ok) throwForStatus(res);

    const data = (await res.json()) as DfsPayload;

    // DataForSEO returns HTTP 200 with an error status_code in the body —
    // 20000 is success. Anything else is a failure that must NOT be scored
    // as "not mentioned".
    if (data.status_code && data.status_code !== 20000) {
      throw new Error(`SERP provider status ${data.status_code}.`);
    }
    const task = data.tasks?.[0];
    if (task?.status_code && task.status_code !== 20000) {
      throw new Error(`SERP task status ${task.status_code}.`);
    }

    const textParts: string[] = [];
    const urls: string[] = [];
    for (const result of task?.result ?? []) {
      harvest(result.items, textParts, urls);
    }

    const text = textParts.join('\n').trim();
    if (!text) {
      // No AI Overview shown for this query is a real, meaningful outcome —
      // but it is "no AI answer existed", not "you were not mentioned in
      // one". Treating it as unavailable keeps it out of the score.
      throw new Error('No AI Overview was returned for this query.');
    }

    return { text, citations: cleanCitations(urls) };
  },
};
