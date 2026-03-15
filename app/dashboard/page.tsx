'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Wand2, Sparkles, ArrowRight, Crown, Zap } from 'lucide-react';
import UsageMeter from '@/components/dashboard/UsageMeter';
import { TOOLS, CATEGORIES, type PlanAccess, type ToolCategory } from '@/lib/tools/registry';

const categoryOrder: ToolCategory[] = ['social', 'seo', 'ads', 'email', 'content'];

export default function DashboardOverview() {
  const { user } = useAuth();
  const userPlan = (user?.planTier || 'free') as PlanAccess;
  const freeTools = TOOLS.filter((t) => t.minPlan === 'free');
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div>
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-400">
            {userPlan === 'free'
              ? 'You have access to 5 free AI tools with 3 generations per day.'
              : userPlan === 'pro'
              ? 'Pro plan — 24 tools, 200 generations/month.'
              : 'Enterprise — unlimited access to all tools.'}
          </p>
        </div>
        <div className="w-full md:w-72 flex-shrink-0">
          <UsageMeter />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500">Available Tools</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {userPlan === 'free' ? '5' : '24'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {userPlan === 'free' ? 'of 24 total' : 'all unlocked'}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-500">AI Model</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {userPlan === 'free' ? 'Fast' : 'Advanced'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {userPlan === 'free' ? 'Claude Haiku' : 'Claude Sonnet'}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-500">Your Plan</span>
          </div>
          <p className="text-2xl font-bold text-white capitalize">{userPlan}</p>
          <p className="text-xs text-gray-500 mt-1">
            {userPlan === 'free' ? '3 gens/day' : userPlan === 'pro' ? '200 gens/month' : 'Unlimited'}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-500">Categories</span>
          </div>
          <p className="text-2xl font-bold text-white">5</p>
          <p className="text-xs text-gray-500 mt-1">Social, SEO, Ads, Email, Content</p>
        </div>
      </div>

      {/* Your free tools — quick access */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {userPlan === 'free' ? 'Your Free Tools' : 'Quick Access'}
          </h2>
          <Link
            href="/dashboard/tools"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            View all {TOOLS.length} tools
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(userPlan === 'free' ? freeTools : TOOLS.slice(0, 6)).map((tool) => {
            const cat = CATEGORIES[tool.category];
            return (
              <Link
                key={tool.id}
                href={`/dashboard/tools/${tool.id}`}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 hover:bg-gray-900/80 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <span className={`text-xs font-semibold ${cat.color} ${cat.bgColor} px-2 py-0.5 rounded-full`}>
                    {cat.label}
                  </span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {userPlan === 'free' && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-800/50 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Unlock all 24 AI marketing tools
              </h3>
              <p className="text-sm text-gray-300">
                Upgrade to Pro for $29/mo — get 200 generations/month with advanced AI models across all tools.
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm whitespace-nowrap"
            >
              <Crown className="w-4 h-4" />
              View Plans
            </Link>
          </div>
        </div>
      )}

      {/* Category overview */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Tool Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categoryOrder.map((catKey) => {
            const cat = CATEGORIES[catKey];
            const toolCount = TOOLS.filter((t) => t.category === catKey).length;
            return (
              <Link
                key={catKey}
                href="/dashboard/tools"
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all text-center"
              >
                <span className={`text-xs font-semibold ${cat.color} ${cat.bgColor} px-3 py-1 rounded-full`}>
                  {cat.label}
                </span>
                <p className="text-sm text-gray-400 mt-2">{toolCount} tools</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
