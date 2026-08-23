/**
 * Model pricing and per-generation cost.
 *
 * Added 2026-08-23. Before this, `usage_logs.api_cost_usd` existed in the
 * schema and was **never written** — every row read 0.0000 — and
 * `recordToolUsage` stored only `output_tokens`, discarding the input count
 * entirely. That combination made API spend impossible to reconstruct from the
 * app: input and output bill at different rates, and half the data was gone.
 *
 * It matters here more than it would elsewhere. This product charges per
 * activity, so unit economics are the business model: whether a $29 Standard
 * customer at 200 generations is profitable, which of the 12 tools is
 * expensive, and whether ENTERPRISE_FAIR_USE_CAP is set anywhere near the
 * right number — none of those were answerable.
 *
 * ⚠️ These rates are hard-coded and WILL go stale when the vendor changes
 * pricing. They are recorded per row at the time of the call (see
 * calculateCostUsd), so historical rows stay correct even after a rate change —
 * but this table must be updated when rates move, or new rows will be wrong.
 * Verify against the vendor's current published pricing before trusting a
 * month-end total.
 *
 * Rates are USD per 1,000,000 tokens.
 */

export interface ModelRate {
  inputPerMTok: number;
  outputPerMTok: number;
}

export const MODEL_PRICING: Record<string, ModelRate> = {
  'claude-haiku-4-5-20251001':  { inputPerMTok: 1.00, outputPerMTok: 5.00 },
  'claude-sonnet-4-5-20250929': { inputPerMTok: 3.00, outputPerMTok: 15.00 },
};

/** Used when a model id isn't in the table — assume the expensive one rather
 *  than silently under-reporting spend. */
const FALLBACK_RATE: ModelRate = { inputPerMTok: 3.00, outputPerMTok: 15.00 };

export function getRate(model: string): ModelRate {
  return MODEL_PRICING[model] ?? FALLBACK_RATE;
}

/** Cost of one generation in USD. Rounded to 4dp to match the column. */
export function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rate = getRate(model);
  const cost =
    (inputTokens / 1_000_000) * rate.inputPerMTok +
    (outputTokens / 1_000_000) * rate.outputPerMTok;
  return Math.round(cost * 10_000) / 10_000;
}

/** True when we're guessing the rate — surfaced in the admin view so a wrong
 *  total is visible rather than quietly plausible. */
export function isKnownModel(model: string): boolean {
  return model in MODEL_PRICING;
}
