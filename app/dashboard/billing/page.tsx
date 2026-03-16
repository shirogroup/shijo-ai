'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Crown, Zap, Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 0,
    interval: null,
    description: 'Get started with 5 AI tools',
    badge: null,
    features: [
      '5 AI marketing tools',
      '3 generations per day',
      'Claude Haiku (Fast AI)',
      'Basic support',
    ],
    highlight: false,
    tier: 'free',
  },
  {
    name: 'Pro',
    price: 29,
    annualPrice: 278,
    interval: 'month',
    description: 'Unlock all tools with advanced AI',
    badge: 'Most Popular',
    features: [
      'All 24 AI marketing tools',
      '200 generations per month',
      'Claude Sonnet (Advanced AI)',
      'Priority support',
      'Content calendar planner',
      'Email sequence generator',
    ],
    highlight: true,
    tier: 'pro',
  },
  {
    name: 'Enterprise',
    price: 99,
    annualPrice: 950,
    interval: 'month',
    description: 'Unlimited power for teams & agencies',
    badge: null,
    features: [
      'All 24 AI marketing tools',
      'Unlimited generations',
      'Claude Sonnet (Advanced AI)',
      'Dedicated support',
      'Team collaboration (coming soon)',
      'Custom integrations (coming soon)',
    ],
    highlight: false,
    tier: 'enterprise',
  },
];

function BillingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const userPlan = user?.planTier || 'free';
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const upgradedPlan = searchParams.get('plan');

  const handleUpgrade = async (tier: string) => {
    setError('');
    setLoadingPlan(tier);

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: tier }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
        setLoadingPlan(null);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Plans</h1>
        <p className="text-gray-400">
          {userPlan === 'free'
            ? 'Upgrade your plan to unlock all 24 AI marketing tools.'
            : `You're on the ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan.`}
        </p>
      </div>

      {/* Success banner */}
      {isSuccess && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium">
              Welcome to {upgradedPlan === 'enterprise' ? 'Enterprise' : 'Pro'}!
            </p>
            <p className="text-green-400/70 text-sm">
              Your subscription is active. All tools are now unlocked. It may take a moment to reflect.
            </p>
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {isCanceled && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm">
            Checkout was canceled. No charges were made. You can try again anytime.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Current plan badge */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            userPlan === 'free' ? 'bg-gray-800' : userPlan === 'pro' ? 'bg-blue-900/50' : 'bg-purple-900/50'
          }`}>
            {userPlan === 'free' ? <Zap className="w-5 h-5 text-gray-400" /> :
             userPlan === 'pro' ? <Sparkles className="w-5 h-5 text-blue-400" /> :
             <Crown className="w-5 h-5 text-purple-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Current Plan: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
            </p>
            <p className="text-xs text-gray-500">
              {userPlan === 'free' ? '5 tools, 3 gens/day' :
               userPlan === 'pro' ? '24 tools, 200 gens/month' :
               '24 tools, unlimited'}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.tier === userPlan;
          const isDowngrade = plan.tier === 'free' && userPlan !== 'free';
          const isUpgrade = !isCurrent && !isDowngrade && plan.tier !== 'free';

          return (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 relative ${
                plan.highlight
                  ? 'border-blue-600 bg-gray-900 ring-1 ring-blue-600'
                  : 'border-gray-800 bg-gray-900'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  {plan.interval && (
                    <span className="text-gray-500 text-sm">/{plan.interval}</span>
                  )}
                  {!plan.interval && (
                    <span className="text-gray-500 text-sm">forever</span>
                  )}
                </div>
                {plan.annualPrice && (
                  <p className="text-xs text-green-400 mt-1">
                    or ${plan.annualPrice}/year (save 20%)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-3 px-4 rounded-xl text-center bg-gray-700 text-gray-300 text-sm font-semibold">
                  Current Plan
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.tier ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-xl text-center bg-gray-800 text-gray-500 text-sm">
                  —
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12 bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Billing FAQ</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-200 mb-1">Can I cancel anytime?</p>
            <p className="text-gray-400">Yes, you can cancel your subscription at any time. You&apos;ll retain access until the end of your billing period.</p>
          </div>
          <div>
            <p className="font-medium text-gray-200 mb-1">What happens when I hit my limit?</p>
            <p className="text-gray-400">Free users reset daily at midnight. Pro users reset monthly. You can always upgrade for more generations.</p>
          </div>
          <div>
            <p className="font-medium text-gray-200 mb-1">Do you offer refunds?</p>
            <p className="text-gray-400">We offer a 7-day money-back guarantee for all paid plans, no questions asked.</p>
          </div>
          <div>
            <p className="font-medium text-gray-200 mb-1">Is my payment secure?</p>
            <p className="text-gray-400">All payments are processed securely through Stripe. We never store your card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500">Loading billing...</div>}>
      <BillingContent />
    </Suspense>
  );
}
