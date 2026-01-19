import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { TrustBadges } from '@/components/landing/TrustBadges';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'SHIJO.ai - AI-Powered SEO Platform | Enterprise Keyword Research',
  description: 'Enterprise-grade SEO automation. Track visibility in ChatGPT, Claude & Perplexity. AI-powered keyword research and SERP analysis for modern marketers.',
  keywords: 'AI SEO tools, keyword research software, AI search visibility, enterprise SEO, SEO automation',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <TrustBadges />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}
