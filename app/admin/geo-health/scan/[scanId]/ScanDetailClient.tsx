'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ExternalLink, Minus, X } from 'lucide-react';

interface Cell {
  id: string; engine: string; prompt: string; mentioned: boolean;
  matchedOn: string[] | null; snippet: string | null; citations: string[] | null;
  errorMessage: string | null; skipped: boolean; latencyMs: number | null;
}
interface Scan {
  id: string; createdAt: string; utcDay: string;
  businessName: string; websiteUrl: string | null; city: string | null; domain: string | null;
  placeId: string | null; resolvedName: string | null; placeTypes: string[] | null;
  identityResolved: boolean; band: string | null; score: number | null;
  promptCount: number; cellsAnswered: number; cellsMentioned: number;
  enginesAttempted: number; enginesAnswered: number;
  durationMs: number | null; estimatedCostUsd: string | null; isAdminScan: boolean;
}

export function ScanDetailClient({ scanId }: { scanId: string }) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [engines, setEngines] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/geo-scans/${scanId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) { setError(j.error || 'Could not load scan'); return; }
        setScan(j.scan); setCells(j.cells); setPrompts(j.prompts); setEngines(j.engines);
      })
      .catch(() => setError('Network error'));
  }, [scanId]);

  if (error) {
    return (
      <div className="p-8 text-gray-300">
        <Link href="/admin/geo-health" className="text-blue-400 text-sm hover:underline">← Back to GEO / QA</Link>
        <p className="mt-4 text-sm text-red-400">
          {error === 'Forbidden' ? 'You do not have admin access.'
            : error === 'Not found' ? 'That scan does not exist.' : error}
        </p>
      </div>
    );
  }
  if (!scan) return <div className="p-8 text-gray-400">Loading…</div>;

  const cellFor = (engine: string, prompt: string) =>
    cells.find((c) => c.engine === engine && c.prompt === prompt);

  return (
    <div className="p-6 md:p-8 space-y-8 text-gray-200">
      <div>
        <Link href="/admin/geo-health"
          className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to GEO / QA
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">
          {scan.businessName}
          <span className={`ml-3 align-middle text-[11px] rounded px-2 py-0.5 ${
            scan.isAdminScan ? 'bg-blue-600/25 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>
            {scan.isAdminScan ? 'admin test scan' : 'public scan'}
          </span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(scan.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC · UTC day {scan.utcDay}
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: 'Band', v: scan.band ?? '—' },
          { k: 'Score', v: scan.score === null ? '— (withheld)' : String(scan.score) },
          { k: 'Cells mentioned', v: `${scan.cellsMentioned} of ${scan.cellsAnswered} scorable` },
          { k: 'Engines answered', v: `${scan.enginesAnswered} of ${scan.enginesAttempted}` },
          { k: 'Prompts', v: String(scan.promptCount) },
          { k: 'Duration', v: scan.durationMs ? `${(scan.durationMs / 1000).toFixed(1)}s` : '—' },
          { k: 'Est. cost', v: scan.estimatedCostUsd ? `$${Number(scan.estimatedCostUsd).toFixed(4)}` : '—' },
          { k: 'Identity', v: scan.identityResolved ? 'resolved' : 'NOT resolved' },
        ].map((c) => (
          <div key={c.k} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
            <div className="text-xs text-gray-500">{c.k}</div>
            <div className="text-sm font-semibold text-white mt-1">{c.v}</div>
          </div>
        ))}
      </div>

      {scan.score === null && (
        <p className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-300">
          Score was deliberately withheld for this scan (band “{scan.band}”). A stored null means
          “we could not measure this”, which is not the same as a real zero.
        </p>
      )}

      {/* Identity payload */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Identity payload</h2>
        <dl className="grid gap-2 sm:grid-cols-2 rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm">
          {[
            ['Submitted name', scan.businessName],
            ['Resolved name', scan.resolvedName ?? '— (unresolved)'],
            ['City', scan.city ?? '—'],
            ['Website', scan.websiteUrl ?? '—'],
            ['Matched domain', scan.domain ?? '—'],
            ['Places id', scan.placeId ?? '—'],
            ['Places types', (scan.placeTypes ?? []).join(', ') || '—'],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-xs text-gray-500">{k}</dt>
              <dd className="text-gray-200 break-all">{v as string}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Grid */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-1">Engine × prompt</h2>
        <p className="text-xs text-gray-500 mb-3">
          Click a cell for the answer text and its citations. A dash means the cell was not
          scorable — errored or skipped — and it was excluded from the score rather than counted
          as “not mentioned”.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
                <th className="text-left font-medium p-3 min-w-[280px]">Prompt</th>
                {engines.map((e) => (
                  <th key={e} className="p-3 font-medium text-center whitespace-nowrap">{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p} className="border-t border-gray-800">
                  <td className="p-3 align-top text-gray-300">{p}</td>
                  {engines.map((e) => {
                    const c = cellFor(e, p);
                    const key = `${e}:::${p}`;
                    const dead = !c || c.errorMessage || c.skipped;
                    return (
                      <td key={key} className="p-3 text-center align-top">
                        <button type="button" disabled={!c}
                          onClick={() => setOpen(open === key ? null : key)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full disabled:cursor-default">
                          {dead ? <Minus className="w-4 h-4 text-gray-600" />
                            : c!.mentioned ? <Check className="w-4 h-4 text-emerald-500" />
                              : <X className="w-4 h-4 text-gray-500" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {open && (() => {
          const [engine, prompt] = open.split(':::');
          const c = cellFor(engine, prompt);
          if (!c) return null;
          return (
            <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{c.engine}</p>
              <p className="font-medium text-white mt-1">{c.prompt}</p>
              {c.errorMessage && (
                <p className="mt-3 text-xs text-amber-400">
                  {c.skipped ? 'Skipped: ' : 'Error: '}{c.errorMessage}
                </p>
              )}
              {c.snippet && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">{c.snippet}</p>
              )}
              {c.matchedOn?.length ? (
                <p className="mt-3 text-xs text-emerald-400">Matched on: {c.matchedOn.join(' and ')}</p>
              ) : null}
              {c.latencyMs != null && (
                <p className="mt-2 text-xs text-gray-500">Latency {c.latencyMs}ms</p>
              )}
              {c.citations?.length ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 mb-1.5">Citations</p>
                  <ul className="space-y-1">
                    {c.citations.map((u) => (
                      <li key={u}>
                        <a href={u} target="_blank" rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1 break-all text-xs text-blue-400 hover:underline">
                          {u} <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
