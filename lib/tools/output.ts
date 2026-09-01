/**
 * Post-processing for model output.
 *
 * Added 2026-08-23 after a live test found the SEO Meta Generator stating a
 * character count for every title tag and getting **every one of them wrong**:
 *
 *   claimed 58 / 56 / 57 / 54 / 60  →  actual 52 / 44 / 43 / 39 / 47
 *
 * Meta descriptions were accurate to ±1; titles were overstated by 6–15
 * characters every time. Language models are unreliable character counters,
 * so the fix is not a better prompt — it is to stop asking. The model writes
 * the copy; the count is computed here, deterministically, from the string
 * the user will actually paste into their page.
 *
 * This matters more than it looks: the entire job of that tool is landing
 * inside Google's ~60-character title budget. A user trusting "60" on a title
 * that is really 47 leaves 13 characters of keyword space unused on every
 * page they publish.
 */

// Matches e.g.  **Title Tag (58 characters):**   or   - **Title Tag (58 chars):**
const COUNT_CLAIM = /(\(\s*)(\d+)(\s*(?:characters|chars)\s*\))/i;

// Matches a label that names what is being measured but states no number:
//   "Title Tag:"   "**Meta Description:**"   "- Title Tag :"
// Capture 1 is everything up to the colon, capture 2 is the trailing decoration.
const BARE_LABEL = /^(\s*[-*+]?\s*\**\s*(?:Title Tag|Meta Description))\s*:(\**\s*)$/i;

