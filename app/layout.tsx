import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

const inter = Inter({ subsets: ["latin"] });

// Root-level fallback metadata — used by any route that doesn't define its
// own `metadata`/`generateMetadata` export. Previously claimed a
// "track your visibility in ChatGPT, Claude & Perplexity" AI-visibility
// feature that was never built (same class of fabricated claim removed
// from UseCases.tsx earlier in this project) and named Claude by name in
// public marketing text, which the user does not want disclosed outside
// the legal/compliance pages. Rewritten 2026-07-18 to match the real
// 12-tool product and the corrected copy already used in lib/seo-config.ts.
export const metadata: Metadata = {
  // metadataBase was MISSING entirely until 2026-08-22. Without it Next.js
  // cannot resolve relative Open Graph / Twitter image URLs and emits a build
  // warning on every deploy. It must be the CANONICAL host: shijo.ai issues a
  // 307 to www.shijo.ai, so anything pointing at the bare apex advertises a
  // redirecting URL to crawlers and social scrapers.
  metadataBase: new URL("https://www.shijo.ai"),
  alternates: { canonical: "/" },
  title: "SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social",
  description: "AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email. 2 tools free forever, no credit card required.",
  keywords: "AI marketing tools, AI SEO tools, keyword research, ad copy generator, email sequence generator, social media caption generator",
  openGraph: {
    title: "SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social",
    description: "AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email.",
    url: "https://www.shijo.ai",
    siteName: "SHIJO.AI",
    locale: "en_US",
    type: "website",
    // Without an image the Twitter card below ("summary_large_image") renders
    // blank on every share. 1200x300 is the widest brand asset that exists;
    // a purpose-made 1200x630 would be better and is worth producing.
    images: [
      {
        url: "/brand/shijo-logo-landscape-1200x300.png",
        width: 1200,
        height: 300,
        alt: "SHIJO.AI - AI Marketing Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social",
    description: "AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email.",
    images: ["/brand/shijo-logo-landscape-1200x300.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Consent Mode default state — must run before gtag.js/GTM load so
            both Google Analytics and the Google Ads conversion tag (fired
            via GTM) start in a denied state until CookieConsentBanner grants
            it. Without this, analytics/ad cookies could be set before the
            user has made a choice. */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        {/* Ahrefs Web Analytics (added 2026-08-22).
            Installed directly instead of through GTM: it then loads even if
            GTM is blocked, mis-tagged, or fails — and the GTM container has
            its own outstanding conversion-tracking problem. The data-key is a
            public site identifier, not a secret, and is meant to appear in
            client HTML.

            Deliberately NOT gated behind the cookie banner: Ahrefs Web
            Analytics is cookieless and sets no client-side storage, so it does
            not require prior consent the way analytics_storage / ad_storage
            do. It is still a third-party processor and has been added to the
            sub-processor lists in /privacy and /gdpr-compliance accordingly. */}
        <Script
          id="ahrefs-analytics"
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="H2EA8pp7UdLLwtAcYkdr2A"
          strategy="afterInteractive"
        />
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-NGQVZ78Q');
          `}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NGQVZ78Q"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <AuthProvider>
          <GoogleAnalytics />
          {children}
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
