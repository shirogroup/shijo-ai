import { Metadata } from 'next';
import Link from 'next/link';
import { getStripeClient } from '@/lib/stripe';
import { getSession } from '@/lib/auth';
import { PLAN_DISPLAY_NAME } from '@/lib/stripe/plan-names';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import PurchaseTracker from '@/components/PurchaseTracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Purchase confirmation page — and the ONLY place a purchase conversion fires.
 *
 * Created 2026-09-01 for Google Ads conversion tracking. Two things about the
 * design are deliberate and should not be "simplified" later:
 *
 * 1. THE PAGEVIEW IS NOT THE CONVERSION. The brief asked for the tag to fire on
 *    a purchase *or* on a visit to this URL. Firing on the visit would mean
 *    anyone who types the address fires a conversion — as would Googlebot, the
 *    Performance Max landing-page checker, every refresh, and us the first time
 *    we tested it. Smart Bidding *learns* from conversions, so fabricated ones
 *    are worse than none: they teach the algorithm to buy the wrong traffic.
 *    So the page verifies the purchase against Stripe first, and only a real,
 *    paid, matching session pushes the `purchase` event GTM listens for.
 *
 * 2. VERIFICATION IS SERVER-SIDE AND OWNERSHIP-CHECKED. A session id is not a
 *    secret — it travels in a URL. Checking only "does this session exist and
 *    is it paid" would let anyone replay a stranger's id (or their own, from a
 *    previous month) to mint conversions. The session's `metadata.userId` must
 *    match the signed-in user.
 *
 * Failure is silent by design. Missing id, unknown id, unpaid session, someone
 * else's purchase, or Stripe being unreachable all render a perfectly nice page
 * that simply reports nothing. Under-counting is recoverable. Inventing a
 * conversion is not.
 */

export const metadata: Metadata = {
  title: 'Thank you for your purchase | SHIJO.AI',
  description: 'Your SHIJO.AI subscription is active. Here is what happens next.',
  // Excluded from search on purpose: this is a post-payment endpoint, not a
  // landing page. It is also excluded in app/robots.ts and absent from
  // app/sitemap.ts — all three are needed, because a noindex tag only works if
  // the crawler is allowed to fetch the page and read it.
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: 'https://www.shijo.ai/thank-you' },
};

type VerifiedPurchase = {
  transactionId: string;
  value: number;
  currency: string;
  planKey: string;
  planName: string;
  interval: string;
};

/**
 * Ask Stripe whether this really was a completed purchase by this user.
 * Returns null for every failure mode — the caller must treat null as
 * "show the page, count nothing".
 */
async function verifyPurchase(
  sessionId: string | undefined,
  userId: string | undefined
): Promise<VerifiedPurchase | null> {
  if (!sessionId || !userId) return null;

  // Cheap shape check before spending a Stripe round trip on obvious junk.
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    // `status: complete` covers subscriptions, where payment_status can lag.
    const paid =
      session.payment_status === 'paid' || session.status === 'complete';
    if (!paid) return null;

    // Ownership. Both checkout routes write userId into session metadata.
    if (session.metadata?.userId !== userId) return null;

    const planKey = session.metadata?.plan || 'pro';
    const interval = session.metadata?.interval || 'monthly';

    return {
      // Stripe's own session id is the transaction id. Google dedupes on this,
      // so even if a refresh somehow re-pushed, the conversion counts once.
      transactionId: session.id,
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency || 'usd').toUpperCase(),
      planKey,
      planName: PLAN_DISPLAY_NAME[planKey] || 'your new plan',
      interval,
    };
  } catch {
    // Stripe unreachable or id unknown. Say thank you, report nothing.
    return null;
  }
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const session = await getSession();
  const purchase = await verifyPurchase(sessionId, session?.userId);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {purchase ? (
            <>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                Payment confirmed
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Thank you — you&apos;re on {purchase.planName}.
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Your subscription is active and all 12 AI marketing tools are
                unlocked. A receipt is on its way to your email.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 mb-8">
                <dl className="grid grid-cols-2 gap-y-3 text-sm">
                  <dt className="text-gray-500">Plan</dt>
                  <dd className="text-gray-900 font-medium text-right">
                    {purchase.planName}
                  </dd>
                  <dt className="text-gray-500">Billed</dt>
                  <dd className="text-gray-900 font-medium text-right">
                    {purchase.currency} {purchase.value.toFixed(2)}
                    {purchase.interval === 'annual' ? ' / year' : ' / month'}
                  </dd>
                </dl>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                What to do first
              </h2>
              <ol className="space-y-2 text-gray-600 mb-10 list-decimal list-inside">
                <li>Open any tool and give it your product and audience.</li>
                <li>
                  Check where you stand in AI answers with the AI visibility
                  checker.
                </li>
                <li>Manage billing or switch plans any time from Billing.</li>
              </ol>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Go to your dashboard
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  View billing
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Thanks for stopping by
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                We couldn&apos;t find a completed purchase for this link. If you
                have just paid, your plan may take a moment to appear — check
                your billing page, and the receipt in your email. If something
                looks wrong, tell us and we&apos;ll sort it out.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Check your billing
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Contact support
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Only rendered for a verified purchase. No verification, no event. */}
      {purchase && <PurchaseTracker purchase={purchase} />}
    </>
  );
}
