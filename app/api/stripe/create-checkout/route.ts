import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/products';
import { refCode } from '@/lib/api/errors';

export const runtime = 'nodejs';

// Enterprise is intentionally NOT in this map — paused as of 2026-07-19
// (Free/Standard/Pro/Enterprise restructure, zero customers on any plan
// at the time, confirmed via Stripe). A request for plan: 'enterprise'
// is rejected below with the same "Invalid plan selected" error as any
// other unrecognized plan name — this is the server-side enforcement,
// independent of whatever the pricing page UI shows.
const VALID_PLANS: Record<string, Partial<Record<'monthly' | 'annual', string>>> = {
  pro: {
    monthly: STRIPE_PRICE_IDS.PRO_MONTHLY, // displayed as "Standard"
    annual: STRIPE_PRICE_IDS.PRO_ANNUAL,
  },
  growth: {
    monthly: STRIPE_PRICE_IDS.GROWTH_MONTHLY, // displayed as "Pro" — no annual price yet
  },
};

// 'plus' ($79, added 2026-08-31) is registered only when its price id is
// actually present in the environment. STRIPE_PRICE_IDS.PLUS_MONTHLY is
// env-driven because the product currently exists in the Stripe TEST sandbox
// only — see the note in lib/stripe/products.ts. Registering it
// unconditionally would let a customer reach a checkout for a price id that
// is an empty string on this environment, which Stripe rejects with an opaque
// error. Absent id => plan simply is not purchasable here, and the existing
// "Invalid plan selected" 400 covers it.
if (STRIPE_PRICE_IDS.PLUS_MONTHLY) {
  VALID_PLANS.plus = { monthly: STRIPE_PRICE_IDS.PLUS_MONTHLY };
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in first' },
        { status: 401 }
      );
    }

    const { plan, interval = 'monthly' } = await req.json();

    if (interval !== 'monthly' && interval !== 'annual') {
      return NextResponse.json(
        { error: 'Invalid billing interval' },
        { status: 400 }
      );
    }

    if (!plan || !VALID_PLANS[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // 'growth' (Pro) has no annual price yet — VALID_PLANS[plan] can be a
    // partial map, so check the specific interval resolves before using it.
    if (!VALID_PLANS[plan][interval as 'monthly' | 'annual']) {
      return NextResponse.json(
        { error: 'This plan is not available on that billing interval yet' },
        { status: 400 }
      );
    }

    // Get user from DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent double-upgrade
    if (user.planTier === plan) {
      return NextResponse.json(
        { error: `You are already on the ${plan} plan` },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripe = getStripeClient();
    let customerId = user.stripeCustomerId;

    // A stored Stripe customer ID can go stale — e.g. it was created
    // under a different Stripe mode/account (test vs. live) than the key
    // currently configured, or the customer was deleted directly in
    // Stripe. Verify it still resolves before reusing it; without this
    // check, checkout fails permanently for that user with no recovery
    // path (this is the exact cause of "No such customer" errors seen
    // in production).
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as { deleted?: boolean }).deleted) {
          customerId = null;
        }
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to DB
      await db
        .update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const priceId = VALID_PLANS[plan][interval as 'monthly' | 'annual'];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';

    if (!priceId) {
      return NextResponse.json(
        { error: 'This plan is not available on that billing interval yet' },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────────────────
    // ALREADY SUBSCRIBED -> Stripe-hosted PLAN CHANGE, never a 2nd checkout
    //
    // The guard above only blocks re-buying the SAME plan. Without this
    // branch, a Standard customer clicking "Upgrade to Plus" got a fresh
    // Checkout Session, and nothing in lib/stripe/webhook-handlers.ts
    // cancels the old subscription — handleSubscriptionCreated just writes
    // the new one and updates planTier. The customer would have been billed
    // $29 AND $79 while the app showed them as Plus.
    //
    // A Billing Portal session with flow_data.subscription_update_confirm
    // lands them on a Stripe-hosted confirm screen for exactly this price:
    // one click from wherever they were, proration handled by Stripe, and
    // the existing subscription is UPDATED rather than duplicated.
    //
    // If that flow cannot be created we deliberately do NOT fall through to
    // Checkout — falling through is precisely the double-billing bug. We
    // fail with a message pointing at Manage Subscription instead.
    // ────────────────────────────────────────────────────────────────────
    const LIVE_SUB_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];
    if (user.subscriptionId && LIVE_SUB_STATUSES.includes(user.subscriptionStatus ?? '')) {
      try {
        const current = await stripe.subscriptions.retrieve(user.subscriptionId);
        const itemId = current.items.data[0]?.id;

        if (!itemId || current.status === 'canceled') {
          throw new Error('no live subscription item');
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${baseUrl}/dashboard/billing`,
          flow_data: {
            type: 'subscription_update_confirm',
            subscription_update_confirm: {
              subscription: user.subscriptionId,
              items: [{ id: itemId, price: priceId, quantity: 1 }],
            },
            after_completion: {
              type: 'redirect',
              redirect: {
                return_url: `${baseUrl}/dashboard/billing?success=true&plan=${plan}`,
              },
            },
          },
        });

        // Same response shape as the checkout branch, so every existing
        // caller (PricingCta, the billing page, the sidebar CTAs, /lp)
        // redirects correctly with no client-side change.
        return NextResponse.json({
          success: true,
          url: portalSession.url,
          mode: 'portal',
        });
      } catch (err) {
        // Most likely cause: the Stripe Billing Portal configuration does not
        // have "Customers can switch plans" enabled, or this product is not
        // in its allowed product list. That is a Stripe Dashboard setting,
        // not a code bug — surface it rather than silently double-billing.
        const ref = refCode('SPU');
        console.error(`[${ref}] subscription_update_confirm failed`, err);
        return NextResponse.json(
          {
            error:
              'Could not open the plan-change screen. Please use Manage Subscription on the billing page.',
            ref,
          },
          { status: 502 }
        );
      }
    }

    // Create Checkout Session — no live subscription, so this is a first purchase

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/billing?success=true&plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=true&plan=${plan}`,
      metadata: {
        userId: user.id,
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          interval,
        },
      },
      // Disabled 2026-08-23 — see the note in app/api/billing/checkout/route.ts.
      // No coupons exist in Stripe, so the field could only ever reject people.
      allow_promotion_codes: false,
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const ref = refCode('SCK');
    console.error(`[${ref}] [STRIPE CHECKOUT] Error:`, message, error);
    return NextResponse.json(
      { error: `Checkout failed: ${message} (Error ref: ${ref})`, errorRef: ref },
      { status: 500 }
    );
  }
}
