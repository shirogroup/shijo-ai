'use client';

import Link from 'next/link';
import { TOOLS, CATEGORIES, type ToolCategory, type PlanAccess } from '@/lib/tools/registry';
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UsageMeter from '@/components/dashboard/UsageMeter';

const categoryOrder: ToolCategory[] = ['social', 'seo', 'ads', 'email', 'content'];

export default function ToolsDirectory() {
  const { user } = useAuth();
  const userPlan = (user?.planTier || 'free') as PlanAccess;
  const planOrder: PlanAccess[] = ['free', 'pro', 'enterprise'];
  const userPlanIndex = planOrder.indexOf(userPlan);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Tools</h1>
          <p className="text-gray-400">
            {TOOLS.length} tools to power your marketing, SEO, and content strategy.
          </p>
        </div>
        <div className="w-full md:w-72 flex-shrink-0">
          <UsageMeter />
        </div>
      </div>

      {categoryOrder.map((catKey) => {
        const cat = CATEGORIES[catKey];
        const tools = TOOLS.filter((t) => t.category === catKey);
        if (tools.length === 0) return null;

        return (
          <div key={catKey} className="mb-10">
            <h2 className={`text-lg font-semibold ${cat.color} mb-4 flex items-center gap-2`}>
              <span className={`${cat.bgColor} px-3 py-1 rounded-full text-sm`}>
                {cat.label}
              </span>
              <span className="text-gray-500 text-sm font-normal">{tools.length} tools</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tools.map((tool) => {
                const isFree = tool.minPlan === 'free';
                const requiredPlanIndex = planOrder.indexOf(tool.minPlan);
                const isLocked = userPlanIndex < requiredPlanIndex;

                return (
                  <Link
                    key={tool.id}
                    href={`/dashboard/tools/${tool.id}`}
                    className={`group bg-gray-900 border border-gray-800 rounded-xl p-5 transition-all ${
                      isLocked
                        ? 'opacity-60 hover:opacity-80 hover:border-gray-700'
                        : 'hover:border-gray-600 hover:bg-gray-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{tool.icon}</span>
                      <div className="flex items-center gap-2">
                        {isFree ? (
                          <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                            Free
                          </span>
                        ) : isLocked ? (
                          <span className="text-xs text-yellow-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {tool.minPlan === 'pro' ? 'Pro' : 'Enterprise'}
                          </span>
                        ) : (
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {tool.minPlan === 'pro' ? 'Pro' : 'Enterprise'}
                          </span>
                        )}
                        <span className="text-xs text-gray-600">
                          {tool.modelTier === 'haiku' ? 'Fast' : 'Advanced'}
                        </span>
                      </div>
                    </div>
                    <h3 className={`font-semibold transition-colors mb-1 ${
                      isLocked ? 'text-gray-400' : 'text-white group-hover:text-blue-400'
                    }`}>
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
