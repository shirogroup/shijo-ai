import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GeoChecker } from './GeoChecker';

/**
 * /geo — public, unauthenticated AI visibility checker.
 *
 * Deliberately NOT under /dashboard, so middleware.ts (matcher:
 * ['/dashboard/:path*', '/admin/:path*']) never runs on it and no login is
 * required. Do not move this route under /dashboard without also changing
 * that expectation.
 *
 * Metadata is declared inline rather than through lib/seo-config.ts's
 * generatePageMetadata(): that file is under an ads freeze this pass, and
 * its pages.features / pages.dashboard entries currently declare canonicals
 * pointing at 404s. Adding to it would mean touching a frozen file.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/geo' },
  title: 'Free AI Visibility Checker — See if AI Search Recommends You | SHIJO.AI',
  description:
    'Free check: see whether ChatGPT, Gemini, Perplexity, Claude and Google AI Overviews mention your business when people ask for local recommendations. No signup required.',
  keywords: [
    'ai visibility checker',
    'generative engine optimization',
    'geo checker',
    'ai search visibility',
    'does chatgpt recommend my business',
  ],
  robots: { index: true, follow: true },
};

export default function GeoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-6 py-16 md:py-20 text-center">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase text-primary mb-4">
              Free AI Visibility Check
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
              When someone asks AI for a recommendation, do you come up?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We ask five answer engines the questions your customers actually
              ask — then show you, engine by engine, whether your business was
              named. No account needed.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <GeoChecker />
        </section>
      </main>
      <Footer />
    </>
  );
}
