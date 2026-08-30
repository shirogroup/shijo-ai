# GEO checker test suite

107 executable tests covering the `/geo` public visibility checker. Written
2026-08-29 during the build review; kept in the repo rather than a scratch
folder so they survive and stay re-runnable.

These exercise the **real modules** from `lib/geo/` — bundled straight out of
the source tree with esbuild — not reimplementations. `fetch` is intercepted
so no paid API is ever called and no network access is needed.

## Run

```bash
bash scripts/geo-tests/run.sh
```

Exit code 0 = all pass. Requires `node` and a populated `node_modules`
(`npm ci` first if `node_modules/.bin` is empty).

If the repo's `esbuild` binary is for a different platform than the machine
you're on (common when `npm ci` ran on Windows but you're in WSL/Linux, or
vice versa), `run.sh` falls back to installing a matching esbuild into
`scripts/geo-tests/.build/`. That directory is gitignored.

## What each suite covers

| Suite | Tests | Covers |
|---|---|---|
| `01-prompts.mjs` | 30 | Pluralisation, category-noun mapping, prompt generation, caller-supplied prompt normalisation |
| `02-scoring.mjs` | 28 | Name/domain mention detection, false-positive resistance, scoring bands, engine summaries |
| `03-scan-e2e.mjs` | 19 | Full `runScan()` across all 5 adapters with mocked vendor payloads; Places identity resolution; concurrency cap |
| `04-error-paths.mjs` | 23 | 401/500/timeout/provider-error/empty-response handling, partial outages, unconfigured engines |
| `05-budget-guard.mjs` | 26 | UTC day rollover, malformed budget values, per-IP cap, daily spend cap, fail-closed on DB error |

## Invariants these lock down

Several of these encode decisions that are easy to "simplify" back into bugs.
If one of these fails, do not just update the assertion — the behaviour it
protects is deliberate:

1. **A failed or skipped cell is never scored as "not mentioned."** Errors are
   excluded from numerator *and* denominator. Counting them as negatives would
   tell a business owner they are invisible when we simply failed to ask.
2. **Fewer than 3 usable answers returns `band: 'insufficient'`, not 0%.** A
   percentage off two data points overstates confidence.
3. **An engine with no API key makes zero HTTP requests.** We must not spend a
   request to discover a missing environment variable.
4. **No prompt sent to an answer engine contains the business name or domain.**
   Naming the business guarantees a mention and makes the score meaningless.
   (The Google Places identity lookup *does* carry the name — that is correct
   and is asserted separately.)
5. **The budget guard fails closed.** If the database cannot be reached we
   cannot prove the caller is under either cap, so the scan is refused. An
   unmetered bill on an anonymous public endpoint is not recoverable.
6. **A malformed `GEO_DAILY_BUDGET_USD` falls back to the default**, never to
   `NaN` or `0` — either would silently disable the cap.
7. **Error messages never echo a provider response body**, which can contain
   the submitted API key.
