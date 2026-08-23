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
 * Rewrite every "(N characters)" claim so N is the true length of the line
 * that follows it. Lines that carry no such claim are returned untouched, so
 * this is safe to run over the output of any tool.
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
- Where you label a length, keep the exact form "(N characters)" on the line
  immediately BEFORE the text it describes. The number is recomputed from the
  real string after generation, so do not labour over it — but do keep the
  label, because it is what the recount attaches to.
- Where a detail would strengthen the copy but was not provided, leave a clearly
  marked placeholder such as [YOUR CREDENTIAL] rather than inventing one.`;