/** Strip the decoration a model puts around a line so we count the real text. */
function unwrap(line: string): string {
  return line
    .trim()
    .replace(/^[-*+]\s+/, '')       // list bullet
    .replace(/^`+|`+$/g, '')        // code ticks
    .replace(/^\*\*|\*\*$/g, '')    // bold
    .replace(/^["'"']|["'"']$/g, '') // quotes, straight and curly
    .trim();
}

/**
 * Tools whose output has a real, hard character budget worth stating.
 *
 * Scoped deliberately. When this ran over every tool, the arithmetic was right
 * 61 times out of 61 — but in the Ad Headline A/B tester it was measuring the
 * WRONG STRING. That tool writes the label between the headline and its
 * rationale:
 *
 *     **Headline 1: The Yoga Secret Dallas Beginners Won't Tell**
 *     (130 characters)
 *     Why it works: Creates intrigue by positioning yoga as ...
 *
 * "the next non-empty line" is the rationale, so a 43-character headline was
 * labelled 130 — over every platform's headline cap. A correct number attached
 * to the wrong thing is worse than no number: before this feature existed that
 * tool simply didn't claim a length. Title tags and meta descriptions have one
 * unambiguous format and a genuine SERP limit; ad headlines vary per platform
 * and have no stable format here. So the mechanism lives where it is safe, and
 * ACCURACY_GUARD tells every other tool not to state lengths at all.
 */
const COUNTED_TOOLS = new Set(['seo-meta-generator']);

export function toolStatesCharacterCounts(toolId: string): boolean {
  return COUNTED_TOOLS.has(toolId);
}

/**
 * Rewrite every "(N characters)" claim so N is the true length of the line
 * that follows it. Only called for tools in COUNTED_TOOLS.
 */
export function correctCharacterCounts(text: string): string {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const hasClaim = COUNT_CLAIM.test(lines[i]);

    // D-35: the model does not reliably emit the "(N characters)" label, so we
    // cannot only *rewrite* it — we must also be able to *insert* it. A bare
    // "Title Tag:" / "Meta Description:" heading is treated as a label with a
    // missing number. Without this the whole mechanism is a coin flip: across
    // five live runs the label appeared on three.
    const bare = hasClaim ? null : lines[i].match(BARE_LABEL);
    if (!hasClaim && !bare) continue;

    // The counted string is the next non-empty line.
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;

    const actual = unwrap(lines[j]).length;
    if (actual === 0) continue;

    lines[i] = hasClaim
      ? lines[i].replace(COUNT_CLAIM, `$1${actual}$3`)
      : lines[i].replace(BARE_LABEL, `$1 (${actual} characters):$2`);
  }

  return lines.join('\n');
}

/**
 * Appended to every prompt. A live test had the meta generator assert
 * "with certified instructors" for a yoga studio that never claimed any
 * certification, and "Expert guidance, affordable pricing" for a business
 * that supplied neither. Scarcity puffery is ordinary marketing; inventing a
 * credential on a customer's behalf is something they then have to stand
 * behind in public.
 */
export const ACCURACY_GUARD = `

IMPORTANT — factual constraints:
- Use ONLY the facts given above. Do not invent credentials, certifications,
  qualifications, awards, ratings, review counts, years in business, customer
  numbers, or guarantees that were not supplied.
- Do not state scarcity ("limited spots", "filling fast") unless the input says so.
- Do NOT invent COMMERCIAL OR CONTRACTUAL TERMS. Never write "free trial",
  "no credit card required", "cancel anytime", "no contracts", "money-back
  guarantee", "risk-free", "refund", "set up in minutes", a discount, or any
  billing, trial or cancellation term unless the input states it. These are
  promises the business has to honour.
- Do NOT invent SOCIAL PROOF. Never write "trusted by", "used by", "loved by",
  "join thousands", "rated 5 stars", or any count of customers, teams or
  companies unless the input supplies the number.
- Where a detail would strengthen the copy but was not provided, leave a clearly
  marked placeholder such as [YOUR CREDENTIAL] or [YOUR TRIAL TERMS] rather than
  inventing one.`;

/**
 * Why the two clauses above exist (added 2026-09-01).
 *
 * The original guard covered credentials, awards, ratings and counts — the
 * failure found in the first live run ("with certified instructors" for a yoga
 * studio that never claimed any). A later run against a B2B SaaS scenario found
 * the guard had a hole, and it was a worse one.
 *
 * Landing Page Copy invented COMMERCIAL TERMS on 3 of 3 runs across three
 * unrelated verticals, none of which supplied any:
 *
 *   "No credit card required • Set up in minutes • $89 per user per month after trial"
 *   "No credit card required to start your free trial. Cancel anytime with no
 *    penalties or long-term contracts."
 *   "Just $35/month. No credit card required to start."
 *
 * plus invented social proof: "Trusted by fleet managers running 20-200 vehicles."
 *
 * A fabricated credential embarrasses the customer. A fabricated cancellation
 * or trial term is a promise their buyers can hold them to — published on their
 * own landing page, by software they bought to write it. That is a consumer-
 * protection problem we would have handed them.
 *
 * Landing Page Copy is the tool most exposed to this, because offer terms are
 * exactly what landing pages are made of — but the guard is global on purpose:
 * ad copy and email sequences reach for the same phrases.
 */


/**
 * Appended ONLY to tools that are NOT in COUNTED_TOOLS.
 *
 * D-35 (2026-08-23 retest): this clause used to live inside ACCURACY_GUARD, which
 * is appended to every prompt — including seo-meta-generator, whose LENGTH_LABEL_GUARD
 * asks for exactly the label this forbids. The two contradicted, the model picked a
 * side non-deterministically, and across five live runs the "(N characters)" label
 * appeared on only three. On the other two the tool stated no length at all and
 * correctCharacterCounts() had nothing to rewrite — silently reverting to the D-1
 * behaviour the whole mechanism exists to prevent.
 *
 * The prohibition is correct WHERE NOTHING RECOMPUTES THE NUMBER. Where something
 * does, it must not apply.
 */
export const NO_SELF_MEASUREMENT_GUARD = `
- Do NOT state character counts, word counts or any other measurement of your
  own output. Any number you write would be an estimate presented as a fact,
  and language models cannot count characters reliably.`;


/**
 * Only for tools in COUNTED_TOOLS. Keeps the "(N characters)" label so the
 * recount has an anchor, and names what is being measured so the number can't
 * drift onto an adjacent line.
 */
export const LENGTH_LABEL_GUARD = `
- You MUST label each length as "Title Tag (N characters):" or
  "Meta Description (N characters):" on the line immediately BEFORE the text it
  describes, with the text alone on the next line. The number is recomputed from
  the real string after generation, so do not labour over it — but keep the
  label and keep the measured text on its own line.`;
