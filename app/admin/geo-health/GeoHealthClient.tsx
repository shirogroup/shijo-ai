'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, AlertTriangle, Check, ExternalLink, Loader2, Minus, RefreshCw, X,
} from 'lucide-react';
import { GEO_FIXTURES, type GeoFixture } from '@/lib/geo/fixtures';

interface Vendor { vendor: string; label: string; configured: boolean }
interface Ping {
  vendor: string; label: string; configured: boolean; ok: boolean;
  httpStatus: number | null; latencyMs: number | null;
  errorClass: string | null; freePing: boolean;
}
interface Budget {
  utcDay: string; scansToday: number; adminScansToday: number; publicScansToday: number;
  spentTodayUsd: number; budgetUsd: number; adminCap: number;
  adminRemaining: number; budgetRemainingUsd: number; degraded: boolean;
}
interface EngineSummary { engine: string; total: number; ok: number; fail: number; mentioned: number }
interface ScanRow {
  id: string; createdAt: string; utcDay: string; businessName: string; city: string | null;
  identityResolved: boolean; band: string | null; score: number | null;
  promptCount: number; cellsAnswered: number; cellsMentioned: number;
  enginesAttempted: number; enginesAnswered: number; durationMs: number | null;
  estimatedCostUsd: string | null; isAdminScan: boolean; engines: EngineSummary[];
}

const money = (n: unknown) => `$${Number(n ?? 0).toFixed(4)}`;

