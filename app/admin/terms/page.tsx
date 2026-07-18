'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface Acceptance {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  termsVersion: string;
  privacyVersion: string;
  ipAddress: string | null;
  userAgent: string | null;
  acceptedAt: string;
}

export default function AdminTermsPage() {
  const { user, loading: authLoading } = useAuth();
  const [acceptances, setAcceptances] = useState<Acceptance[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    fetch('/api/admin/terms-acceptances', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        setAcceptances(data.acceptances);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [authLoading]);

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
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-white font-medium border-b-2 border-shiro-red pb-1">Terms Acceptances</span>
        <a href="/admin/tickets" className="text-gray-400 hover:text-white pb-1">Support Tickets</a>
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">Terms &amp; Privacy Acceptances</h1>
      <p className="text-gray-400 text-sm mb-6">
        Audit log of every user who accepted the Terms of Service and Privacy Policy at registration.
        {acceptances && ` ${acceptances.length} record${acceptances.length === 1 ? '' : 's'} (most recent 500).`}
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Terms v.</th>
              <th className="text-left px-4 py-3 font-medium">Privacy v.</th>
              <th className="text-left px-4 py-3 font-medium">IP Address</th>
              <th className="text-left px-4 py-3 font-medium">Accepted At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {acceptances && acceptances.length > 0 ? (
              acceptances.map((a) => (
                <tr key={a.id} className="bg-gray-950 hover:bg-gray-900/60 transition-colors">
                  <td className="px-4 py-3 text-white">{a.email}</td>
                  <td className="px-4 py-3 text-gray-300">{a.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{a.termsVersion}</td>
                  <td className="px-4 py-3 text-gray-300">{a.privacyVersion}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{a.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{new Date(a.acceptedAt).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No acceptance records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
