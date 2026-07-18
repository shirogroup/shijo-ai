import { Metadata } from 'next';
import { LandingPageContent } from '@/components/lp/LandingPageContent';

export const metadata: Metadata = {
  title: 'AI Marketing Tools for SEO, Ads, Email & Social | SHIJO.AI',
  description: 'AI marketing platform with 12 tools: keyword research, AI ad copy generator, email sequence generator, and social media caption generator. 2 tools free forever, no credit card required.',
  keywords: [
    'ai marketing tools', 'ai marketing platform', 'keyword research tool',
    'ai ad copy generator', 'ai email sequence generator', 'social media caption generator',
    'ai tools for digital marketers', 'all in one ai marketing tool',
  ],
  alternates: { canonical: 'https://shijo.ai/lp' },
  // Serves double duty as the Google Ads "Final URL" and an organic
  // landing page — indexed on purpose so it can also earn search traffic
  // for the broader "ai marketing tools" phrases the ad campaign targets.
  robots: { index: true, follow: true },
  openGraph: {
    title: 'AI Marketing Tools for SEO, Ads, Email & Social | SHIJO.AI',
    description: '12 AI-powered marketing tools in one platform. 2 tools free forever, no credit card required.',
    url: 'https://shijo.ai/lp',
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
    highPrice: '99',
    priceCurrency: 'USD',
  },
  description: 'AI marketing platform with 12 tools for keyword research, AI ad copy, email sequences, and social media captions.',
};

export default function LandingPage() {
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
