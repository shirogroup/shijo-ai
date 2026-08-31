/**
 * Shared "checkout intent" helper for the paid funnel.
 *
 * A visitor who clicks "Choose Plus" while logged out has expressed an intent
 * to buy. That intent has to survive a signup or login round trip, and it must
 * do so WITHOUT becoming an open redirect.
 *
 * WHY A SEPARATE ?plan= PARAM RATHER THAN WIDENING ?redirect=
 * LoginForm already guards `?redirect=` by rejecting anything that is not a
 * same-origin path — that guard exists because `/login?redirect=https://evil.example`
 * would otherwise bounce a freshly-authenticated user straight off-site.
 * Carrying the intent as a URL in `?redirect=` would mean relaxing that guard,
 * or encoding a second URL inside it. Instead the intent is a short opaque
 * token validated against the allowlist below. There is no way to express a
 * URL through it, so the open-redirect surface does not grow at all.
 *
 * The allowlist is intentionally the same three keys the server accepts in
 * app/api/stripe/create-checkout/route.ts VALID_PLANS. 'free' is NOT here:
 * the Free CTA must never reach Stripe.
 */

export const CHECKOUT_PLAN_KEYS = ['pro', 'plus', 'growth'] as const;
export type CheckoutPlanKey = (typeof CHECKOUT_PLAN_KEYS)[number];

/** Narrow an untrusted string (query param) to a plan we will actually bill. */
export function parsePlanIntent(raw: string | null | undefined): CheckoutPlanKey | null {
  if (!raw) return null;
  return (CHECKOUT_PLAN_KEYS as readonly string[]).includes(raw)
    ? (raw as CheckoutPlanKey)
    : null;
}

/** Customer-facing labels. Mirrors PLAN_DISPLAY_NAME; kept here so client
 *  components can import it without pulling in Stripe config. */
export const CHECKOUT_PLAN_LABEL: Record<CheckoutPlanKey, string> = {
  pro: 'Standard',
  plus: 'Plus',
  growth: 'Pro',
};

export const CHECKOUT_PLAN_PRICE: Record<CheckoutPlanKey, string> = {
  pro: '$29/mo',
  plus: '$79/mo',
  growth: '$199/mo',
};

export interface StartCheckoutResult {
  ok: boolean;
  /** True when the server said "not signed in" — caller should send them to register. */
  unauthenticated: boolean;
  error?: string;
}

/**
 * POST to the existing create-checkout route and, on success, hand the browser
 * to Stripe. Deliberately reuses that endpoint rather than adding a second
 * one: it already holds the VALID_PLANS allowlist, the interval guard, the
 * double-upgrade check and the Stripe customer reconciliation.
 *
 * Returns instead of throwing so each caller can decide what a failure means —
 * on /pricing it means "go register", on the billing page it means "show an
 * error next to the button".
 */
export async function startCheckout(
  plan: CheckoutPlanKey,
  interval: 'monthly' | 'annual' = 'monthly'
): Promise<StartCheckoutResult> {
  try {
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval }),
    });

    if (res.status === 401) {
      return { ok: false, unauthenticated: true };
    }

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && typeof data.url === 'string') {
      window.location.href = data.url;
      return { ok: true, unauthenticated: false };
    }

    return {
      ok: false,
      unauthenticated: false,
      error: data.error || 'Could not start checkout. Please try again.',
    };
  } catch {
    return { ok: false, unauthenticated: false, error: 'Network error. Please try again.' };
  }
}
