import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { UseCases } from '@/components/landing/UseCases';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata = generatePageMetadata('home');

// JSON-LD Structured Data
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
  description: 'AI-powered SEO and marketing toolkit with 12 tools for social media, SEO, ads, and email.',
  featureList: [
    'AI-powered caption generation',
    'SEO keyword research and content briefs',
    'AI Overview / AI search optimization',
    'Ad copy and landing page generation',
    'Email sequence and newsletter creation',
  ],
  // aggregateRating intentionally removed — no review system exists in the
  // product (no reviews table in db/schema.ts). The prior 4.8/500 value was
  // fabricated; Google can issue a manual action for review-snippet abuse
  // if structured-data ratings aren't backed by real reviews. Re-add only
  // once a real review/rating system is built and populated with data.
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-background">
        <Header />
        <article>
          <Hero />
          <Features />
          <UseCases />
          <Pricing />
          <CTASection />
        </article>
        <Footer />
      </main>
    </>
  );
}
