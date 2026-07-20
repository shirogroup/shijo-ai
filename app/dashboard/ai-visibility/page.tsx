'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, CheckCircle2 } from 'lucide-react';

export default function AIVisibilityPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'joined' | 'error'>('idle');

  const handleNotifyMe = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/dashboard/ai-visibility-waitlist', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('joined');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-gray-800/50 rounded-full p-6 mb-6">
        <Eye className="w-12 h-12 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">AI Visibility Tracking</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        Track how often your brand gets mentioned when people ask AI tools questions about your
        category — coming soon.
      </p>

      {status === 'joined' ? (
        <div className="flex items-center gap-2 text-sm text-green-400 mb-6">
          <CheckCircle2 className="w-4 h-4" />
          You&apos;re on the list — we&apos;ll email you when it launches.
        </div>
      ) : (
        <button
          onClick={handleNotifyMe}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm mb-2"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          Notify me when this launches
        </button>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 mb-4">Something went wrong — please try again.</p>
      )}

      <p className="text-sm text-gray-500 mt-4 mb-6">
        In the meantime, try our AI Overview Optimizer:
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard/tools/ai-overview-optimizer"
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          AI Overview Optimizer
        </Link>
      </div>
    </div>
  );
}
