'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Crown,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/**
 * /dashboard/ai-visibility — a customer's saved AI visibility record.
 *
 * This route used to be a bare redirect to /geo, which itself replaced a
 * "coming soon" waitlist screen for a feature that was already live. Both were
 * symptoms of the same gap: every scan has been persisted with the user's id
 * since 2026-08-31, and nothing ever read it back, so a paying customer could
 * never see a scan again once the tab closed.
 *
 * /geo stays the single canonical URL for RUNNING a scan — it is public,
 * ad-safe and carries the SEO signal, and it is not duplicated here. This page
 * is the other half: the record. That split is the product. The free daily
 * scan is a marketing asset and answers "where do I stand today"; the paid plan
 * answers "am I improving, and here is something I can send a client".
 */

type Band = 'strong' | 'moderate' | 'weak' | 'absent' | 'insufficient' | 'unverified';

const BAND_TEXT: Record<string, string> = {
  strong: 'text-emerald-400',
  moderate: 'text-amber-400',
  weak: 'text-orange-400',
  absent: 'text-red-400',
  insufficient: 'text-gray-500',
  unverified: 'text-gray-500',
};

const BAND_LABEL: Record<string, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  weak: 'Weak',
  absent: 'Absent',
  insufficient: 'Not enough data',
  unverified: 'Unverified',
};

// Bands where we deliberately withheld a number. Rendering these as 0 would
// read as "this business was invisible", which is a different claim from
// "we could not measure".
const NO_SCORE_BANDS = ['insufficient', 'unverified'];

interface EngineSummary {
  engine: string;
  total: number;
  ok: number;
  fail: number;
  mentioned: number;
}

interface Scan {
  id: string;
  createdAt: string;
  utcDay: string;
  businessName: string;
  websiteUrl: string | null;
  city: string | null;
  identityResolved: boolean;
  band: Band | null;
  score: number | null;
  promptCount: number;
  cellsAnswered: number;
  cellsMentioned: number;
  enginesAttempted: number;
  enginesAnswered: number;
  engines: EngineSummary[];
}

interface Cell {
  id: string;
  engine: string;
  prompt: string;
  mentioned: boolean;
  matchedOn: unknown;
  snippet: string | null;
  citations: unknown;
  errorMessage: string | null;
  skipped: boolean;
}

interface HistoryResponse {
  success: boolean;
  error?: string;
  upgradeUrl?: string;
  planTier?: string;
  entitlement?: { monthlyScans: number; csvExport: boolean; pdfDownload: boolean };
  usage?: { used: number; limit: number; remaining: number } | null;
  scans?: Scan[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Score trend, drawn as inline SVG.
 *
 * Hand-rolled rather than pulling in a charting library: the project has no
 * chart dependency today and a single line does not justify adding one to the
 * bundle. Scans with a withheld score are skipped entirely rather than plotted
 * at zero.
 */
function TrendChart({ scans }: { scans: Scan[] }) {
  const points = scans
    .filter((s) => s.score !== null && !NO_SCORE_BANDS.includes(s.band ?? ''))
    .slice()
    .reverse()
    .map((s) => ({ score: s.score as number, date: s.createdAt }));

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-800 text-sm text-gray-500">
        {points.length === 0
          ? 'No scored scans yet — the trend appears once a scan returns a score.'
          : 'One scored scan so far. The trend line appears from the second one.'}
      </div>
    );
  }

