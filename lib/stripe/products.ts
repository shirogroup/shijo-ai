/**
 * Stripe Products and Prices Configuration
 * Updated 2026-07-19 — Free/Standard/Pro/Enterprise restructure.
 *
 * Naming note (internal vs. customer-facing — read before touching plan
 * logic elsewhere in the codebase): the $29/mo tier keeps its ORIGINAL
 * internal identifier 'pro' everywhere in code (db.users.planTier,
 * TOOL_LIMITS, checkToolAccess, etc.) to avoid rewriting every existing
 * plan-gating check — it is now displayed to customers as "Standard".
 * The new $199/mo tier uses the internal identifier 'growth' and is
 * displayed to customers as "Pro". Enterprise is paused (not purchasable
 * via self-serve checkout — see VALID_PLANS in
 * app/api/stripe/create-checkout/route.ts) until there's real usage data
 * from Standard/Pro customers to safely quote custom Enterprise deals.
 *
 * NOTE: Credit pack IDs below are SANDBOX values and will NOT work in production.
 * To enable credit packs, create LIVE products in the Stripe dashboard and
 * replace the CREDITS_* IDs with the new LIVE price/product IDs.
 */

export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: 'price_1TCQLpHTpiuftGGEZWt9UJ2Y', // displayed as "Standard" — see naming note above
  PRO_ANNUAL: 'price_1TuEaIHTpiuftGGEslehCB4Y',
  GROWTH_MONTHLY: 'price_1Tv5SpHTpiuftGGEMu4TdOzs', // displayed as "Pro" — new 2026-07-19, no annual price yet
  // ── Added 2026-08-31 ───────────────────────────────────────────────
  // These two are read from the ENVIRONMENT, unlike the hardcoded ids
  // above, and that difference is deliberate. The products exist so far
  // only in the Stripe TEST sandbox; the live-mode products do not exist
  // yet. Hardcoding a test id here would repeat D-39 exactly — sandbox
  // ids sitting in a constant the live key reads. Env-driven means the
  // same code runs against test locally and live in production, with the
  // id supplied per environment.
  //
  // Set STRIPE_PRICE_PLUS_MONTHLY and STRIPE_PRICE_GEO_REPORT in Vercel.
  // Empty string when unset — isPlusPurchasable()/isReportPurchasable()
  // below gate on that, so a missing id disables the product rather than
  // producing a broken checkout.
  PLUS_MONTHLY: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? '',
  GEO_REPORT: process.env.STRIPE_PRICE_GEO_REPORT ?? '',
  ENTERPRISE_MONTHLY: 'price_1TCQNAHTpiuftGGEtIcqclbd', // paused — not in VALID_PLANS, kept for when Enterprise relaunches
  ENTERPRISE_ANNUAL: 'price_1TuEaNHTpiuftGGE9r0fRkWI',
  // Credit-pack price ids REMOVED 2026-08-24. They were SANDBOX values sitting
  // in the live constant: they would have failed against the live Stripe key if
  // anything had ever used them, and they were being shipped to the browser in
  // the client bundle (D-39). CREDIT_PACKS_ENABLED is false and no code path
  // reaches them.
  // To ship credit packs: create LIVE products in Stripe, put the new ids here,
  // and flip CREDIT_PACKS_ENABLED.
  CREDITS_10: '',
  CREDITS_50: '',
  CREDITS_100: '',
} as const;

export const STRIPE_PRODUCT_IDS = {
  PRO: 'prod_UAltLAeJGLVSqI', // "Standard" — see naming note above
  GROWTH: 'prod_UuvJvC2ZKysgfK', // "Pro" — new 2026-07-19
  ENTERPRISE: 'prod_UAluQCvL32SQ3k', // paused
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
      aiToolsAccess: 2,        // 2 free tools
      aiModel: 'haiku',        // Haiku only
    },
  },
  pro: {
    name: 'Standard', // internal key stays 'pro' — see naming note above
    price: 29,
    annualPrice: 278,     // 29 * 12 * 0.8
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    annualPriceId: STRIPE_PRICE_IDS.PRO_ANNUAL,
    features: {
      aiToolsMonthly: 200,     // 200 generations/month
      aiToolsAccess: 12,       // All 12 tools
      aiModel: 'auto',         // Haiku or Sonnet per tool config
    },
  },
  plus: {
    name: 'Plus', // new 2026-08-31 — internal key and display name match
    price: 79,
    annualPrice: undefined, // no annual price yet
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.PLUS_MONTHLY,
    annualPriceId: undefined,
    features: {
      aiToolsMonthly: 200,     // same generation allowance as Standard
      aiToolsAccess: 12,       // All 12 tools
      aiModel: 'auto',
    },
  },
  growth: {
    name: 'Pro', // internal key 'growth' — see naming note above
    price: 199,
    annualPrice: undefined,  // no annual price yet
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.GROWTH_MONTHLY,
    annualPriceId: undefined,
    features: {
      aiToolsMonthly: 1500,    // 1,500 generations/month
      aiToolsAccess: 12,       // All 12 tools
      aiModel: 'auto',         // Haiku or Sonnet per tool config
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    annualPrice: 950,     // 99 * 12 * 0.8 ≈ 950 — kept for reference, not currently sold
    interval: 'month',
    priceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY,
    annualPriceId: STRIPE_PRICE_IDS.ENTERPRISE_ANNUAL,
    comingSoon: true, // paused — not purchasable via self-serve checkout as of 2026-07-19
    features: {
      aiToolsMonthly: -1,      // Unlimited (fair-use capped server-side)
      aiToolsAccess: 12,       // All 12 tools
      aiModel: 'auto',         // Haiku or Sonnet per tool config
    },
  },
} as const;

// Shared display-name map — the internal tier key (db.users.planTier)
// does NOT match the customer-facing name for 'pro'/'growth', see the
// naming note at the top of this file. Import this anywhere a plan name
// is shown as text instead of raw-capitalizing/rendering the internal key.
// Moved to ./plan-names (D-39) so client components can import plan names
// without dragging STRIPE_PRICE_IDS into the browser bundle. Re-exported here
// for existing server-side importers. Do NOT import this from a client
// component — import from '@/lib/stripe/plan-names' instead.
export { PLAN_DISPLAY_NAME } from './plan-names';

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

export type PlanTier = 'free' | 'pro' | 'plus' | 'growth' | 'enterprise';

/**
 * Whether the new products are actually sellable in THIS environment.
 * Both are env-driven (see STRIPE_PRICE_IDS above), so an environment
 * without the id must not advertise or attempt checkout for them.
 */
export function isPlusPurchasable(): boolean {
  return Boolean(STRIPE_PRICE_IDS.PLUS_MONTHLY);
}
export function isReportPurchasable(): boolean {
  return Boolean(STRIPE_PRICE_IDS.GEO_REPORT);
}
export type CreditPackId = typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS];
