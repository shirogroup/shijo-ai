import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { getSession } from '@/lib/auth';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/products';
import { PLAN_DISPLAY_NAME } from '@/lib/stripe/plan-names';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

/**
 * GET /api/billing/verify-upgrade
 *
 * WHY THIS EXISTS
 * ---------------
 * New subscribers go through Stripe Checkout, which returns them to
 * /thank-you?session_id=... . That page verifies the session against Stripe and
 * renders <PurchaseTracker>, which fires the `purchase` dataLayer event that
 * GTM's Google Ads conversion tag listens for.
 *
 * EXISTING subscribers who upgrade do NOT take that path. In
 * app/api/stripe/create-checkout/route.ts, the `if (liveSubscription)` branch
 * builds a Stripe Billing Portal `subscription_update_confirm` flow whose
 * after_completion redirect is /dashboard/billing?success=true — never
 * /thank-you. So PurchaseTracker never mounted, and every upgrade was invisible
 * to both Google Ads and GA4. This endpoint is the missing verification step
 * for that path.
 *
 * WHY IT ASKS STRIPE AND NOT OUR OWN DB
 * -------------------------------------
 * users.subscriptionId / users.subscriptionStatus are a mirror that is known to
 * go stale (D-36: Stripe said `active` while our row said `incomplete` for a
 * customer who had paid). Anything that decides whether real money changed
 * hands must ask Stripe directly. Only stripeCustomerId is read from our row,
 * because that is the lookup key, not the fact being verified.
 *
 * WHAT MAKES A PURCHASE COUNTABLE HERE
 * ------------------------------------
 *  1. There is a signed-in user, and they own the Stripe customer.
 *  2. That customer has an active subscription.
 *  3. Its latest invoice is actually PAID with a non-zero amount. A downgrade
 *     or a $0 proration is a plan change, not a purchase, and must not count.
 *  4. That invoice was created in the last hour. Without this, someone who
 *     bookmarks /dashboard/billing?success=true would mint a fresh conversion
 *     every time a renewal invoice appeared, attributed to whenever they
 *     happened to open the bookmark.
 *
 * The invoice id is the transaction id, deliberately: it is unique per billing
 * event, so a genuine second upgrade counts again, while a page refresh dedupes
 * on Google's side. (The subscription id would collapse every future upgrade
 * into one conversion.)
 */

const PRICE_TO_PLAN: Record<string, string> = {
  [STRIPE_PRICE_IDS.PRO_MONTHLY]: 'pro',
  [STRIPE_PRICE_IDS.PRO_ANNUAL]: 'pro',
  [STRIPE_PRICE_IDS.GROWTH_MONTHLY]: 'growth',
};

// How recent the paid invoice must be to be treated as "they just did this".
const MAX_INVOICE_AGE_SECONDS = 60 * 60;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ verified: false });
    }

    const stripe = getStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
      expand: ['data.latest_invoice'],
    });

    const subscription = subs.data[0];
    if (!subscription) {
      return NextResponse.json({ verified: false });
    }

    const invoice = subscription.latest_invoice as Stripe.Invoice | null;
    if (!invoice || typeof invoice === 'string') {
      return NextResponse.json({ verified: false });
    }

    // Real money, actually collected.
    const amountPaid = invoice.amount_paid ?? 0;
    if (invoice.status !== 'paid' || amountPaid <= 0) {
      return NextResponse.json({ verified: false });
    }

    // Recent enough to be this visit's purchase.
    const ageSeconds = Math.floor(Date.now() / 1000) - (invoice.created ?? 0);
    if (ageSeconds > MAX_INVOICE_AGE_SECONDS) {
      return NextResponse.json({ verified: false });
    }

    const priceId = subscription.items.data[0]?.price?.id ?? '';
    const planKey = PRICE_TO_PLAN[priceId] ?? user.planTier ?? 'pro';
    const interval =
      subscription.items.data[0]?.price?.recurring?.interval === 'year'
        ? 'annual'
        : 'monthly';

    return NextResponse.json({
      verified: true,
      purchase: {
        transactionId: invoice.id,
        value: amountPaid / 100,
        currency: (invoice.currency || 'usd').toUpperCase(),
        planKey,
        planName: PLAN_DISPLAY_NAME[planKey] || 'your new plan',
        interval,
        // For Enhanced Conversions. This is the signed-in user's own address,
        // already loaded above and already theirs — no extra lookup, and it
        // never reaches the page for anyone but the account owner.
        email: user.email ?? undefined,
      },
    });
  } catch (error) {
    return serverErrorResponse('VUP', 'Upgrade verification failed', error);
  }
}
