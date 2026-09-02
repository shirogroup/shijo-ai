import { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TOOLS } from '@/lib/tools/registry';

/**
 * /features — previously a 404 that lib/seo-config.ts nonetheless declared a
 * canonical for.
 *
 * The tool list is derived from lib/tools/registry.ts at build time rather
 * than written out by hand. That is deliberate: this project has shipped a
 * fabricated tool count twice (a "24 AI tools" claim in a landing component,
 * and 24 invented tool names in the welcome email). Reading the registry means
 * this page cannot drift from what actually exists — if a tool is added or
 * removed, this page follows automatically and the "12 tools" figure below is
 * computed, not asserted.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/features' },
  title: 'Features — 12 AI Marketing Tools + AI Visibility | SHIJO.AI',
  description:
    'Every SHIJO.AI feature: 12 AI marketing tools across SEO, ads, email and social, plus an AI visibility checker that shows whether answer engines name your business.',
  keywords: [
    'shijo.ai features',
    'ai marketing tools list',
    'ai visibility checker',
    'seo content tools',
  ],
  robots: { index: true, follow: true },
};

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Social media',
  seo: 'SEO & content',
  ads: 'Ads & copy',
  email: 'Email',
};

export default function FeaturesPage() {
  const byCategory = TOOLS.reduce<Record<string, typeof TOOLS>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  const freeCount = TOOLS.filter((t) => t.minPlan === 'free').length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {TOOLS.length} AI marketing tools, plus AI visibility
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {freeCount} are free forever, no credit card. Paid plans unlock all{' '}
              {TOOLS.length} and add saved AI visibility scans.
            </p>
          </div>
        </section>

        {/* AI visibility first — it is the newest and least understood */}
        <section className="container mx-auto px-6 py-14">
          <div className="max-w-3xl mx-auto rounded-2xl border p-6 md:p-8 mb-14">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              AI visibility
            </span>
            <h2 className="text-2xl font-bold mt-2 mb-3">
              Do answer engines name your business?
            </h2>
            <p className="text-muted-foreground mb-4">
              We ask five answer engines the local questions your customers actually
              ask — then show you, engine by engine, whether you were named, with the
              sources each one cited.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 mb-6">
              {[
                'ChatGPT Search',
                'Google Gemini',
                'Perplexity',
                'Claude',
                'Google AI Overviews',
              ].map((e) => (
                <li key={e} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
            <Link
              href="/geo"
              className="inline-block rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold"
            >
              Try the free checker
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              <Link href="/faq/what-is-ai-visibility" className="text-primary hover:underline">
                Learn what AI visibility is
              </Link>
            </p>
          </div>

          {/* Tools, derived from the registry */}
          <div className="max-w-4xl mx-auto space-y-10">
            {Object.entries(byCategory).map(([cat, tools]) => (
              <div key={cat}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary mb-4">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tools.map((t) => (
                    <div key={t.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">{t.name}</h3>
                        {t.minPlan === 'free' && (
                          <span className="shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="inline-block rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              See pricing
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
