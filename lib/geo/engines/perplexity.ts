import {
  cleanCitations,
  fetchWithTimeout,
  throwForStatus,
  wrapPrompt,
  type EngineAdapter,
  type EngineAnswer,
} from './shared';
import type { BusinessIdentity } from '../types';

/**
 * Perplexity Sonar (OpenAI-compatible chat completions).
 * Docs: https://docs.perplexity.ai/docs/sonar/quickstart
 *
 * Per instruction this uses SONAR, not the Agent API (/v1/agent).
 *
 * ⚠️ DEPRECATION, flagged rather than silently absorbed: Perplexity's own
 * docs now carry a notice that "Sonar Chat Completions is now Agent API"
 * and that Sonar is supported until 2026-09-27. That is under a month from
 * this file's creation date (2026-08-29). This adapter will keep working
 * until then and will start failing after — at which point it degrades to
 * an "unavailable" cell rather than breaking the page, but the Perplexity
 * column will go dark. Migrating to the Agent API is a known follow-up and
 * was explicitly out of scope for this pass.
 *
 * search_context_size is pinned to 'low' per the brief — cheapest tier.
 */

const ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar';

interface SonarPayload {
  choices?: { message?: { content?: string } }[];
  citations?: string[];
  search_results?: { url?: string }[];
}

export const perplexityAdapter: EngineAdapter = {
  id: 'perplexity',

  isConfigured() {
    return Boolean(process.env.PERPLEXITY_API_KEY);
  },

  missingKeyReason() {
    return 'This engine is not configured on this environment.';
  },

  async run(prompt: string, identity: BusinessIdentity): Promise<EngineAnswer> {
    const key = process.env.PERPLEXITY_API_KEY as string;

    const res = await fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: wrapPrompt(prompt, identity) }],
        web_search_options: { search_context_size: 'low' },
      }),
    });

    if (!res.ok) throwForStatus(res);

    const data = (await res.json()) as SonarPayload;
    const text = (data.choices?.[0]?.message?.content ?? '').trim();
    if (!text) throw new Error('Engine returned no usable answer.');

    // Sonar returns both a flat `citations` array of URLs and a richer
    // `search_results` array. Merge them — either can be absent.
    // cleanCitations() already drops null/undefined and non-http entries,
    // so no pre-filtering is needed here.
    const urls: (string | undefined)[] = [
      ...(data.citations ?? []),
      ...(data.search_results ?? []).map((r) => r?.url),
    ];

    return { text, citations: cleanCitations(urls) };
  },
};
