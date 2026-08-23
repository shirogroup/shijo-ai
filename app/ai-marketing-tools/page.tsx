import { Metadata } from 'next';
import { LandingPageContent } from '@/components/lp/LandingPageContent';

export const metadata: Metadata = {
  title: 'AI Marketing Tools for SEO, Ads, Email & Social | SHIJO.AI',
  description: 'AI marketing platform with 12 tools for keyword research, ad copy, email sequences and social captions. 2 tools free forever, no credit card needed.',
  keywords: [
    'ai marketing tools', 'ai marketing platform', 'keyword research tool',
    'ai ad copy generator', 'ai email sequence generator', 'social media caption generator',
    'ai tools for digital marketers', 'all in one ai marketing tool',
  ],
  alternates: { canonical: 'https://shijo.ai/ai-marketing-tools' },
  // Serves double duty as the Google Ads "Final URL" and an organic
  // landing page — indexed on purpose so it can also earn search traffic
  // for the "ai marketing tools" phrase the ad campaign targets. URL
  // itself (2026-07-18: renamed from /lp) is now a real, searched phrase
  // rather than an internal-sounding slug, per user request.
  robots: { index: true, follow: true },
  openGraph: {
    // Next.js does NOT merge openGraph field-by-field: a page defining its own
    // openGraph block replaces the root layout's entirely, images included.
    // Without this the page ships no og:image at all, which is what Ahrefs
    // flagged as "Open Graph tags incomplete" (2026-08-22).
    images: [{ url: '/brand/shijo-logo-landscape-1200x300.png', width: 1200, height: 300 }],
    title: 'AI Marketing Tools for SEO, Ads, Email & Social | SHIJO.AI',
    description: '12 AI-powered marketing tools in one platform. 2 tools free forever, no credit card required.',
    url: 'https://shijo.ai/ai-marketing-tools',
    siteName: 'SHIJO.AI',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SHIJO.ai',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    // Highest PURCHASABLE plan. Was '99' (retired Enterprise price) until
    // 2026-08-22 — it kept advertising a price nobody could buy. Enterprise
    // is "Coming Soon" and deliberately absent from structured data.
    highPrice: '199',
    priceCurrency: 'USD',
    // Required by Google for AggregateOffer — its absence is what produced the
    // "rich results validation error" in the Ahrefs audit (2026-08-22).
    // Free, Standard and Pro are purchasable; Enterprise is "Coming Soon"
    // and deliberately excluded from the count.
    offerCount: '3',
  },
  description: 'AI marketing platform with 12 tools for keyword research, AI ad copy, email sequences, and social media captions.',
};

export default function AiMarketingToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageContent />
    </>
  );
}
