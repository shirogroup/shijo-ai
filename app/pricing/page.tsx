import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GEO_DISCLAIMER, PRICING_PLANS } from '@/lib/pricing-plans';
import { PricingCta } from './PricingCta';

/**
 * /pricing — previously a 404.
 *
 * The homepage has always linked to /#pricing (an anchor), while
 * lib/seo-config.ts declared a canonical for /pricing that did not exist.
 * This route resolves that: the canonical now points at a real page.
 *
 * Dollar amounts come from lib/pricing-plans.ts, which mirrors
 * lib/stripe/products.ts. Do not hardcode a price here.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/pricing' },
  title: 'Pricing — AI Marketing Tools & AI Visibility Tracking | SHIJO.AI',
  description:
    'Simple pricing for SHIJO.AI: 2 tools free forever, Standard $29/mo, Plus $79/mo with 30 AI visibility scans, Pro $199/mo with multi-brand exports. One-off AI visibility report $39.',
  keywords: [
    'shijo.ai pricing',
    'ai marketing tools pricing',
    'ai visibility tracking cost',
    'geo tracking pricing',
  ],
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple pricing, including AI visibility
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All paid plans include <strong>12 AI marketing tools</strong>. Paid plans
              also include saved AI visibility scans — checking whether answer engines
              name your business when people ask for a recommendation.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {PRICING_PLANS.map((p) => (
              <div
                key={p.key}
                className={`rounded-2xl border p-6 flex flex-col ${
                  p.highlight ? 'border-primary shadow-sm ring-1 ring-primary/20' : ''
                }`}
              >
                {p.highlight && (
                  <span className="self-start mb-3 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                    Most AI visibility
                  </span>
                )}
                <h2 className="text-xl font-bold">{p.name}</h2>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-bold">{p.price}</span>{' '}
                  <span className="text-sm text-muted-foreground">{p.cadence}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5">{p.tagline}</p>

                <div className="rounded-lg bg-muted/50 border p-3 mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                    AI visibility
                  </p>
                  <p className="text-sm">{p.geo}</p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      {p.comingSoon ? (
                        <Minus className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      )}
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {p.cta?.kind === 'checkout' ? (
                  <PricingCta
                    planKey={p.cta.planKey}
                    label={p.cta.label}
                    highlight={p.highlight}
                  />
                ) : p.cta ? (
                  <Link
                    href={p.cta.href}
                    className={`block text-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                      p.highlight
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-muted'
                    }`}
                  >
                    {p.cta.label}
                  </Link>
                ) : (
                  <span className="block text-center rounded-xl border px-5 py-3 text-sm font-semibold text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10">
            The free AI visibility checker is open to everyone at{' '}
            <Link href="/geo" className="text-primary hover:underline">
              /geo
            </Link>{' '}
            — one scan per day, no account needed.
          </p>
        </section>

        {/* Compliance — required wording, do not soften */}
        <section className="container mx-auto px-6 pb-16">
          <div className="max-w-3xl mx-auto rounded-xl border bg-muted/30 p-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {GEO_DISCLAIMER}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
