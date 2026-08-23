import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { getSession } from '@/lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/products';

export const runtime = 'nodejs';

const stripe = getStripeClient();

export async function POST(req: NextRequest) {
  try {
    // Auth check — use session userId, never trust body
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in first' },
        { status: 401 }
      );
    }

    const { priceId, mode = 'subscription' } = await req.json();

    // Allowlist. Until 2026-08-23 this route forwarded whatever `priceId` and
    // `mode` the client sent straight to Stripe, with no validation — unlike its
    // sibling /api/stripe/create-checkout, which checks `plan` against a
    // server-side list. A live probe with a bogus id returned 500 from Stripe,
    // not 400 from us, which is how we know nothing here was checking. No price
    // ids are exposed in the client bundle (verified), so this was never
    // directly exploitable — but "not discoverable" is not an access control.
    // Deliberately NOT Object.values(STRIPE_PRICE_IDS): that constant also holds
    // the paused ENTERPRISE_* prices and the sandbox CREDITS_* ids. Allowlisting
    // all of them would silently re-enable self-serve Enterprise checkout, which
    // VALID_PLANS in the sibling route exists to prevent. This list mirrors
    // VALID_PLANS exactly — the three prices a customer may actually buy.
    const ALLOWED_PRICE_IDS: string[] = [
      STRIPE_PRICE_IDS.PRO_MONTHLY,     // "Standard" $29/mo
      STRIPE_PRICE_IDS.PRO_ANNUAL,      // "Standard" $278/yr
      STRIPE_PRICE_IDS.GROWTH_MONTHLY,  // "Pro" $199/mo
    ];

    if (priceId && !ALLOWED_PRICE_IDS.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    if (mode !== 'subscription' && mode !== 'payment') {
      return NextResponse.json(
        { error: 'Invalid checkout mode' },
        { status: 400 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing required field: priceId' },
        { status: 400 }
      );
    }

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

    let customerId = user.stripeCustomerId;

    // A stored Stripe customer ID can go stale — e.g. it was created
    // under a different Stripe mode/account (test vs. live) than the key
    // currently configured, or the customer was deleted directly in
    // Stripe. Verify it still resolves before reusing it; without this
    // check, checkout fails permanently for that user with no recovery
    // path. See the identical fix in app/api/stripe/create-checkout/route.ts.
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

      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode as 'subscription' | 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/billing?success=true`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
      // Disabled 2026-08-23: Stripe has **no coupons** on this account, so the
      // field rendered, accepted input, and rejected every code — at the exact
      // moment the customer had their card out. Flip back to true the day a
      // real promotion code exists.
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    return serverErrorResponse('CHK', 'Checkout session creation error', error, 'Could not start checkout.');
  }
}
