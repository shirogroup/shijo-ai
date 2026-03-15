'use client';

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Infinity } from 'lucide-react';

interface UsageData {
  plan: string;
  period: 'day' | 'month';
  used: number;
  limit: number;
  remaining: number;
  resetLabel: string;
}

export default function UsageMeter() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/usage', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUsage(data.usage);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading || !usage) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-24 mb-3" />
        <div className="h-2 bg-gray-800 rounded w-full mb-2" />
        <div className="h-3 bg-gray-800 rounded w-16" />
      </div>
    );
  }

  const isUnlimited = usage.limit === -1;
  const percentage = isUnlimited ? 0 : usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  const isWarning = !isUnlimited && percentage >= 80;
  const isDanger = !isUnlimited && usage.remaining <= 0;

  const planLabel = usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1);
  const periodLabel = usage.period === 'day' ? 'today' : 'this month';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">AI Tool Usage</span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          {planLabel}
        </span>
      </div>

      {isUnlimited ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Infinity className="w-4 h-4" />
          <span className="text-sm">Unlimited generations</span>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              <strong className={isDanger ? 'text-red-400' : 'text-white'}>
                {usage.used}
              </strong>{' '}
              of {usage.limit} used {periodLabel}
            </span>
            <span className="text-[10px] text-gray-600">{usage.resetLabel}</span>
          </div>

          {/* Warning messages */}
          {isDanger && (
            <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              {usage.plan === 'free'
                ? 'Upgrade to Pro for 200/month'
                : 'Upgrade to Enterprise for unlimited'}
            </div>
          )}
          {isWarning && !isDanger && (
            <div className="mt-3 text-xs text-yellow-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              {usage.remaining} generation{usage.remaining !== 1 ? 's' : ''} remaining
            </div>
          )}
        </>
      )}
    </div>
  );
}
