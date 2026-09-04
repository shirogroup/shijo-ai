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
      {/*
        VideoObject structured data. Google's video indexing needs name,
        description, thumbnailUrl, uploadDate, duration (ISO 8601) and
        contentUrl to consider the video eligible; without it the <video> tag
        alone is usually skipped. duration PT58S matches the encoded file
        (58.04s) — keep the two in step if the video is ever re-cut.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: 'AI Visibility, explained',
            description:
              'A 58-second explainer: what AI visibility is, whether ChatGPT, Gemini, Perplexity and Google AI Overviews name your business in the answers they write, how Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) differ, and how to run a free AI visibility check.',
            thumbnailUrl: ['https://www.shijo.ai/videos/ai-visibility-explained-poster.jpg'],
            uploadDate: '2026-09-04T00:00:00-05:00',
            duration: 'PT58S',
            contentUrl: 'https://www.shijo.ai/videos/ai-visibility-explained.mp4',
            embedUrl: 'https://www.shijo.ai/geo',
            isFamilyFriendly: true,
            inLanguage: 'en',
            publisher: {
              '@type': 'Organization',
              name: 'SHIJO.AI',
              url: 'https://www.shijo.ai',
            },
          }),
        }}
      />
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

        {/*
          Instructional video. Added 2026-09-04.

          WHY IT IS HERE AND NOT ON A PAGE OF ITS OWN: Google indexes a video
          when it is prominent, self-hosted or embedded, and described by
          VideoObject structured data on the SAME page. /geo is already the
          canonical, indexed page for this topic, so the video reinforces the
          page that ranks rather than competing with it for the same query.

          ACCURACY: every line spoken on screen is copied verbatim from text
          already published on this page and on the checker below it — the
          engine list, the GEO and AEO definitions, and the "one free scan per
          day" limit. There is no claim in the video that is not already live.

          AUDIO: there is no narration. The video is fully captioned on screen
          and is understood with the sound off; the only audio is a quiet
          original ambient bed (synthesised from scratch for this file, so there
          is no third-party licence attached to it). It never autoplays — the
          element is `controls` only, so nothing makes noise unprompted.

          `preload="none"` keeps the file off the critical path — the poster is
          all that loads until a visitor presses play. That matters here: /geo
          is a live ad landing page.
        */}
        <section className="container mx-auto px-6 pb-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3 text-center">
              Watch: AI visibility in 60 seconds
            </h2>
            <video
              className="w-full rounded-xl border border-border shadow-sm"
              controls
              preload="none"
              playsInline
              poster="/videos/ai-visibility-explained-poster.jpg"
              width={1920}
              height={1080}
            >
              <source src="/videos/ai-visibility-explained.mp4" type="video/mp4" />
              Your browser cannot play this video. It explains what AI visibility
              is, which answer engines SHIJO.AI checks, and how GEO and AEO
              differ — all of which is written out on this page.
            </video>
            <p className="mt-3 text-sm text-muted-foreground text-center">
              A 58-second explainer: what AI visibility is, which answer engines
              we check, and how GEO and AEO differ. No narration — it is
              captioned throughout, so it reads fine with the sound off.
            </p>
          </div>
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
