'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  MapPin,
  Minus,
  X,
} from 'lucide-react';
import { BAND_COPY } from '@/lib/geo/scoring';
import { GEO_DISCLAIMER } from '@/lib/pricing-plans';
import {
  ENGINE_LABELS,
  type EngineId,
  type ScanCell,
  type ScanResult,
} from '@/lib/geo/types';

/**
 * Client UI for the public GEO checker.
 *
 * Presentation rule carried over from the scoring module: a cell that
 * errored or was skipped renders as "not checked" (a dash), NEVER as a red
 * "not mentioned" X. Showing an unavailable engine as a negative would tell
 * a business owner they are invisible when we simply failed to ask.
 */

type Status = 'idle' | 'loading' | 'done' | 'error';

const BAND_STYLES: Record<string, string> = {
  strong: 'text-emerald-600',
  moderate: 'text-amber-600',
  weak: 'text-orange-600',
  absent: 'text-red-600',
  insufficient: 'text-muted-foreground',
  unverified: 'text-muted-foreground',
};

/** Bands where we deliberately show no number. Rendering a confident 0 for
 *  either of these would overstate what the scan actually established. */
const NO_SCORE_BANDS = ['insufficient', 'unverified'];

export function GeoChecker() {
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [openCell, setOpenCell] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    setResult(null);
    setOpenCell(null);

    try {
      const res = await fetch('/api/geo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, websiteUrl, city }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setResult(data as ScanResult);
      setStatus('done');
    } catch {
      setError('Network error — please try again.');
      setStatus('error');
    }
  }

  const cellFor = (cells: ScanCell[], engine: EngineId, prompt: string) =>
    cells.find((c) => c.engine === engine && c.prompt === prompt);

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Form ─────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium mb-1.5">
              Business name <span className="text-red-500">*</span>
            </label>
            <input
              id="businessName"
              required
              maxLength={200}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Maya Yoga Studio"
              className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium mb-1.5">
              Website
            </label>
            <input
              id="websiteUrl"
              maxLength={500}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. mayayoga.com"
              className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              required
              maxLength={200}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Dallas"
              className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-60 transition-opacity"
          >
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'loading' ? 'Checking five engines…' : 'Run my free check'}
          </button>
          <p className="text-xs text-muted-foreground">
            One free scan per day. Usually takes 30–60 seconds.
          </p>
        </div>

        {status === 'error' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </form>

      {/* ── Results ──────────────────────────────────────────── */}
      {status === 'done' && result && (
        <div className="mt-10 space-y-8">
          {/* Score */}
          <div className="bg-card border rounded-2xl p-6 md:p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Visibility score for{' '}
              <strong className="text-foreground">
                {result.identity.displayName}
              </strong>
            </p>
            {NO_SCORE_BANDS.includes(result.score.band) ? (
              <p className="text-3xl font-bold text-muted-foreground">—</p>
            ) : (
              <p className={`text-6xl font-bold ${BAND_STYLES[result.score.band]}`}>
                {result.score.score}
                <span className="text-2xl font-normal text-muted-foreground">
                  /100
                </span>
              </p>
            )}
            <p className={`mt-2 font-semibold ${BAND_STYLES[result.score.band]}`}>
              {BAND_COPY[result.score.band].title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              {BAND_COPY[result.score.band].detail}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Named in {result.score.mentions} of {result.score.answered}{' '}
              answers we received, across {result.score.enginesAnswered} of{' '}
              {result.score.enginesAttempted} engines.
            </p>
          </div>

          {/* Identity */}
          <div className="bg-muted/40 border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              What we checked for
            </h2>
            {result.identity.resolved ? (
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{result.identity.displayName}</dd>
                </div>
                {result.identity.formattedAddress && (
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium">
                      {result.identity.formattedAddress}
                    </dd>
                  </div>
                )}
                {result.identity.domain && (
                  <div>
                    <dt className="text-muted-foreground">Domain</dt>
                    <dd className="font-medium">{result.identity.domain}</dd>
                  </div>
                )}
                {result.identity.types.length > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium">
                      {result.identity.types.slice(0, 3).join(', ').replace(/_/g, ' ')}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                We could not confirm this business on Google Places, so we used
                the details you entered.
                {result.identity.unresolvedReason
                  ? ` (${result.identity.unresolvedReason})`
                  : ''}{' '}
                Results may be less precise.
              </p>
            )}
          </div>

          {/* Degraded engines */}
          {result.degraded.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>
                  {result.degraded.length} engine
                  {result.degraded.length > 1 ? 's were' : ' was'} not checked
                </strong>{' '}
                this run ({result.degraded.map((d) => d.label).join(', ')}).
                Those cells are shown as “not checked”, not as a miss — they
                are excluded from your score.
              </p>
            </div>
          )}

          {/* Grid */}
          <div>
            <h2 className="text-lg font-bold mb-1">Engine × question grid</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Click any cell to read the answer and its sources.
            </p>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left font-semibold p-3 min-w-[260px] sticky left-0 bg-muted/50">
                      Question we asked
                    </th>
                    {result.engines.map((e) => (
                      <th key={e.engine} className="p-3 font-semibold text-center whitespace-nowrap">
                        {ENGINE_LABELS[e.engine]}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {e.rate === null
                            ? 'not checked'
                            : `${e.mentions}/${e.answered}`}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.prompts.map((prompt) => (
                    <tr key={prompt} className="border-t">
                      <td className="p-3 align-top sticky left-0 bg-background">
                        {prompt}
                      </td>
                      {result.engines.map((e) => {
                        const cell = cellFor(result.cells, e.engine, prompt);
                        const key = `${e.engine}::${prompt}`;
                        // Boolean() is required, not cosmetic: cell.error is
                        // `string | undefined`, so the raw expression widens to
                        // `string | boolean | undefined` and React's `disabled`
                        // prop only accepts boolean.
                        const unavailable = Boolean(!cell || cell.error || cell.skipped);
                        return (
                          <td key={key} className="p-3 text-center align-top">
                            <button
                              type="button"
                              onClick={() => setOpenCell(openCell === key ? null : key)}
                              disabled={unavailable}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full disabled:cursor-default"
                              aria-label={
                                unavailable
                                  ? 'Not checked'
                                  : cell?.mentioned
                                    ? 'Mentioned'
                                    : 'Not mentioned'
                              }
                            >
                              {unavailable ? (
                                <Minus className="w-4 h-4 text-muted-foreground" />
                              ) : cell?.mentioned ? (
                                <Check className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground/60" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded cell */}
            {openCell && (() => {
              const [engine, prompt] = openCell.split('::');
              const cell = cellFor(result.cells, engine as EngineId, prompt);
              if (!cell) return null;
              return (
                <div className="mt-4 border rounded-xl p-5 bg-card">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    {ENGINE_LABELS[cell.engine]}
                  </p>
                  <p className="font-medium mb-3">{cell.prompt}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {cell.snippet || 'No answer text was returned.'}
                  </p>
                  {cell.matchedOn.length > 0 && (
                    <p className="mt-3 text-xs text-emerald-700">
                      Matched on: {cell.matchedOn.join(' and ')}
                    </p>
                  )}
                  {cell.citations.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold mb-1.5">Sources cited</p>
                      <ul className="space-y-1">
                        {cell.citations.map((url) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 break-all"
                            >
                              {url}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Disclaimer — required wording, do not soften */}
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">
                How to read this:
              </strong>{' '}
              {GEO_DISCLAIMER} Cells marked “not checked” were not asked and
              are excluded from the score.
            </p>
          </div>

          {/* CTAs — existing routes and existing tools only */}
          <div className="rounded-2xl border bg-card p-6 md:p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Want to change these results?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
              Answer engines quote pages that clearly answer the question.
              Two of our tools are built for exactly that.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm"
              >
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/tools/ai-overview-optimizer"
                className="inline-flex items-center justify-center border font-semibold px-6 py-3 rounded-xl text-sm hover:bg-muted transition-colors"
              >
                AI Overview Optimizer
              </Link>
              <Link
                href="/dashboard/tools/faq-generator"
                className="inline-flex items-center justify-center border font-semibold px-6 py-3 rounded-xl text-sm hover:bg-muted transition-colors"
              >
                FAQ Generator
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              2 tools free forever. No credit card required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
