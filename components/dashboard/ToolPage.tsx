'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, ArrowLeft, Sparkles, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { FieldConfig } from '@/lib/tools/registry';
import { CATEGORIES, type ToolCategory, type PlanAccess } from '@/lib/tools/registry';
import { useAuth } from '@/contexts/AuthContext';

interface ToolPageProps {
  toolId: string;
  title: string;
  description: string;
  icon: string;
  category: ToolCategory;
  modelTier: 'haiku' | 'sonnet';
  minPlan: PlanAccess;
  fields: FieldConfig[];
  outputLabel?: string;
}

interface UsageData {
  plan: string;
  period: 'day' | 'month';
  used: number;
  limit: number;
  remaining: number;
  resetLabel: string;
}

export default function ToolPage({
  toolId, title, description, icon, category, modelTier, minPlan, fields, outputLabel = 'Your Results',
}: ToolPageProps) {
  const { user } = useAuth();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [upgradePrompt, setUpgradePrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);

  const cat = CATEGORIES[category];
  const userPlan = (user?.planTier || 'free') as PlanAccess;

  // Check if user's plan can access this tool
  const planOrder: PlanAccess[] = ['free', 'pro', 'enterprise'];
  const userPlanIndex = planOrder.indexOf(userPlan);
  const requiredPlanIndex = planOrder.indexOf(minPlan);
  const isLocked = userPlanIndex < requiredPlanIndex;

  // Fetch usage stats
  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/usage', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUsage(data.usage);
        }
      } catch {
        // Silently fail — usage display is non-critical
      }
    }
    fetchUsage();
  }, [result]); // Refetch after each generation

  const handleGenerate = async () => {
    if (isLocked) return;

    const required = fields.filter((f) => f.required !== false);
    const missing = required.filter((f) => !inputs[f.id]?.trim());
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setUpgradePrompt('');
    setResult('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId, inputs }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Generation failed. Please try again.');
        if (data.upgradePrompt) {
          setUpgradePrompt(data.upgradePrompt);
        }
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/dashboard/tools" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All Tools
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-300">{title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold ${cat.color} ${cat.bgColor} px-3 py-1 rounded-full`}>
            {cat.label}
          </span>
          <span className="text-xs text-gray-500">
            {userPlan === 'free' ? 'Fast' : modelTier === 'haiku' ? 'Fast' : 'Advanced'} AI
          </span>
          {isLocked && (
            <span className="text-xs text-yellow-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {minPlan === 'pro' ? 'Pro' : 'Enterprise'} required
            </span>
          )}
        </div>
        <div className="flex items-start gap-4">
          <div className="text-4xl">{icon}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
          {/* Usage badge */}
          {usage && !isLocked && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-500 mb-1">
                {usage.limit === -1 ? 'Unlimited' : `${usage.remaining} of ${usage.limit} left`}
              </div>
              {usage.limit > 0 && (
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.remaining <= 0
                        ? 'bg-red-500'
                        : usage.used / usage.limit > 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                  />
                </div>
              )}
              <div className="text-[10px] text-gray-600 mt-0.5">{usage.resetLabel}</div>
            </div>
          )}
        </div>
      </div>

      {/* Locked tool message */}
      {isLocked ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {minPlan === 'pro' ? 'Pro' : 'Enterprise'} Tool
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {title} requires a {minPlan === 'pro' ? 'Pro ($29/mo)' : 'Enterprise ($99/mo)'} plan.
            Upgrade to unlock all {minPlan === 'pro' ? '24' : 'enterprise-tier'} tools.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm"
          >
            View Plans
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="font-semibold text-white mb-5">Your Inputs</h2>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {field.label}
                    {field.required !== false && <span className="text-blue-400 ml-1">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={inputs[field.id] || ''}
                      onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                      className="w-full border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={inputs[field.id] || ''}
                      onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={inputs[field.id] || ''}
                      onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{error}</p>
                    {upgradePrompt && (
                      <p className="mt-1 text-yellow-400 text-xs">{upgradePrompt}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{outputLabel}</h2>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {result ? (
              <div className="flex-1 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">{result}</pre>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-5xl mb-3 opacity-30">{icon}</div>
                  <p className="text-sm">Fill in your details and click<br /><strong className="text-gray-400">Generate with AI</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
