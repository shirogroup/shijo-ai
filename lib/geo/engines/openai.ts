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
 * OpenAI Responses API + web_search tool.
 * Docs: https://platform.openai.com/docs/guides/tools-web-search
 *
 * search_context_size is pinned to 'low' to sit on the cheapest web-search
 * billing tier — this is a free public checker fanning out across five
 * engines, so context size is the main cost lever. Verify the tier against
 * current OpenAI pricing before raising it.
 */

const ENDPOINT = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4.1-mini';

interface Annotation {
  type?: string;
  url?: string;
}
interface ContentPart {
  type?: string;
  text?: string;
  annotations?: Annotation[];
}
interface OutputItem {
  type?: string;
  content?: ContentPart[];
}
interface ResponsesPayload {
  output?: OutputItem[];
  output_text?: string;
}

export const openaiAdapter: EngineAdapter = {
  id: 'openai',

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  missingKeyReason() {
    return 'This engine is not configured on this environment.';
  },

  async run(prompt: string, identity: BusinessIdentity): Promise<EngineAnswer> {
    const key = process.env.OPENAI_API_KEY as string;

    const res = await fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: wrapPrompt(prompt, identity),
        tools: [
          {
            type: 'web_search',
            search_context_size: 'low',
            ...(identity.city
              ? {
                  user_location: {
                    type: 'approximate',
                    city: identity.city,
                  },
                }
              : {}),
          },
        ],
      }),
    });

    if (!res.ok) throwForStatus(res);

    const data = (await res.json()) as ResponsesPayload;

    const textParts: string[] = [];
    const urls: string[] = [];

    for (const item of data.output ?? []) {
      for (const part of item.content ?? []) {
        if (part.text) textParts.push(part.text);
        for (const a of part.annotations ?? []) {
          if (a?.type === 'url_citation' && a.url) urls.push(a.url);
        }
      }
    }

    // Fall back to the flattened convenience field if the structured walk
    // found nothing — shape varies with tool/model combination.
    const text = (textParts.join('\n').trim() || data.output_text || '').trim();
    if (!text) throw new Error('Engine returned no usable answer.');

    return { text, citations: cleanCitations(urls) };
  },
};
