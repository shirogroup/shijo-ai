import { claudeAdapter } from './engines/claude';
import { dataforseoAdapter } from './engines/dataforseo';
import { geminiAdapter } from './engines/gemini';
import { openaiAdapter } from './engines/openai';
import { perplexityAdapter } from './engines/perplexity';
import { EngineError, toSnippet, type EngineAdapter } from './engines/shared';
import { detectMention, scoreScan, summariseEngines } from './scoring';
import {
  ENGINE_IDS,
  ENGINE_LABELS,
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
    for (const prompt of params.prompts) {
      jobs.push({ engine, prompt });
    }
  }

  const executed = await runPool(jobs, MAX_CONCURRENT_ENGINES, async (job) => {
    const started = Date.now();
    try {
      const answer = await ADAPTERS[job.engine].run(job.prompt, params.identity);
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
  const score = scoreScan(cells, attempted);

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
