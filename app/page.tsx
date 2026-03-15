import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { TrustBadges } from '@/components/landing/TrustBadges';
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '500',
  },
  description: 'AI-powered SEO and marketing toolkit with 24 tools for social media, content, ads, email, and search optimization.',
  featureList: [
    'AI-powered caption and content generation',
    'SEO keyword research and meta tag optimization',
    'Ad copy and landing page generation',
    'Email sequence and subject line creation',
    'Content repurposing and video scripts',
  ],
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
          <TrustBadges />
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
