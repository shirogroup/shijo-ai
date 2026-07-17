/**
 * Stripe Products and Prices Configuration
 * Updated March 2026 — LIVE pricing for Pro/Enterprise
 *
 * NOTE: Credit pack IDs below are SANDBOX values and will NOT work in production.
 * To enable credit packs, create LIVE products in the Stripe dashboard and
 * replace the CREDITS_* IDs with the new LIVE price/product IDs.
 */

export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: 'price_1TCQLpHTpiuftGGEZWt9UJ2Y',
  PRO_ANNUAL: 'price_1TuEaIHTpiuftGGEslehCB4Y',
  ENTERPRISE_MONTHLY: 'price_1TCQNAHTpiuftGGEtIcqclbd',
  ENTERPRISE_ANNUAL: 'price_1TuEaNHTpiuftGGE9r0fRkWI',
  // ⚠️ SANDBOX IDs — replace with LIVE IDs when created
  CREDITS_10: 'price_1SrTjgHF4DsT3nuc1a646JL5',
  CREDITS_50: 'price_1SrTjiHF4DsT3nucBXGXeP7s',
  CREDITS_100: 'price_1SrTjkHF4DsT3nucxXEFQXHz',
} as const;

export const STRIPE_PRODUCT_IDS = {
  PRO: 'prod_UAltLAeJGLVSqI',
  ENTERPRISE: 'prod_UAluQCvL32SQ3k',
  // ⚠️ SANDBOX IDs — replace with LIVE IDs when created
  CREDITS_10: 'prod_Tp7zE0HT9iE7se',
  CREDITS_50: 'prod_Tp7zbxIWh3cjnu',
  CREDITS_100: 'prod_Tp7zKmv7yYysX5',
} as const;

// Whether credit pack purchases are enabled (set to true after LIVE IDs are configured)
export const CREDIT_PACKS_ENABLED = false;

// Note: these aiTools* fields are descriptive/reference only. The actual
// enforced limits live in lib/tools/usage.ts (TOOL_LIMITS) — that's the
// single source of truth. Keep the two in sync manually if either changes.
export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    features: {
      aiToolsDaily: 3,         // 3 generations/day
      aiToolsAccess: 5,        // 5 free tools
      aiModel: 'haiku',        // Haiku only
    },
  },
  pro: {
    name: 'Pro',
    price: 29,
    annualPrice: 278,     // 29 * 12 * 0.8
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    annualPriceId: STRIPE_PRICE_IDS.PRO_ANNUAL,
    features: {
      aiToolsMonthly: 200,     // 200 generations/month
      aiToolsAccess: 24,       // All 24 tools
      aiModel: 'auto',         // Haiku or Sonnet per tool config
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    annualPrice: 950,     // 99 * 12 * 0.8 ≈ 950
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY,
    annualPriceId: STRIPE_PRICE_IDS.ENTERPRISE_ANNUAL,
    features: {
      aiToolsMonthly: -1,      // Unlimited
      aiToolsAccess: 24,       // All 24 tools
      aiModel: 'auto',         // Haiku or Sonnet per tool config
    },
  },
} as const;

export const CREDIT_PACKS = [
  {
    name: '10 Credits',
    credits: 10,
    price: 1.00,
    priceId: STRIPE_PRICE_IDS.CREDITS_10,
    productId: STRIPE_PRODUCT_IDS.CREDITS_10,
    bonus: 0,
  },
  {
    name: '50 Credits',
    credits: 50,
    price: 4.75,
    priceId: STRIPE_PRICE_IDS.CREDITS_50,
    productId: STRIPE_PRODUCT_IDS.CREDITS_50,
    bonus: 5,
    popular: true,
  },
  {
    name: '100 Credits',
    credits: 100,
    price: 9.00,
    priceId: STRIPE_PRICE_IDS.CREDITS_100,
    productId: STRIPE_PRODUCT_IDS.CREDITS_100,
    bonus: 10,
    bestValue: true,
  },
] as const;

export type PlanTier = 'free' | 'pro' | 'enterprise';
export type CreditPackId = typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS];
