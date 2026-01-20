'use client';

import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Search, FileText, Zap } from 'lucide-react';

export function StatsCards() {
  const { quota, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-gray-800 bg-gray-900" />
        ))}
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const expansionsPercentage = quota.expansionsQuota > 0 
    ? Math.round((quota.expansionsUsed / quota.expansionsQuota) * 100) 
    : 0;

  const classificationsPercentage = quota.classificationsQuota > 0
    ? Math.round((quota.classificationsUsed / quota.classificationsQuota) * 100)
    : 0;

  const auditsPercentage = quota.auditsQuota > 0
    ? Math.round((quota.auditsUsed / quota.auditsQuota) * 100)
    : 0;

  const briefsPercentage = quota.briefsQuota > 0
    ? Math.round((quota.briefsUsed / quota.briefsQuota) * 100)
    : 0;

  const cards = [
    {
      title: 'Keyword Expansions',
      value: `${quota.expansionsUsed} / ${quota.expansionsQuota}`,
      percentage: expansionsPercentage,
      icon: Search,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Intent Classifications',
      value: `${quota.classificationsUsed} / ${quota.classificationsQuota}`,
      percentage: classificationsPercentage,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'SEO Audits',
      value: `${quota.auditsUsed} / ${quota.auditsQuota}`,
      percentage: auditsPercentage,
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Credits Balance',
      value: quota.creditsBalance.toString(),
      percentage: null,
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-lg border border-gray-800 bg-gray-900 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
              {card.percentage !== null && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full bg-gradient-to-r ${card.color} transition-all`}
                      style={{ width: `${card.percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {card.percentage}% used
                  </p>
                </div>
              )}
            </div>
            <div className={`ml-4 rounded-lg bg-gradient-to-br ${card.color} p-3`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
