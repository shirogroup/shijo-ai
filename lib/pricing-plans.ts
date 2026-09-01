/**
 * Single source of truth for what /pricing renders.
 *
 * WHY THIS FILE EXISTS: the dollar amounts on the ad-serving surfaces
 * (components/landing/Pricing.tsx, app/ai-marketing-tools, app/contact) have
 * historically drifted from lib/stripe/products.ts, and a wrong price on a
 * page paid traffic lands on is the most expensive bug this project has. The
 * numbers below are asserted against PLAN_FEATURES at build time by the test
 * in scripts/geo-tests — if someone changes a price in Stripe config without
 * changing it here, the suite fails rather than the customer finding out.
 *
 * Prices here MUST match lib/stripe/products.ts PLAN_FEATURES exactly.
 */

import type { CheckoutPlanKey } from './checkout-intent';

export interface PricingPlan {
  /** Internal plan key, or null for the one-time report. */
  key: 'free' | 'pro' | 'plus' | 'growth' | 'enterprise' | 'report';
  /** Customer-facing name. For pro/growth this differs from the key. */
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  /** The GEO/AI-visibility line — the reason this page changed. */
  geo: string;
  features: string[];
  /**
   * How this plan's button behaves.
   *   link     — ordinary navigation (Free, Enterprise). NEVER opens Stripe.
   *   checkout — POST create-checkout, or /register?plan= when signed out.
   * Free deliberately cannot be a 'checkout' — see PricingCta.
   */
  cta:
    | { kind: 'link'; label: string; href: string }
    | { kind: 'checkout'; label: string; planKey: CheckoutPlanKey }
    | null;
  highlight?: boolean;
  comingSoon?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tagline: 'Try the tools, no card needed.',
    geo: '1 AI visibility scan per day (public checker)',
    features: [
      '2 AI marketing tools',
      '3 generations per day',
      'No credit card required',
    ],
    // Ordinary link, no plan param. A Free CTA must never reach Stripe.
    cta: { kind: 'link', label: 'Start free', href: '/register' },
  },
  {
    key: 'pro', // displayed "Standard" — see lib/stripe/products.ts naming note
    name: 'Standard',
    price: '$29',
    cadence: 'per month',
    tagline: 'Everything, for solo marketers.',
    geo: '4 AI visibility scans per month',
    features: [
      'All 12 AI marketing tools',
      '200 generations per month',
      'Advanced AI models',
    ],
    cta: { kind: 'checkout', label: 'Choose Standard', planKey: 'pro' },
  },
  {
    key: 'plus',
    name: 'Plus',
    price: '$79',
    cadence: 'per month',
    tagline: 'For teams tracking AI visibility seriously.',
    geo: '30 AI visibility scans per month',
    features: [
      'All 12 AI marketing tools',
      '200 generations per month',
      'Advanced AI models',
    ],
    cta: { kind: 'checkout', label: 'Choose Plus', planKey: 'plus' },
    highlight: true,
  },
  {
    key: 'growth', // displayed "Pro"
    name: 'Pro',
    price: '$199',
    cadence: 'per month',
    tagline: 'The highest AI visibility scan allowance.',
    geo: '100 AI visibility scans per month — the highest allowance',
    features: [
      'All 12 AI marketing tools',
      '1,500 generations per month',
      'Advanced AI models',
    ],
    cta: { kind: 'checkout', label: 'Choose Pro', planKey: 'growth' },
  },
  {
    key: 'report',
    name: 'One-off Report',
    price: '$39',
    cadence: 'one time',
    tagline: 'No subscription. One scan, emailed to you.',
    geo: 'A single full scan across five answer engines',
    features: [
      'Emailed summary of your engine-by-engine results',
      'No account or subscription required',
      'Does not include the 12 tools',
    ],
    cta: null, // wired when the report route ships — see UNPROVEN in the notes
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'coming soon',
    tagline: 'Not currently sold self-serve.',
    geo: 'Custom scan volume',
    features: ['All 12 AI marketing tools', 'Custom limits', 'Priority support'],
    cta: { kind: 'link', label: 'Contact us', href: '/contact' },
    comingSoon: true,
  },
];

/**
 * Compliance line shown on /pricing and /geo.
 *
 * Deliberately says what the product is NOT. The checker queries each
 * vendor's public API with web search enabled, which is not the same as a
 * signed-in consumer chat session — those are personalised and carry history.
 * Claiming otherwise, or implying a ranking guarantee, is the category of
 * overstatement this project has had real bugs from.
 */
export const GEO_DISCLAIMER =
  'AI visibility results are API-grounded: we query each engine’s public API with web search enabled. That is not the same as a signed-in consumer ChatGPT, Gemini or Perplexity session, which is personalised and changes over time. Results are a directional signal at one moment. We do not guarantee rankings, mentions, or customer outcomes.';