  const W = 720;
  const H = 160;
  const PAD = 24;
  const xs = (i: number) => PAD + (i * (W - PAD * 2)) / (points.length - 1);
  const ys = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(p.score)}`).join(' ');
  const area = `${line} L ${xs(points.length - 1)} ${H - PAD} L ${xs(0)} ${H - PAD} Z`;

  const first = points[0].score;
  const last = points[points.length - 1].score;
  const delta = last - first;

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white">{last}</span>
        <span className="text-sm text-gray-500">out of 100</span>
        <span
          className={`text-sm font-medium ${
            delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-gray-500'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta} since your first scored scan
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="AI visibility score over time">
        {[0, 25, 50, 75, 100].map((g) => (
          <line
            key={g}
            x1={PAD}
            x2={W - PAD}
            y1={ys(g)}
            y2={ys(g)}
            stroke="currentColor"
            className="text-gray-800"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="hsl(356, 100%, 43%)" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="hsl(356, 100%, 43%)" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={xs(i)} cy={ys(p.score)} r="3.5" fill="hsl(356, 100%, 43%)" />
        ))}
      </svg>
      <div className="flex justify-between px-1 text-xs text-gray-600">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function ScanRow({ scan, canExport }: { scan: Scan; canExport: boolean }) {
  const [open, setOpen] = useState(false);
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || cells || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/geo/history/${scan.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not load this scan.');
      } else {
        setCells(data.cells as Cell[]);
      }
    } catch {
      setError('Could not load this scan.');
    } finally {
      setLoading(false);
    }
  };

  const showScore = scan.score !== null && !NO_SCORE_BANDS.includes(scan.band ?? '');

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-800/40"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{scan.businessName}</p>
          <p className="truncate text-xs text-gray-500">
            {formatDate(scan.createdAt)}
            {scan.city ? ` · ${scan.city}` : ''}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-gray-500">Mentions</p>
          <p className="text-sm text-gray-300">
            {scan.cellsMentioned}/{scan.cellsAnswered}
          </p>
        </div>
        <div className="w-24 text-right">
          <p className={`text-sm font-semibold ${BAND_TEXT[scan.band ?? 'unverified']}`}>
            {showScore ? scan.score : '—'}
          </p>
          <p className="text-xs text-gray-500">{BAND_LABEL[scan.band ?? 'unverified']}</p>
        </div>
      </button>

      {open && (
        <div className="bg-gray-950/60 px-4 pb-4">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading the engine-by-engine detail…
            </div>
          )}
          {error && <p className="py-4 text-sm text-red-400">{error}</p>}
          {cells && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {scan.engines.map((e) => (
                  <span
                    key={e.engine}
                    className="rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-gray-400"
                  >
                    {e.engine}: <span className="text-gray-200">{e.mentioned}</span>/{e.ok} mentions
                    {e.fail > 0 ? ` · ${e.fail} unavailable` : ''}
                  </span>
                ))}
                {canExport && (
                  <a
                    href={`/api/geo/export?scanId=${scan.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:border-gray-500 hover:text-white"
                  >
                    <Download className="h-3 w-3" /> This scan as CSV
                  </a>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="text-gray-500">
                    <tr className="border-b border-gray-800">
                      <th className="py-2 pr-3 font-medium">Engine</th>
                      <th className="py-2 pr-3 font-medium">Prompt</th>
                      <th className="py-2 pr-3 font-medium">Mentioned</th>
                      <th className="py-2 font-medium">What the engine said</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    {cells.map((c) => (
                      <tr key={c.id} className="border-b border-gray-900 align-top">
                        <td className="py-2 pr-3 text-gray-300">{c.engine}</td>
                        <td className="py-2 pr-3">{c.prompt}</td>
                        <td className="py-2 pr-3">
                          {c.errorMessage || c.skipped ? (
                            <span className="text-gray-600">not asked</span>
                          ) : c.mentioned ? (
                            <span className="text-emerald-400">yes</span>
                          ) : (
                            <span className="text-gray-500">no</span>
                          )}
                        </td>
                        <td className="py-2 text-gray-500">
                          {c.snippet ? c.snippet : <span className="text-gray-700">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UpgradePrompt({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-blue-800/50 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-8 text-center">
      <Crown className="mx-auto mb-3 h-8 w-8 text-yellow-400" />
      <h2 className="mb-2 text-xl font-semibold text-white">Your scan history is a paid feature</h2>
      <p className="mx-auto mb-1 max-w-lg text-sm text-gray-300">{message}</p>
      <p className="mx-auto mb-6 max-w-lg text-sm text-gray-400">
        Standard keeps every scan, charts your score over time, and exports the engine-by-engine
        detail as a CSV you can send a client. The free checker at{' '}
        <Link href="/geo" className="text-blue-400 hover:underline">
          /geo
        </Link>{' '}
        stays free — it just does not save anything.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-lg bg-[hsl(356,100%,43%)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        See plans <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function AIVisibilityHistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch('/api/geo/history');
      setStatus(res.status);
      setData(await res.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your AI visibility record…
      </div>
    );
  }

  if (failed) {
    return (
      <div className="p-8">
        <p className="mb-4 text-sm text-red-400">Could not load your scan history.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  if (status === 402) {
    return (
      <div className="p-8">
        <UpgradePrompt message={data?.error || 'Saved scan history is part of Standard and above.'} />
      </div>
    );
  }

  const scans = data?.scans ?? [];
  const usage = data?.usage ?? null;
  const canExport = Boolean(data?.entitlement?.csvExport);
  const canPrint = Boolean(data?.entitlement?.pdfDownload);

  return (
    <div className="geo-report p-6 lg:p-8">
      {/*
        Print rules are scoped to .geo-report and injected here rather than
        added to globals.css: this is the only page with a print action, and a
        global print rule would silently change how every other page prints.

        The dashboard chrome is dark. Printed dark either wastes a cartridge or,
        with "background graphics" off (the browser default), renders white text
        on white paper — the export would look broken to whoever the customer
        sends it to. So the printed copy is forced light, and the sidebar, nav
        and buttons are dropped.
      */}
      <style>{`
        @media print {
          @page { margin: 14mm; }
          body { background: #fff !important; }
          nav, aside, header, .print\\:hidden { display: none !important; }
          .geo-report, .geo-report * {
            background: transparent !important;
            color: #111 !important;
            border-color: #d4d4d8 !important;
            box-shadow: none !important;
          }
          .geo-report table { page-break-inside: auto; }
          .geo-report tr { page-break-inside: avoid; }
          .geo-report .overflow-x-auto { overflow: visible !important; }
          .geo-report svg path[fill^="hsl"] { fill: #999 !important; }
          .geo-report svg path[stroke^="hsl"] { stroke: #111 !important; }
          .geo-report svg circle { fill: #111 !important; }
        }
      `}</style>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:mb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Eye className="h-6 w-6 text-[hsl(356,100%,43%)] print:hidden" />
            AI Visibility
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Every scan you have run, kept and charted. Free scans are not saved — this is your record.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {canExport && scans.length > 0 && (
            <a
              href="/api/geo/export"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
          )}
          {canPrint && scans.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
            >
              <FileText className="h-4 w-4" /> Print / save as PDF
            </button>
          )}
          <Link
            href="/geo"
            className="inline-flex items-center gap-2 rounded-lg bg-[hsl(356,100%,43%)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Run a new scan
          </Link>
        </div>
      </div>

      {/* Allowance */}
      {usage && usage.limit > 0 && (
        <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4 print:hidden">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-gray-400">Saved scans this month</span>
            <span className="text-sm text-gray-300">
              {usage.used} of {usage.limit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-[hsl(356,100%,43%)] transition-all"
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">Resets on the 1st (UTC).</p>
        </div>
      )}

      {scans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 p-10 text-center">
          <Eye className="mx-auto mb-3 h-8 w-8 text-gray-700" />
          <h2 className="mb-2 text-lg font-semibold text-white">No saved scans yet</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-400">
            Run a scan while signed in and it is kept here — with the engine-by-engine detail and
            your score over time. Scans you ran before signing in are not linked to your account.
          </p>
          <Link
            href="/geo"
            className="inline-flex items-center gap-2 rounded-lg bg-[hsl(356,100%,43%)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Run your first saved scan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-3 text-sm font-medium text-gray-400">Your score over time</h2>
            <TrendChart scans={scans} />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 px-4 py-3">
              <h2 className="text-sm font-medium text-gray-400">
                {scans.length} saved {scans.length === 1 ? 'scan' : 'scans'} — click one for the
                engine-by-engine detail
              </h2>
            </div>
            {scans.map((s) => (
              <ScanRow key={s.id} scan={s} canExport={canExport} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
