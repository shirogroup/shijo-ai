import { claudeAdapter } from './engines/claude';
import { dataforseoAdapter } from './engines/dataforseo';
import { geminiAdapter } from './engines/gemini';
import { openaiAdapter } from './engines/openai';
import { perplexityAdapter } from './engines/perplexity';
import { EngineError, toSnippet, type EngineAdapter } from './engines/shared';
import {
  detectMention,
  looksLikeNonAnswer,
  scoreScan,
  summariseEngines,
} from './scoring';
import {
  ENGINE_IDS,
  ENGINE_LABELS,
  ENGINE_PROMPT_SAMPLE,
  MAX_CONCURRENT_ENGINES,
  type BusinessIdentity,
  type EngineId,
  type ScanCell,
  type ScanResult,
} from './types';

/**
 * Fan-out orchestrator for a GEO scan.
 *
 * Two rules that are load-bearing, not stylistic:
 *
 * 1. NO MORE THAN MAX_CONCURRENT_ENGINES (3) requests in flight at once.
 *    Five engines × eight prompts is 40 calls; firing them all would hit
 *    provider rate limits, and a 429 storm would show the user a page of
 *    "unavailable" cells that looks like their business is invisible.
 *
 * 2. ONE ENGINE FAILING NEVER BLANKS THE PAGE. Every call is wrapped so a
 *    throw becomes a cell with an `error`, and errored cells are excluded
 *    from scoring rather than counted as "not mentioned".
 */

const ADAPTERS: Record<EngineId, EngineAdapter> = {
  openai: openaiAdapter,
  gemini: geminiAdapter,
  perplexity: perplexityAdapter,
  claude: claudeAdapter,
  dataforseo: dataforseoAdapter,
};

interface Job {
  engine: EngineId;
  prompt: string;
}

/** Minimal promise pool — runs `jobs` with at most `limit` in flight. */
async function runPool<T>(
  jobs: Job[],
  limit: number,
  worker: (job: Job) => Promise<T>
): Promise<T[]> {
  const results: T[] = new Array(jobs.length);
  let cursor = 0;

  async function drain(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= jobs.length) return;
      results[index] = await worker(jobs[index]);
    }
  }

  const runners = Array.from(
    { length: Math.min(limit, jobs.length) },
    () => drain()
  );
  await Promise.all(runners);
  return results;
}

/** Which engines have credentials on this environment. */
export function configuredEngines(): EngineId[] {
  return ENGINE_IDS.filter((id) => ADAPTERS[id].isConfigured());
}

export async function runScan(params: {
  identity: BusinessIdentity;
  prompts: string[];
  engines?: EngineId[];
}): Promise<Omit<ScanResult, 'scanId'>> {
  const startedAt = new Date();
  const attempted = params.engines?.length ? params.engines : ENGINE_IDS;

  const cells: ScanCell[] = [];

  // Engines with no key never get a job — we must not spend a request to
  // discover a missing environment variable. They are recorded as skipped
  // cells so the grid still renders a full row and the user can see the
  // engine was not checked, rather than silently missing.
  const runnable: EngineId[] = [];
  const degraded: ScanResult['degraded'] = [];

  for (const engine of attempted) {
    if (ADAPTERS[engine].isConfigured()) {
      runnable.push(engine);
    } else {
      degraded.push({
        engine,
        label: ENGINE_LABELS[engine],
        reason: ADAPTERS[engine].missingKeyReason(),
      });
      for (const prompt of params.prompts) {
        cells.push({
          engine,
          prompt,
          mentioned: false,
          matchedOn: [],
          snippet: '',
          citations: [],
          skipped: true,
          error: 'Not checked — engine unavailable.',
        });
      }
    }
  }

  const jobs: Job[] = [];
  for (const engine of runnable) {
    // Per-engine prompt sampling (see ENGINE_PROMPT_SAMPLE). An engine that is
    // far slower than the rest is asked a subset so it cannot dominate total
    // scan duration. Prompts it was not asked are recorded explicitly rather
    // than omitted, so the grid stays rectangular and the reason is visible —
    // "not asked" and "asked but failed" must not look identical to a reader.
    const sample = ENGINE_PROMPT_SAMPLE[engine];
    const asked =
      typeof sample === 'number' && sample < params.prompts.length
        ? params.prompts.slice(0, sample)
        : params.prompts;

    for (const prompt of params.prompts) {
      if (asked.includes(prompt)) {
        jobs.push({ engine, prompt });
      } else {
        cells.push({
          engine,
          prompt,
          mentioned: false,
          matchedOn: [],
          snippet: '',
          citations: [],
          skipped: true,
          error: 'Not asked — this engine is sampled on a subset of prompts to keep scan time within limits.',
        });
      }
    }
  }

  const executed = await runPool(jobs, MAX_CONCURRENT_ENGINES, async (job) => {
    const started = Date.now();
    try {
      const answer = await ADAPTERS[job.engine].run(job.prompt, params.identity);

      // The engine replied, but did it actually answer? A clarifying question
      // names no business, so scoring it as "not mentioned" would invent a
      // miss. Treat it as unavailable — same as a failed request.
      if (looksLikeNonAnswer(answer.text, job.engine)) {
        const cell: ScanCell = {
          engine: job.engine,
          prompt: job.prompt,
          mentioned: false,
          matchedOn: [],
          snippet: toSnippet(answer.text),
          citations: answer.citations,
          error: 'Engine asked a clarifying question instead of recommending.',
          latencyMs: Date.now() - started,
        };
        return cell;
      }

      const { mentioned, matchedOn } = detectMention(answer.text, params.identity);
      const cell: ScanCell = {
        engine: job.engine,
        prompt: job.prompt,
        mentioned,
        matchedOn,
        snippet: toSnippet(answer.text),
        citations: answer.citations,
        latencyMs: Date.now() - started,
      };
      return cell;
    } catch (err) {
      // EngineError messages are pre-sanitised. Anything else is collapsed
      // to a generic string so a provider exception can never leak a key,
      // a URL with credentials, or a stack trace into the response body.
      const message =
        err instanceof EngineError
          ? err.message
          : err instanceof Error && err.message.length < 120
            ? err.message
            : 'This engine could not be reached.';
      // Full error stays server-side only.
      console.error(`[geo] ${job.engine} failed:`, err);
      const cell: ScanCell = {
        engine: job.engine,
        prompt: job.prompt,
        mentioned: false,
        matchedOn: [],
        snippet: '',
        citations: [],
        error: message,
        latencyMs: Date.now() - started,
      };
      return cell;
    }
  });

  cells.push(...executed);

  const engines = summariseEngines(cells, attempted);
  // Pass identity resolution through: an unconfirmed business means the
  // prompts were built from a generic category and the number would be
  // meaningless. See the identity gate in scoreScan.
  const score = scoreScan(cells, attempted, {
    identityResolved: params.identity.resolved,
  });

  return {
    identity: params.identity,
    prompts: params.prompts,
    cells,
    engines,
    score,
    degraded,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  };
}
