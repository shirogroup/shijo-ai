'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Crown, Zap, Sparkles, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { PLAN_DISPLAY_NAME } from '@/lib/stripe/plan-names';
import PurchaseTracker from '@/components/PurchaseTracker';
import {
  CHECKOUT_PLAN_LABEL,
  CHECKOUT_PLAN_PRICE,
  parsePlanIntent,
} from '@/lib/checkout-intent';

/**
 * Annual billing is HIDDEN on the site as of 2026-08-24, by decision, until the
 * Stripe side is fixed.
 *
 * Why: an existing monthly customer cannot reach the annual plan by ANY route
 * (D-32) — the card shows inert "Current Plan" text, the checkout API returns
 * 400 "You are already on the pro plan" because the guard compares plan without
 * interval, and the Stripe customer portal has plan switching turned off. The
 * 20%-off offer was therefore advertised to exactly the people who could not
 * buy it.
 *
 * TRADE-OFF, on the record: annual IS purchasable today by a NEW signup, and
 * hiding it gives that revenue up in the meantime. That was the accepted call —
 * better to sell nothing than to advertise a discount most viewers cannot take.
 *
 * TO RESTORE: set this to true. That is the whole change. Do it once
 * (a) "Customers can switch plans" is enabled in the Stripe customer portal
 * with the three prices added, and (b) D-32b has shipped so the card offers a
 * real switch instead of dead text.
 */
const ANNUAL_BILLING_ENABLED = false;

const plans = [
  {
    name: 'Free',
    price: 0,
    interval: null,
    description: 'Get started with 2 AI tools',
    badge: null,
    features: [
      '2 AI marketing tools',
      '3 generations per day',
      'Fast AI',
    ],
    highlight: false,
    tier: 'free',
    comingSoon: false,
  },
  {
    name: 'Standard',
    price: 29,
    annualPrice: 278,
    interval: 'month',
    description: 'Unlock all tools with advanced AI',
    badge: null,
    features: [
      'All 12 AI marketing tools',
      '200 generations per month',
      'Advanced AI',
      'Email sequence generator',
    ],
    highlight: false,
    tier: 'pro', // internal key stays 'pro' — displayed as "Standard", see lib/stripe/products.ts
    comingSoon: false,
  },
  {
    // Added 2026-08-31. Sits between Standard and Pro so the ladder reads
    // 29 -> 79 -> 199. tier is 'plus' — the one plan whose internal key and
    // display name match, unlike 'pro'->Standard and 'growth'->Pro.
    name: 'Plus',
    price: 79,
    annualPrice: undefined,
    interval: 'month',
    description: 'For tracking AI visibility seriously',
    badge: null,
    features: [
      'All 12 AI marketing tools',
      '200 generations per month',
      '30 AI visibility scans per month',
      'One-click into FAQ Generator & AI Overview Optimizer',
    ],
    highlight: false,
    tier: 'plus',
    comingSoon: false,
  },
  {
    name: 'Pro',
    price: 199,
    annualPrice: undefined,
    interval: 'month',
    description: 'For heavier, everyday use',
    // Was 'Most Popular' until 2026-08-23. Stripe showed **zero subscriptions
    // ever created** on this account, so "Most Popular" was a factual claim
    // about other customers who do not exist. "Best Value" is an opinion we
    // are entitled to hold; popularity is not, until someone buys something.
    badge: 'Best Value',
    features: [
      'All 12 AI marketing tools',
      '1,500 generations per month',
      'Advanced AI',
      'Email sequence generator',
    ],
    highlight: true,
    tier: 'growth', // internal key 'growth' — displayed as "Pro", see lib/stripe/products.ts
    comingSoon: false,
  },
  {
    name: 'Enterprise',
    // Enterprise is paused and not purchasable (see VALID_PLANS in
    // app/api/stripe/create-checkout/route.ts). It renders as "Coming Soon",
    // so these numbers were never shown — but dead price config is exactly
    // what gets accidentally surfaced later. Zeroed until the plan is real.
    price: 0,
    annualPrice: undefined,
    interval: 'month',
    description: 'Custom volume & pricing for agencies and teams',
    badge: null,
    features: [
      'All 12 AI marketing tools',
      'Custom generation volume',
      'Advanced AI',
      'Team collaboration (coming soon)',
    ],
    highlight: false,
    tier: 'enterprise',
    comingSoon: true, // paused — no self-serve checkout, see app/api/stripe/create-checkout/route.ts
  },
];

function BillingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const userPlan = user?.planTier || 'free';
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState('');
  const [billingIntervalRaw, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  // Single choke point: while annual is hidden (D-32) the rest of this component
  // can keep its annual branches intact and simply never see 'annual'. Flipping
  // ANNUAL_BILLING_ENABLED back to true restores all of them at once, with no
  // other edit.
  const billingInterval = ANNUAL_BILLING_ENABLED ? billingIntervalRaw : 'monthly';

  const isSuccess = searchParams.get('success') === 'true';
  // Accept both spellings: Stripe's cancel_url sends canceled=true, while the
  // signup/login checkout-resume path sends canceled=1 when it could not reach
  // Stripe at all. Both mean "they wanted to buy and did not".
  const canceledRaw = searchParams.get('canceled');
  const isCanceled = canceledRaw === 'true' || canceledRaw === '1';
  const upgradedPlan = searchParams.get('plan');

  // ── Upgrade conversion tracking ──────────────────────────────────────
  // New subscribers land on /thank-you, which verifies the Checkout Session
  // and renders <PurchaseTracker>. Upgrades by an EXISTING subscriber never go
  // through Checkout: create-checkout's `if (liveSubscription)` branch sends
  // them through a Stripe Billing Portal subscription_update_confirm flow that
  // returns here, so no `purchase` event ever fired and every upgrade was
  // invisible to Google Ads and GA4.
  //
  // We do not trust the `success=true` query string — it is user-editable and
  // would mint conversions for anyone who typed it. The server re-checks with
  // Stripe (never our own subscription mirror, which is known to go stale) and
  // only returns a purchase for a genuinely paid, non-zero, recent invoice.
  const [upgradePurchase, setUpgradePurchase] = useState<{
    transactionId: string;
    value: number;
    currency: string;
    planKey: string;
    planName: string;
    interval: string;
  } | null>(null);

  useEffect(() => {
    if (!isSuccess) return;
    let cancelled = false;

    fetch('/api/billing/verify-upgrade')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.verified || !data.purchase) return;
        setUpgradePurchase(data.purchase);
      })
      .catch(() => {
        // Verification unreachable. Show the success UI, count nothing.
      });

    return () => {
      cancelled = true;
    };
  }, [isSuccess]);
  // The plan they were trying to buy when checkout was abandoned. Validated
  // against the same allowlist the server uses, so a crafted ?plan= cannot
  // make the banner advertise something we do not sell.
  const pendingPlan = isCanceled ? parsePlanIntent(searchParams.get('plan')) : null;

  const handleUpgrade = async (tier: string) => {
    setError('');
    setLoadingPlan(tier);

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: tier, interval: billingInterval }),
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

  const handleManageSubscription = async () => {
    setError('');
    setLoadingPortal(true);

    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open billing portal');
        setLoadingPortal(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoadingPortal(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Plans</h1>
        <p className="text-gray-400">
          {userPlan === 'free'
            ? 'Upgrade your plan to unlock all 12 AI marketing tools.'
            : `You're on the ${PLAN_DISPLAY_NAME[userPlan] || userPlan} plan.`}
        </p>
      </div>

      {/* Success banner */}
      {upgradePurchase && <PurchaseTracker purchase={upgradePurchase} />}

      {isSuccess && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium">
              Welcome to {PLAN_DISPLAY_NAME[upgradedPlan || ''] || 'your new plan'}!
            </p>
            <p className="text-green-400/70 text-sm">
              Your subscription is active. All tools are now unlocked. It may take a moment to reflect.
            </p>
          </div>
        </div>
      )}

      {/* Canceled banner.
          Was a passive "you can try again anytime" with nothing to click,
          which stranded anyone who abandoned Stripe — the plan they had
          chosen was thrown away. It now names that plan and re-offers it as
          one button calling the same create-checkout. */}
      {isCanceled && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm flex-1">
            {pendingPlan
              ? `Complete your upgrade to ${CHECKOUT_PLAN_LABEL[pendingPlan]} — ${CHECKOUT_PLAN_PRICE[pendingPlan]}. No charges were made.`
              : 'Checkout was canceled. No charges were made. You can try again anytime.'}
          </p>
          {pendingPlan && (
            <button
              onClick={() => handleUpgrade(pendingPlan)}
              disabled={loadingPlan === pendingPlan}
              className="shrink-0 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-gray-900"
            >
              {loadingPlan === pendingPlan
                ? 'Starting…'
                : `Complete upgrade to ${CHECKOUT_PLAN_LABEL[pendingPlan]}`}
            </button>
          )}
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
              Current Plan: {PLAN_DISPLAY_NAME[userPlan] || userPlan}
            </p>
            <p className="text-xs text-gray-500">
              {userPlan === 'free' ? '2 tools, 3 gens/day' :
               userPlan === 'pro' ? '12 tools, 200 gens/month' :
               userPlan === 'growth' ? '12 tools, 1,500 gens/month' :
               '12 tools, unlimited'}
            </p>
          </div>
        </div>
        {userPlan !== 'free' && (
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all disabled:opacity-50"
          >
            {loadingPortal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Manage Subscription
          </button>
        )}
      </div>

      {/* Monthly / Annual toggle — hidden while ANNUAL_BILLING_ENABLED is false (D-32) */}
      {ANNUAL_BILLING_ENABLED && (
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billingInterval === 'annual'}
          onClick={() => setBillingInterval((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))}
          className="relative w-11 h-6 rounded-full bg-gray-700 transition-colors flex-shrink-0"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              billingInterval === 'annual' ? 'translate-x-5' : ''
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billingInterval === 'annual' ? 'text-white' : 'text-gray-400'}`}>
          Annual
        </span>
        <span className="text-xs font-semibold text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
          Save 20%
        </span>
      </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Rank determines upgrade vs. downgrade — Enterprise is excluded
            (paused, always shows Contact regardless of rank). */}
        {plans.map((plan) => {
          const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, growth: 2, enterprise: 3 };
          const isCurrent = plan.tier === userPlan;
          const isDowngrade = !isCurrent && plan.tier !== 'enterprise' && PLAN_RANK[plan.tier] < (PLAN_RANK[userPlan] ?? 0);
          const isUpgrade = !isCurrent && !isDowngrade && !plan.comingSoon && plan.tier !== 'free';

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
                {plan.comingSoon ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">Coming Soon</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${billingInterval === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price}
                      </span>
                      {plan.interval && (
                        <span className="text-gray-500 text-sm">
                          /{billingInterval === 'annual' && plan.annualPrice ? 'year' : plan.interval}
                        </span>
                      )}
                      {!plan.interval && (
                        <span className="text-gray-500 text-sm">forever</span>
                      )}
                    </div>
                    {ANNUAL_BILLING_ENABLED && plan.annualPrice && billingInterval === 'monthly' && (
                      // Was a plain <p>. A buyer reading "or $278/year (save 20%)"
                      // had no way to act on it from here — the only path to the
                      // annual price was a toggle above the cards, and Stripe
                      // Checkout offers no interval choice because the session is
                      // created with one fixed price. So we advertised a discount
                      // and then didn't sell it. Now it switches the card to annual.
                      <button
                        type="button"
                        onClick={() => setBillingInterval('annual')}
                        className="text-xs text-green-400 mt-1 underline underline-offset-2 hover:text-green-300 transition-colors"
                      >
                        or ${plan.annualPrice}/year (save 20%)
                      </button>
                    )}
                    {!plan.annualPrice && plan.interval && billingInterval === 'annual' && (
                      // Pro has no annual price. Without this the card silently
                      // kept showing "/month" while the toggle said Annual and the
                      // badge said "Save 20%" — a buyer could reasonably read $199
                      // as the annual figure.
                      <p className="text-xs text-gray-400 mt-1">
                        Billed monthly — no annual option yet
                      </p>
                    )}
                    {plan.annualPrice && billingInterval === 'annual' && (
                      <p className="text-xs text-gray-500 mt-1">
                        (${(plan.annualPrice / 12).toFixed(2)}/mo billed annually)
                      </p>
                    )}
                  </>
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
              ) : plan.comingSoon ? (
                <a
                  href="/contact"
                  className="w-full py-3 px-4 rounded-xl text-center bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 text-sm font-semibold transition-all block"
                >
                  Contact Us
                </a>
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
            <p className="font-medium text-gray-200 mb-1">What does &quot;fair use&quot; mean for Enterprise?</p>
            <p className="text-gray-400">Enterprise generations are unlimited for real, everyday use — the fair-use policy only exists to catch automated or abusive traffic patterns. If you have a genuinely high-volume use case, <a href="/contact" className="text-primary hover:underline">reach out</a> and we&apos;ll work out a plan that fits.</p>
          </div>
          <div>
            <p className="font-medium text-gray-200 mb-1">Do you offer refunds?</p>
            <p className="text-gray-400">Refunds are handled on a case-by-case basis — contact us and we&apos;ll take a look. See our <a href="/terms#4" className="text-primary hover:underline">Terms of Service</a> for details.</p>
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
