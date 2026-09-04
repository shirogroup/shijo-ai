'use client';

import { useEffect } from 'react';
import { event as gaEvent } from '@/lib/analytics';

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
  /**
   * The buyer's email, for Google Ads ENHANCED CONVERSIONS.
   *
   * Why this exists (added 2026-09-04): the Purchase conversion action in
   * Google Ads read "Enhanced Conversions: Not configured" because the tag had
   * no user-provided data to send. Without it, a conversion can only be matched
   * to an ad click by cookie — and when the cookie is missing, blocked or
   * expired, the sale is simply never attributed and the conversion is lost.
   * Enhanced Conversions gives Google a second way to match: a hashed email.
   *
   * NOT hashed here on purpose. Google normalises and SHA-256 hashes it in
   * the browser before anything leaves the page — that is the documented
   * Enhanced Conversions contract for the unhashed `email` key. Do not
   * pre-hash it; that is a different key (`sha256_email_address`) and mixing
   * the two makes Google hash the hash, so every match fails.
   *
   * Optional: if the email is ever unavailable the conversion still fires,
   * just without the extra matching signal.
   */
  email?: string;
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
    // ── 1. GA4, via gtag ───────────────────────────────────────────────
    // Added 2026-09-01 because GA4 was not recording payments.
    //
    // The dataLayer push below is for Google Tag Manager. gtag.js does NOT
    // interpret arbitrary dataLayer objects as events — it only acts on
    // gtag() calls — and GA4 is loaded on this site directly via gtag.js in
    // app/layout.tsx, NOT through GTM. So a dataLayer push alone is data
    // sitting on the page that GA4 never sees. The only other way GA4 would
    // hear about it is a GA4 Event tag inside the GTM container firing on the
    // `purchase` custom event, and the container has no such tag.
    //
    // Calling gtag directly also means GA4 keeps recording purchases even if
    // the GTM container is later changed or misconfigured.
    //
    // ⚠️ IF A GA4 EVENT TAG IS EVER ADDED IN GTM ON THE `purchase` TRIGGER,
    // REMOVE THIS CALL — otherwise GA4 receives the purchase twice. (GA4
    // de-duplicates on transaction_id, so the damage is limited, but two
    // sources for one event is a trap for whoever debugs it next.)
    gaEvent('purchase', {
      transaction_id: purchase.transactionId,
      value: purchase.value,
      currency: purchase.currency,
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

    // ── 2. Google Tag Manager, via dataLayer ───────────────────────────
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'purchase',
      // Enhanced Conversions payload.
      //
      // The key MUST be `email`, not `email_address`. Google's manual GTM
      // setup doc (support.google.com/google-ads/answer/12785317) lists the
      // accepted unhashed dataLayer keys as `email`, `phone_number` and
      // `address.*`; `sha256_email_address` is the PRE-HASHED variant and is a
      // different contract. Sending `email_address` unhashed matches nothing
      // and Enhanced Conversions silently stays empty.
      //
      // Unhashed on purpose: Google normalises and SHA-256 hashes it in the
      // browser before it leaves the page. Pre-hashing here would make Google
      // hash the hash and every match would fail.
      //
      // GTM reads this via a User-Provided Data variable (manual
      // configuration) whose Email field points at a Data Layer Variable for
      // `user_data.email`.
      user_data: purchase.email ? { email: purchase.email } : undefined,
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
