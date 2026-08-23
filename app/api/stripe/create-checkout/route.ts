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

    // Create Checkout Session
    const priceId = VALID_PLANS[plan][interval as 'monthly' | 'annual'];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';

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
      cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
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
