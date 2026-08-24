'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, Loader2, ShieldCheck, Search } from 'lucide-react';
import { PLAN_DISPLAY_NAME } from '@/lib/stripe/plan-names';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  planTier: string;
  subscriptionStatus: string | null;
  isAdmin: boolean;
  createdAt: string;
  totalActions: number;
  lastActiveAt: string | null;
  ticketCount: number;
}

interface Summary {
  totalUsers: number;
  activeLast7Days: number;
  paidUsers: number;
  neverActive: number;
}

type SortKey = 'createdAt' | 'lastActiveAt' | 'totalActions';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/admin/users', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        setUsers(data.users);
        setSummary(data.summary);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const toggleAdmin = async (id: string, nextIsAdmin: boolean) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: nextIsAdmin }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) =>
          prev?.map((u) => (u.id === id ? { ...u, isAdmin: data.user.isAdmin } : u)) ?? prev
        );
      } else {
        alert(data.error || 'Failed to update');
      }
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    let list = users.filter((u) => {
      if (q && !u.email.toLowerCase().includes(q) && !(u.name ?? '').toLowerCase().includes(q)) {
        return false;
      }
      if (planFilter === 'free' && u.planTier !== 'free') return false;
      if (planFilter === 'paid' && u.planTier === 'free') return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortKey === 'totalActions') return b.totalActions - a.totalActions;
      if (sortKey === 'lastActiveAt') {
        const at = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const bt = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return bt - at;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [users, query, planFilter, sortKey]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (error || !user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Access denied</h1>
        <p className="text-gray-400 text-sm">
          {error === 'Forbidden' || !user?.isAdmin
            ? "You don't have admin access."
            : error || 'Something went wrong.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-white font-medium border-b-2 border-shiro-red pb-1">Users</span>
        <a href="/admin/signups" className="text-gray-400 hover:text-white pb-1">Signups</a>
        <a href="/admin/tickets" className="text-gray-400 hover:text-white pb-1">Support Tickets</a>
        <a href="/admin/terms" className="text-gray-400 hover:text-white pb-1">Terms Acceptances</a>
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">Users</h1>
      <p className="text-gray-400 text-sm mb-6">
        All registered accounts and their activity. {users && `${users.length} total (most recent 1000).`}
      </p>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950">
            <p className="text-gray-500 text-xs mb-1">Total users</p>
            <p className="text-white text-xl font-semibold">{summary.totalUsers}</p>
          </div>
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950">
            <p className="text-gray-500 text-xs mb-1">Active last 7 days</p>
            <p className="text-white text-xl font-semibold">{summary.activeLast7Days}</p>
          </div>
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950">
            <p className="text-gray-500 text-xs mb-1">Paid plans</p>
            <p className="text-white text-xl font-semibold">{summary.paidUsers}</p>
          </div>
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950">
            <p className="text-gray-500 text-xs mb-1">Never used a feature</p>
            <p className="text-white text-xl font-semibold">{summary.neverActive}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'free', 'paid'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                planFilter === p
                  ? 'bg-white text-gray-900 border-white'
                  : 'text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {p === 'all' ? 'All plans' : p === 'free' ? 'Free' : 'Paid'}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 focus:outline-none focus:border-gray-500"
        >
          <option value="createdAt">Newest signups</option>
          <option value="lastActiveAt">Most recently active</option>
          <option value="totalActions">Most actions</option>
        </select>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">User</th>
                <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                <th className="text-left px-4 py-2.5 font-medium">Signed up</th>
                <th className="text-left px-4 py-2.5 font-medium">Last active</th>
                <th className="text-left px-4 py-2.5 font-medium">Actions</th>
                <th className="text-left px-4 py-2.5 font-medium">Tickets</th>
                <th className="text-left px-4 py-2.5 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-10">
                    No users match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-900/40">
                  <td className="px-4 py-3">
                    <p className="text-white">{u.name || '—'}</p>
                    <p className="text-gray-500 text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        u.planTier === 'free'
                          ? 'bg-gray-800 text-gray-300 border-gray-700'
                          : 'bg-green-900/40 text-green-300 border-green-800'
                      }`}
                    >
                      {PLAN_DISPLAY_NAME[u.planTier] || u.planTier}
                    </span>
                    {u.subscriptionStatus && (
                      <span className="block text-[10px] text-gray-500 mt-1">{u.subscriptionStatus}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{u.totalActions}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{u.ticketCount}</td>
                  <td className="px-4 py-3">
                    <button
                      disabled={savingId === u.id}
                      onClick={() => toggleAdmin(u.id, !u.isAdmin)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                        u.isAdmin
                          ? 'bg-shiro-red/20 text-shiro-red border-shiro-red/40'
                          : 'text-gray-400 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {u.isAdmin ? 'Admin' : 'Make admin'}
                    </button>
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
