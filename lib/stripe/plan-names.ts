/**
 * Customer-facing plan names — CLIENT-SAFE.
 *
 * Split out of lib/stripe/products.ts on 2026-08-24 (D-39).
 *
 * Six client components (`'use client'`) imported PLAN_DISPLAY_NAME — and ONLY
 * PLAN_DISPLAY_NAME — from products.ts. None of them referenced STRIPE_PRICE_IDS.
 * But because both lived in the same module, the bundler shipped the whole file
 * into layout-*.js, putting all 8 Stripe price ids in front of every visitor,
 * including the paused ENTERPRISE_* prices and the sandbox CREDITS_* ids.
 *
 * A live scan of the deployed bundle found them; an earlier audit had claimed
 * the opposite, and that false claim was used to justify downgrading the
 * severity of the missing checkout allowlist. Real-world risk is low — price
 * ids are not secrets, and the server-side allowlist is what actually enforces
 * which plans are purchasable — but a client bundle should not carry ids for
 * products a customer cannot buy.
 *
 * RULE: keep this module free of price ids, secret keys and any other
 * server-side constant. Client components import plan names from HERE.
 *
 * Naming note: the $29 tier is internally 'pro' and displayed as "Standard";
 * the $199 tier is internally 'growth' and displayed as "Pro". Never hand-roll
 * this mapping — see D-21, where a ternary chain showed $199 customers
 * "Free Plan".
 */
export const PLAN_DISPLAY_NAME: Record<string, string> = {
  free: 'Free',
  pro: 'Standard',
  // Added 2026-08-31. 'plus' is the one tier whose internal key and display
  // name match, which is easy to misread as a mistake given 'pro'->Standard
  // and 'growth'->Pro sitting either side of it. It is correct: Plus is a new
  // tier with no legacy key to preserve.
  plus: 'Plus',
  growth: 'Pro',
  enterprise: 'Enterprise',
};
