'use client';

import { useEffect } from 'react';

/**
 * Pushes the `purchase` event that GTM's Google Ads conversion tag listens for.
 *
 * This component is only rendered by app/thank-you/page.tsx after the purchase
 * has been verified against Stripe AND confirmed to belong to the signed-in
 * user. It does no checking of its own — if it renders, the sale is real.
 *
 * GTM SETUP (the tag is configured in the GTM console, not here):
 *   Trigger  — Custom Event, event name `purchase`
 *   Tag      — Google Ads Conversion Tracking, Conversion ID 18330533913,
 *              Label <the Purchase action's own label from Google Ads>
 *   Fields   — value {{DLV - value}}, currency {{DLV - currency}},
 *              transaction_id {{DLV - transaction_id}}
 *
 * This mirrors the `sign_up_complete` event already wired up in
 * components/auth/RegisterForm.tsx, which fires the Sign Up conversion the same
 * way — same pattern, different event name and label.
 *
 * DO NOT trigger the tag on a Page View of /thank-you. The URL is guessable and
 * the page is reachable by anyone; a pageview trigger would let crawlers, the
 * PMax landing-page checker, and our own testing mint conversions that Smart
 * Bidding would then learn from.
 */

type Purchase = {
  transactionId: string;
  value: number;
  currency: string;
  planKey: string;
  planName: string;
  interval: string;
};

export default function PurchaseTracker({ purchase }: { purchase: Purchase }) {
  useEffect(() => {
    // Belt and braces on top of Google's own transaction_id deduplication:
    // a refresh re-runs this effect, and sessionStorage stops the second push
    // ever reaching the dataLayer. Wrapped because storage throws outright in
    // some privacy modes.
    const key = `shijo_purchase_sent:${purchase.transactionId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Storage unavailable. Fall through and rely on transaction_id dedupe.
    }

    // Window.dataLayer is already declared globally (as unknown[]) in
    // components/CookieConsentBanner.tsx. Do NOT redeclare it here with a
    // narrower element type — TypeScript merges global interfaces across the
    // whole project and rejects conflicting declarations, which fails the
    // build. Use the existing declaration.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'purchase',
      transaction_id: purchase.transactionId,
      value: purchase.value,
      currency: purchase.currency,
      plan: purchase.planKey,
      plan_name: purchase.planName,
      billing_interval: purchase.interval,
      items: [
        {
          item_id: purchase.planKey,
          item_name: `SHIJO.AI ${purchase.planName}`,
          item_category: 'subscription',
          price: purchase.value,
          quantity: 1,
        },
      ],
    });
  }, [purchase]);

  return null;
}
