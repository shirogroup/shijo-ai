/**
 * Stripe Products and Prices Configuration
 * Generated from Stripe setup on January 19, 2026
 */

export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: 'price_1SrTjeHF4DsT3nuc4CoCdQNz',
  ENTERPRISE_MONTHLY: 'price_1SrTjfHF4DsT3nucTM6xX6eu',
  CREDITS_10: 'price_1SrTjgHF4DsT3nuc1a646JL5',
  CREDITS_50: 'price_1SrTjiHF4DsT3nucBXGXeP7s',
  CREDITS_100: 'price_1SrTjkHF4DsT3nucxXEFQXHz',
} as const;

export const STRIPE_PRODUCT_IDS = {
  PRO: 'prod_Tp7u1h6YhDsz84',
  ENTERPRISE: 'prod_Tp7zOpUPcG6i5k',
  CREDITS_10: 'prod_Tp7zE0HT9iE7se',
  CREDITS_50: 'prod_Tp7zbxIWh3cjnu',
  CREDITS_100: 'prod_Tp7zKmv7yYysX5',
} as const;

export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    features: {
      seedKeywords: 10000,
      expansions: 0, // 3/day
      clustering: 0, // 1/day
      briefs: 0,
      audits: 0, // 1/day
      metaGen: 1000,
      aeo: 0,
      searchVolume: 0,
      serpSnapshots: 0,
      rankKeywords: 0,
      aiVisibility: 0,
      aiSimulator: 0,
      predictiveSeo: 0,
    },
    dailyLimits: {
      expansions: 3,
      clustering: 1,
      audits: 1,
    },
  },
  pro: {
    name: 'Pro',
    price: 39,
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    features: {
      seedKeywords: 10000,
      expansions: 100,
      clustering: 50,
      briefs: 300,
      audits: 50,
      metaGen: 1000,
      aeo: 100,
      searchVolume: 500,
      serpSnapshots: 100,
      rankKeywords: 50,
      aiVisibility: 0,
      aiSimulator: 0,
      predictiveSeo: 0,
    },
    burstAllowance: {
      expansions: 25,
      briefs: 50,
      audits: 10,
      searchVolume: 100,
      serpSnapshots: 20,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 129,
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY,
    features: {
      seedKeywords: 10000,
      expansions: 5000,
      clustering: 500,
      briefs: 2000,
      audits: 500,
      metaGen: 10000,
      aeo: 1000,
      searchVolume: 5000,
      serpSnapshots: 1000,
      rankKeywords: 200,
      aiVisibility: 2,
      aiSimulator: 100,
      predictiveSeo: 200,
    },
    burstAllowance: {
      expansions: 500,
      briefs: 400,
      audits: 100,
      searchVolume: 1000,
      serpSnapshots: 200,
      aiSimulator: 20,
      predictiveSeo: 40,
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

export const CREDIT_COSTS = {
  expansion: 3,
  clustering: 5,
  serpSnapshot: 10,
  searchVolume: 5,
  pageAudit: 50,
  rankSnapshot: 50,
} as const;

export type PlanTier = 'free' | 'pro' | 'enterprise';
export type CreditPackId = typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS];
