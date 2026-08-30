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
 * Gemini + Grounding with Google Search.
 * Docs: https://ai.google.dev/gemini-api/docs/google-search
 *
 * NOTE ON API SHAPE (checked against the docs 2026-08-29, do not "simplify"
 * this back): current Gemini grounding uses the INTERACTIONS API —
 * POST /v1beta/interactions with { model, input, tools: [{type:"google_search"}] }
 * — not generateContent with a groundingMetadata block. The response is a
 * `steps` array; the answer lives in the step of type "model_output", whose
 * content blocks carry inline `annotations` of type "url_citation".
 * Older `google_search_retrieval` tooling is for legacy models only.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

// Flash-class model with Search grounding support, per the supported-models
// table in the docs.
const MODEL = 'gemini-3.7-flash';

interface Annotation {
  type?: string;
  url?: string;
}
interface ContentBlock {
  type?: string;
  text?: string;
  annotations?: Annotation[];
}
interface Step {
  type?: string;
  content?: ContentBlock[];
}
interface InteractionsPayload {
  steps?: Step[];
  output_text?: string;
}

export const geminiAdapter: EngineAdapter = {
  id: 'gemini',

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  missingKeyReason() {
    return 'This engine is not configured on this environment.';
  },

  async run(prompt: string, identity: BusinessIdentity): Promise<EngineAnswer> {
    const key = process.env.GEMINI_API_KEY as string;

    const res = await fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        model: MODEL,
        input: wrapPrompt(prompt, identity),
        tools: [{ type: 'google_search' }],
      }),
    });

    if (!res.ok) throwForStatus(res);

    const data = (await res.json()) as InteractionsPayload;

    const textParts: string[] = [];
    const urls: string[] = [];

    for (const step of data.steps ?? []) {
      if (step.type !== 'model_output') continue;
      for (const block of step.content ?? []) {
        if (block.type === 'text' && block.text) textParts.push(block.text);
        for (const a of block.annotations ?? []) {
          if (a?.type === 'url_citation' && a.url) urls.push(a.url);
        }
      }
    }

    const text = (textParts.join('\n').trim() || data.output_text || '').trim();
    if (!text) throw new Error('Engine returned no usable answer.');

    return { text, citations: cleanCitations(urls) };
  },
};
