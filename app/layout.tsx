import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
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
  title: "SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social",
  description: "AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email. 2 tools free forever, no credit card required.",
  keywords: "AI marketing tools, AI SEO tools, keyword research, ad copy generator, email sequence generator, social media caption generator",
  openGraph: {
    title: "SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social",
    description: "AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email.",
    url: "https://shijo.ai",
    siteName: "SHIJO.AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social",
    description: "AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email.",
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
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <GoogleAnalytics />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
