import { Metadata } from 'next';
import Link from 'next/link';
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
 * generatePageMetadata(): that helper is only wired to app/page.tsx (home),
 * so adding an entry there would be dead config — which that file's own
 * comments already warn about.
 *
 * SEO note (2026-09-02): this page leads on "AI visibility" (3,300/mo, low
 * difficulty), which is the transactional term for the thing the checker does.
 * The definitional intent for the same phrase is served by
 * /faq/what-is-ai-visibility, so the two do not compete for the same result.
 * "Generative Engine Optimization" and "Answer Engine Optimization" are each
 * spelled out exactly once below, with their acronyms, and each links to its
 * own explainer rather than being repeated here.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/geo' },
  title: 'AI Visibility Checker — Free AI Search Visibility Tool | SHIJO.AI',
  description:
    'Free AI visibility check: see whether ChatGPT, Gemini, Perplexity and Google AI Overviews name your business when people ask for a recommendation. No signup required.',
  keywords: [
    'ai visibility',
    'ai visibility checker',
    'ai search visibility tools',
    'generative engine optimization',
    'answer engine optimization',
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
              AI visibility: when someone asks AI for a recommendation, do you come up?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI visibility is whether ChatGPT, Gemini, Perplexity and Google AI
              Overviews name your business in the answers they write. We ask
              those answer engines the questions your customers actually ask —
              then show you, engine by engine, whether you were named. No
              account needed.
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-5">
              The work of earning those mentions goes by two names:{' '}
              <Link href="/faq/what-is-generative-engine-optimization" className="text-primary hover:underline">
                Generative Engine Optimization (GEO)
              </Link>
              , making your content likely to be drawn on when an engine composes
              an answer, and{' '}
              <Link href="/faq/what-is-answer-engine-optimization" className="text-primary hover:underline">
                Answer Engine Optimization (AEO)
              </Link>
              , structuring a page so a direct answer can be lifted out of it.
              This is one of the free{' '}
              <Link href="/faq/ai-search-visibility-tools" className="text-primary hover:underline">
                AI search visibility tools
              </Link>{' '}
              for measuring where you stand today.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <GeoChecker />
        </section>

        <section className="container mx-auto px-6 pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">
              New to this?
            </h2>
            <p className="text-sm text-muted-foreground">
              Start with{' '}
              <Link href="/faq/what-is-ai-visibility" className="text-primary hover:underline">
                what AI visibility is
              </Link>
              , or read{' '}
              <Link href="/faq/geo-vs-aeo-vs-seo" className="text-primary hover:underline">
                how GEO, AEO and SEO differ
              </Link>
              . All answers are in the{' '}
              <Link href="/faq" className="text-primary hover:underline">
                AI visibility explainers
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
