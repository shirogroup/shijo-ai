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
 * Claude Messages API + server-side web_search tool.
 * Docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
 *
 * Reuses the EXISTING ANTHROPIC_API_KEY already used by the 12 dashboard
 * tools. Per instruction this variable is read only — never renamed,
 * never removed, never logged.
 *
 * max_uses is pinned to 1: this checker fans out across 5 engines × up to
 * 8 prompts, and web search is billed per search ($10/1,000). One search
 * per cell keeps the worst case bounded and predictable.
 */

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

// Haiku-class per the brief. Same model id the existing /api/generate route
// uses for its fast tier, so there is one fewer model string to keep in sync.
const MODEL = 'claude-haiku-4-5-20251001';

interface TextBlock {
  type: 'text';
  text?: string;
  citations?: { type?: string; url?: string }[];
}
interface SearchResultBlock {
  type: 'web_search_tool_result';
  content?: unknown;
}
type ContentBlock = TextBlock | SearchResultBlock | { type: string };

interface MessagesResponse {
  content?: ContentBlock[];
}

export const claudeAdapter: EngineAdapter = {
  id: 'claude',

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  missingKeyReason() {
    return 'This engine is not configured on this environment.';
  },

  async run(prompt: string, identity: BusinessIdentity): Promise<EngineAnswer> {
    const key = process.env.ANTHROPIC_API_KEY as string;

    const res = await fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: wrapPrompt(prompt, identity) }],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 1,
            // Localises results the way a real local searcher would see
            // them. Only city is supplied because that is all the form
            // collects — region/country are left out rather than guessed.
            ...(identity.city
              ? { user_location: { type: 'approximate', city: identity.city } }
              : {}),
          },
        ],
      }),
    });

    if (!res.ok) throwForStatus(res);

    const data = (await res.json()) as MessagesResponse;
    const blocks = Array.isArray(data.content) ? data.content : [];

    const textParts: string[] = [];
    const urls: string[] = [];

    for (const block of blocks) {
      if (block.type !== 'text') continue;
      const t = block as TextBlock;
      if (t.text) textParts.push(t.text);
      for (const c of t.citations ?? []) {
        if (c?.url) urls.push(c.url);
      }
    }

    // A search that errors server-side still returns HTTP 200 with a
    // web_search_tool_result_error block. If that left us with no text at
    // all, treat it as unavailable rather than as "no mention" — scoring a
    // failed search as a negative would be a fabricated result.
    const text = textParts.join('\n').trim();
    if (!text) {
      throw new Error('Engine returned no usable answer.');
    }

    return { text, citations: cleanCitations(urls) };
  },
};
