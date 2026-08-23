'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Search, Ban, Undo2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Signup {
  id: string;
  email: string;
  name: string | null;
  planTier: string;
  emailVerified: boolean;
  signupIp: string | null;
  signupUserAgent: string | null;
  createdAt: string;
  suspicious: boolean;
  reasons: string[];
  blocked: boolean;
}

interface Cluster {
  signupIp: string | null;
  accounts: number;
  firstSeen: string | null;
  lastSeen: string | null;
  blocked: boolean;
}

interface BlockEntry {
  id: string;
  ipAddress: string;
  reason: string | null;
  createdAt: string;
  lastHitAt: string | null;
  hitCount: number;
}

interface Summary {
  windowDays: number;
  totalInWindow: number;
  suspiciousInWindow: number;
  distinctIps: number;
  blockedEntries: number;
  truncated: boolean;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : '—');

export default function AdminSignupsPage() {
  const { user, loading: authLoading } = useAuth();
  const [signups, setSignups] = useState<Signup[] | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [blocklist, setBlocklist] = useState<BlockEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/signups', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        setSignups(data.signups);
        setClusters(data.clusters || []);
        setBlocklist(data.blocklist || []);
        setSummary(data.summary);
        setError('');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const block = async (ipAddress: string, reason: string) => {
    setBusy(ipAddress);
    setNotice('');
    try {
      const res = await fetch('/api/admin/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ipAddress, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not block that entry.');
        return;
      }
      setNotice(`Blocked ${ipAddress}.`);
      setError('');
      setManualIp('');
      setManualReason('');
      load();
    } catch {
      setError('Network error');
    } finally {
      setBusy(null);
    }
  };

  const unblock = async (ipAddress: string) => {
    setBusy(ipAddress);
    try {
      const res = await fetch(`/api/admin/signups?ipAddress=${encodeURIComponent(ipAddress)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not remove that entry.');
        return;
      }
      setNotice(`Removed ${ipAddress} from the blocklist.`);
      load();
    } catch {
      setError('Network error');
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    if (!signups) return [];
    const q = query.trim().toLowerCase();
    return signups.filter((s) => {
      if (onlySuspicious && !s.suspicious) return false;
      if (!q) return true;
      return (
        s.email.toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.signupIp || '').includes(q)
      );
    });
  }, [signups, query, onlySuspicious]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-shiro-red" />
      </div>
    );
  }

  if (!user) {
    return <p className="p-6 md:p-10 text-gray-400">Please sign in.</p>;
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex gap-4 mb-6 text-sm">
        <a href="/admin/users" className="text-gray-400 hover:text-white pb-1">Users</a>
        <span className="text-white font-medium border-b-2 border-shiro-red pb-1">Signups</span>
        <a href="/admin/tickets" className="text-gray-400 hover:text-white pb-1">Support Tickets</a>
        <a href="/admin/terms" className="text-gray-400 hover:text-white pb-1">Terms Acceptances</a>
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">Signups review</h1>
      <p className="text-gray-400 text-sm mb-6">
        Registrations from the last {summary?.windowDays ?? 30} days with their signup IP and user agent, so an
        abuse run is visible while it is happening rather than months later.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-green-900 bg-green-950/60 px-4 py-3 text-sm text-green-200">{notice}</div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Signups in window', value: summary.totalInWindow },
            { label: 'Flagged', value: summary.suspiciousInWindow },
            { label: 'Distinct IPs', value: summary.distinctIps },
            { label: 'IP clusters', value: clusters.length },
            { label: 'Blocklist entries', value: summary.blockedEntries },
          ].map((c) => (
            <div key={c.label} className="border border-gray-800 rounded-xl p-4 bg-gray-950">
              <p className="text-gray-500 text-xs mb-1">{c.label}</p>
              <p className="text-white text-xl font-semibold">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {summary?.truncated && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-900 bg-amber-950/50 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Showing the most recent 500 signups only — there are more in this window. Query the database directly
            for a full picture.
          </span>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-1">IP clusters</h2>
      <p className="text-gray-500 text-xs mb-3">
        Addresses with 3 or more accounts, all time. Accounts created before 2026-08-22 have no recorded IP and
        cannot appear here.
      </p>
      <div className="border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">IP address</th>
                <th className="text-left px-4 py-2.5 font-medium">Accounts</th>
                <th className="text-left px-4 py-2.5 font-medium">First seen</th>
                <th className="text-left px-4 py-2.5 font-medium">Last seen</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {clusters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No IP is shared by 3 or more accounts.
                  </td>
                </tr>
              )}
              {clusters.map((c) => (
                <tr key={c.signupIp || 'none'} className={c.accounts >= 10 ? 'bg-red-950/30' : ''}>
                  <td className="px-4 py-3 font-mono text-gray-200">{c.signupIp}</td>
                  <td className="px-4 py-3 text-white font-semibold">{c.accounts}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(c.firstSeen)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(c.lastSeen)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.blocked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <ShieldCheck className="w-3.5 h-3.5" /> Blocked
                      </span>
                    ) : (
                      <button
                        onClick={() => c.signupIp && block(c.signupIp, `${c.accounts} accounts from this IP`)}
                        disabled={busy === c.signupIp}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-shiro-red text-white hover:bg-shiro-red-dark disabled:opacity-50"
                      >
                        {busy === c.signupIp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-1">Blocklist</h2>
      <p className="text-gray-500 text-xs mb-3">
        CIDR ranges are supported and usually the better choice — cloud abuse rotates single addresses for free.
        A range covering your own current IP is rejected so you cannot lock yourself out.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={manualIp}
          onChange={(e) => setManualIp(e.target.value)}
          placeholder="IP or CIDR, e.g. 20.151.0.0/16"
          className="sm:max-w-xs w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-500"
        />
        <input
          value={manualReason}
          onChange={(e) => setManualReason(e.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={() => manualIp.trim() && block(manualIp.trim(), manualReason.trim())}
          disabled={!manualIp.trim() || busy === manualIp.trim()}
          className="px-4 py-2 rounded-lg bg-shiro-red text-white text-sm font-semibold hover:bg-shiro-red-dark disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Entry</th>
                <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                <th className="text-left px-4 py-2.5 font-medium">Hits</th>
                <th className="text-left px-4 py-2.5 font-medium">Last hit</th>
                <th className="text-left px-4 py-2.5 font-medium">Added</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {blocklist.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nothing blocked yet.
                  </td>
                </tr>
              )}
              {blocklist.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-gray-200">{b.ipAddress}</td>
                  <td className="px-4 py-3 text-gray-400">{b.reason || '—'}</td>
                  <td className="px-4 py-3 text-white font-semibold">{b.hitCount}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(b.lastHitAt)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(b.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => unblock(b.ipAddress)}
                      disabled={busy === b.ipAddress}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 disabled:opacity-50"
                    >
                      {busy === b.ipAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-white">Recent signups</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={onlySuspicious}
              onChange={(e) => setOnlySuspicious(e.target.checked)}
              className="w-4 h-4"
            />
            Flagged only
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email, name or IP"
              className="pl-9 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Created</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">IP</th>
                <th className="text-left px-4 py-2.5 font-medium">User agent</th>
                <th className="text-left px-4 py-2.5 font-medium">Flags</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No signups match.
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className={s.suspicious ? 'bg-red-950/25' : ''}>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmt(s.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-200">{s.email}</td>
                  <td className="px-4 py-3 text-gray-200 max-w-[200px] truncate" title={s.name || ''}>
                    {s.name || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-300 whitespace-nowrap">{s.signupIp || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={s.signupUserAgent || ''}>
                    {s.signupUserAgent || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.reasons.length === 0 ? (
                      <span className="text-xs text-gray-600">—</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {s.reasons.map((r) => (
                          <li key={r} className="text-xs text-red-300">{r}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!s.signupIp ? null : s.blocked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <ShieldCheck className="w-3.5 h-3.5" /> Blocked
                      </span>
                    ) : (
                      <button
                        onClick={() => block(s.signupIp!, `Flagged signup: ${s.email}`)}
                        disabled={busy === s.signupIp}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 disabled:opacity-50"
                      >
                        {busy === s.signupIp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        Block IP
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
