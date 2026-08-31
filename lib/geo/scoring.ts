import {
  ENGINE_LABELS,
  type BusinessIdentity,
  type EngineId,
  type EngineSummary,
  type ScanCell,
  type ScanScore,
} from './types';

/**
 * Mention detection and scoring.
 *
 * Design rule that matters more than the maths: a cell that failed or was
 * skipped is NEVER counted as "not mentioned". Absence of an answer is not
 * evidence of absence from the answer. Scoring over failed cells would let
 * a missing API key silently drag someone's score to zero and we'd be
 * showing a fabricated result — the exact failure class this project has
 * been burned by before. Failed cells are excluded from both numerator and
 * denominator and surfaced separately as "unavailable".
 */

/** Words too generic to treat as a business-name match on their own. */
const STOPWORDS = new Set([
  'the', 'and', 'of', 'for', 'a', 'an', 'co', 'inc', 'llc', 'ltd',
  'company', 'studio', 'group', 'center', 'centre', 'shop', 'store',
  'services', 'service', 'solutions',
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the set of strings that count as naming this business.
 * Includes the full name plus a "distinctive core" (the name minus generic
 * words) so that "Maya Yoga Studio" still matches when an engine writes
 * "Maya Yoga". Single generic tokens are excluded — matching bare "Studio"
 * would produce constant false positives.
 */
export function nameVariants(identity: BusinessIdentity): string[] {
  const name = identity.displayName.trim();
  if (!name) return [];
  const variants = new Set<string>([name]);

  const tokens = name.split(/\s+/).filter(Boolean);
  const distinctive = tokens.filter(
    (t) => !STOPWORDS.has(t.toLowerCase().replace(/[^a-z0-9]/gi, ''))
  );

  // Only useful if dropping generics actually changed something and we're
  // left with a multi-word or clearly distinctive remainder.
  if (distinctive.length && distinctive.length < tokens.length) {
    const core = distinctive.join(' ');
    if (core.length >= 4) variants.add(core);
  }

  return [...variants].filter((v) => v.length >= 3);
}

/**
 * Does this answer text mention the business by name or domain?
 * Word-boundary matched and case-insensitive.
 */
export function detectMention(
  text: string,
  identity: BusinessIdentity
): { mentioned: boolean; matchedOn: ('name' | 'domain')[] } {
  const matchedOn: ('name' | 'domain')[] = [];
  if (!text) return { mentioned: false, matchedOn };

  const haystack = text.toLowerCase();

  for (const variant of nameVariants(identity)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(variant.toLowerCase())}([^a-z0-9]|$)`, 'i');
    if (re.test(haystack)) {
      matchedOn.push('name');
      break;
    }
  }

  if (identity.domain && haystack.includes(identity.domain.toLowerCase())) {
    matchedOn.push('domain');
  }

  return { mentioned: matchedOn.length > 0, matchedOn };
}

/**
 * Detect an engine reply that is not actually an answer — typically a
 * clarifying question back at the user ("Could you tell me what type of
 * business you're looking for?").
 *
 * WHY THIS EXISTS (added 2026-08-30 after the first live scan): four of eight
 * real Claude replies were clarifying questions naming no business at all, and
 * every one was being scored as a legitimate "not mentioned". That is the same
 * error as counting a failed request as a miss — absence of an answer is not
 * evidence of absence from the answer. A non-answer must be excluded from
 * scoring, not counted against the business.
 *
 * Deliberately conservative in the SAFE direction: we only exclude when the
 * reply carries a clarification phrase AND contains no website/domain. A reply
 * that names real businesses with their sites is never excluded, even if it
 * also asks a follow-up question. Over-excluding costs us sample size (and
 * lands honestly on 'insufficient'); under-excluding invents a miss.
 */
const CLARIFICATION_PATTERNS: RegExp[] = [
  /could you (please )?(tell|let) me/i,
  /can you (tell|clarify|specify|let) me/i,
  /what (type|kind|sort) of/i,
  /(I'd|I would) like to know (a bit )?more/i,
  /(need|want|like) (a bit )?more (information|clarification|detail|context)/i,
  /are you (looking for|interested in|asking about)/i,
  /let me know (what|which|more|if)/i,
  /to give you the most (relevant|accurate|useful)/i,
];

/** Anything that looks like a real website reference. */
const DOMAIN_RE = /\b[a-z0-9][a-z0-9-]*\.(com|net|org|io|co|us|ai|app|biz|info)\b/i;

/**
 * Engines this heuristic does NOT apply to.
 *
 * ADDED 2026-08-30 after it produced false positives on live data. DataForSEO
 * does not return a chat reply — it returns Google's AI Overview, which is
 * generated editorial prose and structurally CANNOT ask the user a clarifying
 * question. Applying a chat heuristic to SERP text is a category error.
 *
 * Measured on the Franklin Barbecue scan: 4 of 8 AI Overview cells were
 * wrongly flagged. One of them read "The top restaurants in Austin span
 * legendary smoked meats, inventive modern Mexican, and upscale contemporary
 * dining..." — an answer by any reading — and tripped /what (type|kind) of/,
 * which appears naturally in editorial prose ("no matter what type of
 * barbecue you prefer"). The domain escape hatch below could not save it
 * either: AI Overviews name businesses without printing URLs, so 0 of 8
 * cells contained a domain.
 *
 * Exempting the engine is deliberate rather than tightening the patterns:
 * tightening is guesswork against text I cannot enumerate, and this engine
 * already has a correct non-answer path — the adapter throws
 * "No AI Overview was returned for this query." when there is no text.
 */
const NON_ANSWER_EXEMPT_ENGINES: ReadonlySet<string> = new Set(['dataforseo']);

export function looksLikeNonAnswer(text: string, engine?: string): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  // SERP-derived engines are exempt — see NON_ANSWER_EXEMPT_ENGINES. Checked
  // after the empty-text guard so a genuinely empty result is still caught.
  if (engine && NON_ANSWER_EXEMPT_ENGINES.has(engine)) return false;
  // A reply that points at real websites is an answer, whatever else it says.
  if (DOMAIN_RE.test(t)) return false;
  return CLARIFICATION_PATTERNS.some((re) => re.test(t));
}

/** True when a cell produced a usable answer we can score. */
function isScorable(cell: ScanCell): boolean {
  return !cell.error && !cell.skipped;
}

export function summariseEngines(
  cells: ScanCell[],
  attempted: EngineId[]
): EngineSummary[] {
  return attempted.map((engine) => {
    const own = cells.filter((c) => c.engine === engine);
    const scorable = own.filter(isScorable);
    const mentions = scorable.filter((c) => c.mentioned).length;
    return {
      engine,
      label: ENGINE_LABELS[engine],
      mentions,
      answered: scorable.length,
      unavailable: own.length - scorable.length,
      rate: scorable.length ? mentions / scorable.length : null,
      configured: !own.every((c) => c.skipped),
    };
  });
}

export function scoreScan(
  cells: ScanCell[],
  attempted: EngineId[],
  opts: { identityResolved?: boolean } = {}
): ScanScore {
  const scorable = cells.filter(isScorable);
  const mentions = scorable.filter((c) => c.mentioned).length;
  const enginesAnswered = new Set(scorable.map((c) => c.engine)).size;

  // Identity gate. If Google Places could not confirm the business we do not
  // know its category, so buildLocalPrompts fell back to the generic noun and
  // asked "what are the best businesses in <city>?" — a question whose answer
  // says nothing about this business. Reporting a confident 0 off that is
  // worse than reporting nothing: the first live scan produced exactly this,
  // scoring a yoga studio 0/100 against answers about AT&T and Texas
  // Instruments. Show the grid, withhold the number.
  if (opts.identityResolved === false) {
    return {
      score: 0,
      answered: scorable.length,
      mentions,
      enginesAnswered,
      enginesAttempted: attempted.length,
      band: 'unverified',
    };
  }

  // Below this, the sample is too small for a percentage to mean anything.
  // Saying "0%" off two answers would overstate our confidence.
  const MIN_SCORABLE = 3;

  if (scorable.length < MIN_SCORABLE) {
    return {
      score: 0,
      answered: scorable.length,
      mentions,
      enginesAnswered,
      enginesAttempted: attempted.length,
      band: 'insufficient',
    };
  }

  const score = Math.round((mentions / scorable.length) * 100);

  let band: ScanScore['band'];
  if (score === 0) band = 'absent';
  else if (score < 25) band = 'weak';
  else if (score < 60) band = 'moderate';
  else band = 'strong';

  return {
    score,
    answered: scorable.length,
    mentions,
    enginesAnswered,
    enginesAttempted: attempted.length,
    band,
  };
}

export const BAND_COPY: Record<ScanScore['band'], { title: string; detail: string }> = {
  strong: {
    title: 'Frequently mentioned',
    detail:
      'Answer engines named this business in most of the local questions we asked.',
  },
  moderate: {
    title: 'Sometimes mentioned',
    detail:
      'Answer engines named this business in some answers, but competitors came up more often.',
  },
  weak: {
    title: 'Rarely mentioned',
    detail:
      'This business surfaced in only a small share of the answers we checked.',
  },
  absent: {
    title: 'Not mentioned',
    detail:
      'None of the answers we received named this business. That does not mean it is invisible everywhere — it means it did not appear for these specific questions on these engines at this moment.',
  },
  insufficient: {
    title: 'Not enough data',
    detail:
      'Too few engines returned a usable answer to calculate a meaningful score. Try again shortly.',
  },
  unverified: {
    title: 'Business not confirmed',
    detail:
      'We could not confirm this business on Google Places, so we do not know what category it trades in and had to ask general questions. The answers below are real, but they are not a fair test of this business — so we are not showing a score. Check the business name and city spelling and try again.',
  },
};
