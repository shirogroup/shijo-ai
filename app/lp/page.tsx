import { Metadata } from 'next';
import { LandingPageContent } from '@/components/lp/LandingPageContent';

export const metadata: Metadata = {
  title: 'AI Marketing Tools — SEO, Ads, Email & Social Copy | SHIJO.AI',
  description: '12 AI-powered marketing tools for SEO, ad copy, email sequences, and social captions. 2 tools free forever, no credit card required.',
  // Paid-traffic landing page — kept out of the organic index so it doesn't
  // compete with / dilute the homepage in search; it exists to be the Final
  // URL for ad campaigns, not to be found organically.
  robots: { index: false, follow: true },
};

export default function LandingPage() {
  return <LandingPageContent />;
}
