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
  attempted: EngineId[]
): ScanScore {
  const scorable = cells.filter(isScorable);
  const mentions = scorable.filter((c) => c.mentioned).length;
  const enginesAnswered = new Set(scorable.map((c) => c.engine)).size;

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
};
