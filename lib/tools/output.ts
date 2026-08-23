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
    const m = lines[i].match(COUNT_CLAIM);
    if (!m) continue;

    // The counted string is the next non-empty line.
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;

    const actual = unwrap(lines[j]).length;
    if (actual === 0) continue;

    lines[i] = lines[i].replace(COUNT_CLAIM, `$1${actual}$3`);
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
- Do NOT state character counts, word counts or any other measurement of your
  own output. Any number you write would be an estimate presented as a fact,
  and language models cannot count characters reliably.
- Where a detail would strengthen the copy but was not provided, leave a clearly
  marked placeholder such as [YOUR CREDENTIAL] rather than inventing one.`;


/**
 * Only for tools in COUNTED_TOOLS. Keeps the "(N characters)" label so the
 * recount has an anchor, and names what is being measured so the number can't
 * drift onto an adjacent line.
 */
export const LENGTH_LABEL_GUARD = `
- Label each length as "Title Tag (N characters):" or
  "Meta Description (N characters):" on the line immediately BEFORE the text it
  describes, with the text alone on the next line. The number is recomputed from
  the real string after generation, so do not labour over it — but keep the
  label and keep the measured text on its own line.`;
