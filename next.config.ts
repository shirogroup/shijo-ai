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
