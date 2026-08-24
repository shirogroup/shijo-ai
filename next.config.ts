import type { NextConfig } from "next";

/**
 * Security response headers (added 2026-08-23 after a live audit found that
 * only `strict-transport-security` was being sent — no framing protection,
 * no MIME-sniffing protection, no referrer policy).
 *
 * Deliberately NOT included here: a blocking `Content-Security-Policy`.
 * This site loads Google Tag Manager, gtag.js, Ahrefs Analytics and (at
 * checkout) Stripe, several of which inject scripts at runtime. Shipping a
 * strict CSP untested would risk silently breaking conversion tracking or
 * checkout on a live payment flow. The right sequence is: add
 * `Content-Security-Policy-Report-Only` first, collect violations for a
 * week, then enforce. Tracked as a follow-up, not skipped.
 */
const securityHeaders = [
  // Clickjacking: /dashboard must not be embeddable by another origin.
  // NOTE: verify GTM Preview / Tag Assistant still works after this ships —
  // older Tag Assistant versions framed the site under test.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop the browser second-guessing declared Content-Types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which can carry query params) to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No page on this site needs camera, mic or geolocation.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // D-6, second half. REPORT-ONLY on purpose: this header changes NOTHING about
  // what the browser loads — it only makes the console log what a real policy
  // WOULD have blocked. The site pulls in Google Tag Manager, gtag, Ahrefs
  // analytics and Stripe, so an enforcing policy written blind would silently
  // break analytics, conversion tracking or checkout, and the failure mode is
  // invisible until someone notices revenue data missing.
  //
  // HOW TO FINISH THIS (do not skip to enforcing):
  //   1. Ship this, then browse the site — home, pricing, a tool, checkout —
  //      with the console open, and collect every violation reported.
  //   2. Add the hosts that are genuinely needed to the directives below.
  //   3. Only once a full pass reports zero violations, rename the header to
  //      "Content-Security-Policy" to start enforcing.
  //
  // 'unsafe-inline'/'unsafe-eval' are present because GTM injects inline
  // script; tightening to nonces is a separate piece of work and must not
  // block getting visibility now.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.google.com https://analytics.ahrefs.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.google-analytics.com https://*.googletagmanager.com https://*.analytics.google.com https://analytics.ahrefs.com https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com https://*.googletagmanager.com",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    return [
      // /lp was the original slug for the AI marketing tools landing page;
      // renamed 2026-07-18 to a real, searched phrase per user request.
      // Kept as a permanent redirect in case it was ever shared/bookmarked.
      {
        source: "/lp",
        destination: "/ai-marketing-tools",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