export function GeoHealthClient() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [resetMins, setResetMins] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [pings, setPings] = useState<Ping[] | null>(null);
  const [pinging, setPinging] = useState(false);

  const [scans, setScans] = useState<ScanRow[] | null>(null);

  const [fixture, setFixture] = useState<GeoFixture>(GEO_FIXTURES[0]);
  const [form, setForm] = useState({
    businessName: GEO_FIXTURES[0].businessName,
    websiteUrl: GEO_FIXTURES[0].websiteUrl,
    city: GEO_FIXTURES[0].city,
  });
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [scanErr, setScanErr] = useState('');

  const loadHealth = useCallback(() => {
    fetch('/api/admin/geo-health', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) { setError(j.error || 'Could not load GEO health'); return; }
        setVendors(j.vendors); setBudget(j.budget); setResetMins(j.utcResetInMinutes);
      })
      .catch(() => setError('Network error'));
  }, []);

  const loadScans = useCallback(() => {
    fetch('/api/admin/geo-scans?limit=25', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => { if (j.success) setScans(j.scans); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadHealth(); loadScans(); }, [loadHealth, loadScans]);

  function pickFixture(f: GeoFixture) {
    setFixture(f);
    setForm({ businessName: f.businessName, websiteUrl: f.websiteUrl, city: f.city });
    setScanMsg(''); setScanErr('');
  }

  async function runPings() {
    setPinging(true); setPings(null);
    try {
      const r = await fetch('/api/admin/geo-health', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      if (j.success) setPings(j.pings);
      else setError(j.error || 'Ping failed');
    } catch { setError('Network error during ping'); }
    setPinging(false);
  }

  async function runAdminScan() {
    setScanning(true); setScanMsg(''); setScanErr('');
    try {
      const r = await fetch('/api/admin/geo-scan', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setScanErr(j.error || 'Scan failed');
      } else {
        setScanMsg(
          `Done in ${Math.round((j.durationMs ?? 0) / 1000)}s — band "${j.score?.band}", ` +
          `${j.score?.mentions}/${j.score?.answered} cells mentioned, ` +
          `${j.degraded?.length ?? 0} engine(s) unavailable.`
        );
        loadHealth(); loadScans();
      }
    } catch { setScanErr('Network error during scan'); }
    setScanning(false);
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h1 className="text-lg font-bold text-white mb-2">GEO / QA</h1>
          <p className="text-sm text-gray-400">
            {error === 'Forbidden'
              ? 'You do not have admin access.'
              : error === 'Unauthorized'
                ? 'Please sign in.'
                : error}
          </p>
        </div>
      </div>
    );
  }

  const lastForFixture = scans?.find(
    (s) => s.businessName.toLowerCase() === fixture.businessName.toLowerCase()
  );

  return (
    <div className="p-6 md:p-8 space-y-8 text-gray-200">
      <header>
        <h1 className="text-2xl font-bold text-white">GEO / QA</h1>
        <p className="text-sm text-gray-400 mt-1">
          Vendor health, spend and scan history for the public{' '}
          <Link href="/geo" className="text-blue-400 hover:underline">/geo</Link> checker.
          Results here are <strong>API-grounded, not a logged-in consumer chat.</strong>
        </p>
      </header>

      {/* A. Config strip */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Vendor configuration</h2>
        <p className="text-xs text-gray-500 mb-3">
          Derived from environment variable <em>names</em> only — no value is ever read or shown.
          Configured does not mean valid; use Ping for that.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(vendors ?? []).map((v) => (
            <div key={v.vendor}
              className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2">
              {v.configured
                ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                : <X className="w-4 h-4 text-red-500 shrink-0" />}
              <span className="text-sm">{v.label}</span>
              <span className={`ml-auto text-xs ${v.configured ? 'text-emerald-500' : 'text-red-400'}`}>
                {v.configured ? 'configured' : 'missing'}
              </span>
            </div>
          ))}
          {!vendors && <p className="text-sm text-gray-500">Loading…</p>}
        </div>
      </section>

      {/* B. Pings */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white">Vendor pings</h2>
          <button onClick={runPings} disabled={pinging}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white">
            {pinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            {pinging ? 'Pinging…' : 'Ping engines'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          One tiny request per vendor. <strong>Does not use the public /geo IP cap</strong> and writes
          nothing to geo_scans. Free for ChatGPT Search, Gemini and Google AI Overview; costs a
          fraction of a cent for Claude, Perplexity and Places, which have no free auth-check endpoint.
        </p>
        {pings && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60 text-gray-400">
                <tr>
                  <th className="text-left font-medium p-3">Vendor</th>
                  <th className="text-left font-medium p-3">Configured</th>
                  <th className="text-left font-medium p-3">OK</th>
                  <th className="text-left font-medium p-3">HTTP</th>
                  <th className="text-left font-medium p-3">Latency</th>
                  <th className="text-left font-medium p-3">Error class</th>
                </tr>
              </thead>
              <tbody>
                {pings.map((p) => (
                  <tr key={p.vendor} className="border-t border-gray-800">
                    <td className="p-3">{p.label}{!p.freePing && <span className="ml-2 text-[10px] text-amber-500">billable ping</span>}</td>
                    <td className="p-3">{p.configured ? 'yes' : <span className="text-red-400">no</span>}</td>
                    <td className="p-3">
                      {p.ok ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                    </td>
                    <td className="p-3 text-gray-400">{p.httpStatus ?? '—'}</td>
                    <td className="p-3 text-gray-400">{p.latencyMs != null ? `${p.latencyMs}ms` : '—'}</td>
                    <td className="p-3 text-gray-400">{p.errorClass ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* C. Budget */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Budget &amp; caps today</h2>
        {budget ? (
          <>
            {budget.degraded && (
              <p className="mb-3 flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Could not read the database — figures below are placeholders, not real.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { k: 'UTC day', v: budget.utcDay },
                { k: 'Scans today', v: `${budget.scansToday} (${budget.publicScansToday} public / ${budget.adminScansToday} admin)` },
                { k: 'Spent today (est.)', v: `${money(budget.spentTodayUsd)} of $${budget.budgetUsd.toFixed(2)}` },
                { k: 'Admin scans left', v: `${budget.adminRemaining} of ${budget.adminCap}` },
              ].map((c) => (
                <div key={c.k} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                  <div className="text-xs text-gray-500">{c.k}</div>
                  <div className="text-sm font-semibold text-white mt-1">{c.v}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Caps reset at <strong>00:00 UTC</strong>
              {resetMins != null && <> — about {Math.floor(resetMins / 60)}h {resetMins % 60}m from now</>}.
              Spend is a conservative estimate written at scan time, not a vendor invoice.
            </p>
          </>
        ) : <p className="text-sm text-gray-500">Loading…</p>}
      </section>

      {/* Fixtures */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">QA fixtures</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {GEO_FIXTURES.map((f) => (
            <button key={f.id} onClick={() => pickFixture(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                fixture.id === f.id
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-400">{fixture.note}</p>
            <p className="text-xs text-gray-500 mt-1"><strong>Expected:</strong> {fixture.expectation}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {([['businessName', 'Business name'], ['websiteUrl', 'Website'], ['city', 'City']] as const).map(([k, label]) => (
              <label key={k} className="block">
                <span className="block text-xs text-gray-500 mb-1">{label}</span>
                <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={runPings} disabled={pinging}
              className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 disabled:opacity-60">
              Ping vendors
            </button>
            <button onClick={runAdminScan} disabled={scanning || (budget?.adminRemaining ?? 1) <= 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-3 py-2 text-xs font-semibold text-white">
              {scanning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {scanning ? 'Scanning…' : 'Run admin test scan'}
            </button>
            <a href="/geo" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800">
              Open public /geo <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-gray-500">
            An admin test scan <strong>bypasses the public per-IP cap</strong> but still honours the
            daily budget and the admin scan cap. Opening public /geo uses the normal visitor path,
            where the per-IP cap still applies.
          </p>

          {scanMsg && <p className="text-xs text-emerald-400">{scanMsg}</p>}
          {scanErr && (
            <p className="flex items-start gap-2 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{scanErr}
            </p>
          )}

          {lastForFixture && (
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs">
              <span className="text-gray-500">Most recent scan for this fixture: </span>
              <Link href={`/admin/geo-health/scan/${lastForFixture.id}`} className="text-blue-400 hover:underline">
                {new Date(lastForFixture.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
              </Link>
              <span className="text-gray-500">
                {' '}— band {lastForFixture.band ?? '—'},{' '}
                score {lastForFixture.score ?? '—'}, identity{' '}
                {lastForFixture.identityResolved ? 'resolved' : 'unresolved'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* D. Recent scans */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white">Recent scans (last 25)</h2>
          <button onClick={() => { loadScans(); loadHealth(); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
                <th className="text-left font-medium p-3 whitespace-nowrap">Created (UTC)</th>
                <th className="text-left font-medium p-3">Business</th>
                <th className="text-left font-medium p-3">Src</th>
                <th className="text-left font-medium p-3">Identity</th>
                <th className="text-left font-medium p-3">Band</th>
                <th className="text-left font-medium p-3">Score</th>
                <th className="text-left font-medium p-3">Engines ok/fail</th>
                <th className="text-left font-medium p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(scans ?? []).map((s) => (
                <tr key={s.id} className="border-t border-gray-800 hover:bg-gray-900/40">
                  <td className="p-3 whitespace-nowrap text-gray-400">
                    {new Date(s.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="p-3">{s.businessName}{s.city ? <span className="text-gray-500"> · {s.city}</span> : null}</td>
                  <td className="p-3">
                    <span className={`text-[10px] rounded px-1.5 py-0.5 ${s.isAdminScan ? 'bg-blue-600/25 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>
                      {s.isAdminScan ? 'admin' : 'public'}
                    </span>
                  </td>
                  <td className="p-3">
                    {s.identityResolved
                      ? <Check className="w-4 h-4 text-emerald-500" />
                      : <Minus className="w-4 h-4 text-gray-600" />}
                  </td>
                  <td className="p-3 text-gray-300">{s.band ?? '—'}</td>
                  <td className="p-3 text-gray-300">{s.score ?? '—'}</td>
                  <td className="p-3 text-gray-400 text-xs">
                    {s.engines.length
                      ? s.engines.map((e) => `${e.engine} ${e.ok}/${e.fail}`).join(' · ')
                      : '—'}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/geo-health/scan/${s.id}`} className="text-blue-400 hover:underline text-xs">
                      detail
                    </Link>
                  </td>
                </tr>
              ))}
              {scans && scans.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-gray-500 text-sm">No scans recorded yet.</td></tr>
              )}
              {!scans && <tr><td colSpan={8} className="p-6 text-center text-gray-500 text-sm">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          &quot;Src&quot; is derived from the scan&apos;s rate-limit key, not a stored column — the
          <code className="mx-1 text-gray-400">source</code> column is a separate, pending change.
          Model output is not shown here; open a row&apos;s detail for that.
        </p>
      </section>
    </div>
  );
}
