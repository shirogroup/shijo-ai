'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, Loader2, Mail } from 'lucide-react';
import { REASON_LABELS } from '@/lib/contactReasons';

interface Ticket {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  reason: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

const STATUS_STYLES: Record<Ticket['status'], string> = {
  open: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  in_progress: 'bg-blue-900/40 text-blue-300 border-blue-800',
  resolved: 'bg-green-900/40 text-green-300 border-green-800',
};

export default function AdminTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Ticket['status']>('all');

  const loadTickets = () => {
    setLoading(true);
    fetch('/api/admin/tickets', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        setTickets(data.tickets);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const updateTicket = async (id: string, updates: { status?: Ticket['status']; adminNotes?: string }) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setTickets((prev) => prev?.map((t) => (t.id === id ? data.ticket : t)) ?? prev);
      }
    } finally {
      setSavingId(null);
    }
  };

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

  const filtered = tickets?.filter((t) => filter === 'all' || t.status === filter) ?? [];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex gap-4 mb-6 text-sm">
        <a href="/admin/users" className="text-gray-400 hover:text-white pb-1">Users</a>
        <a href="/admin/signups" className="text-gray-400 hover:text-white pb-1">Signups</a>
        <span className="text-white font-medium border-b-2 border-shiro-red pb-1">Support Tickets</span>
        <a href="/admin/terms" className="text-gray-400 hover:text-white pb-1">Terms Acceptances</a>
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
      <p className="text-gray-400 text-sm mb-6">
        Messages submitted through the Contact page.
        {tickets && ` ${tickets.length} total (most recent 500).`}
      </p>

      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? 'bg-white text-gray-900 border-white'
                : 'text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12 border border-gray-800 rounded-xl">
            No tickets{filter !== 'all' ? ` with status "${filter}"` : ''}.
          </div>
        )}

        {filtered.map((t) => {
          const isOpen = expandedId === t.id;
          return (
            <div key={t.id} className="border border-gray-800 rounded-xl bg-gray-950 overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : t.id)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-900/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700 shrink-0">
                      {REASON_LABELS[t.reason] ?? t.reason}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{t.subject}</p>
                  <p className="text-gray-500 text-xs">
                    {t.name} &lt;{t.email}&gt; &middot; {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full border ${STATUS_STYLES[t.status]}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-800">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap mb-4">{t.message}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <a
                      href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`}
                      className="inline-flex items-center gap-1 text-xs text-shiro-red hover:underline"
                    >
                      <Mail className="w-3 h-3" /> Reply by email
                    </a>
                  </div>

                  <label className="block text-xs text-gray-500 mb-1">Internal notes (sent to submitter when resolved)</label>
                  <textarea
                    rows={3}
                    value={notesDraft[t.id] ?? t.adminNotes ?? ''}
                    onChange={(e) => setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-500"
                  />

                  <div className="flex flex-wrap gap-2">
                    {(['open', 'in_progress', 'resolved'] as const).map((s) => (
                      <button
                        key={s}
                        disabled={savingId === t.id}
                        onClick={() =>
                          updateTicket(t.id, {
                            status: s,
                            adminNotes: notesDraft[t.id] ?? t.adminNotes ?? '',
                          })
                        }
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          t.status === s
                            ? 'bg-white text-gray-900 border-white'
                            : 'text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        Mark {s.replace('_', ' ')}
                      </button>
                    ))}
                    <button
                      disabled={savingId === t.id}
                      onClick={() => updateTicket(t.id, { adminNotes: notesDraft[t.id] ?? '' })}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-50"
                    >
                      Save notes only
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
