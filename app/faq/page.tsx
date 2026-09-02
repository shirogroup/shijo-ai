import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { faqEntries } from '@/lib/faq/entries';
import { ArrowRight } from 'lucide-react';

/**
 * /faq — index for the AI-visibility explainer pages.
 *
 * Exists so /faq is not a 404 for anything linking into the set (footer,
 * /geo, the "All AI visibility answers" back-link on each entry).
 */
export const metadata: Metadata = {
  title: 'AI Visibility Answers — GEO, AEO and AI Search Optimization | SHIJO.AI',
  description:
    'Plain definitions for AI visibility, Generative Engine Optimization, Answer Engine Optimization and ai search optimization — and how to check where your business stands.',
  keywords: ['ai visibility', 'ai search optimization', 'ai seo', 'llm seo'],
  alternates: { canonical: 'https://www.shijo.ai/faq' },
  robots: { index: true, follow: true },
};

export default function FaqIndexPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <span className="text-xs font-bold text-shiro-red">AI visibility</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">
            AI visibility, explained
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            The vocabulary around AI search has grown faster than the definitions. These are
            plain answers to the questions we get asked most, with the limits of each method
            stated rather than glossed over.
          </p>

          <ul className="space-y-4">
            {faqEntries.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/faq/${e.slug}`}
                  className="block rounded-xl border border-gray-200 p-5 hover:border-shiro-red transition-colors"
                >
                  <h2 className="font-bold text-gray-900 mb-1">{e.title}</h2>
                  <p className="text-sm text-gray-600">{e.description}</p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 bg-shiro-black text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-semibold">Check your own AI visibility — free, no account</p>
            <Link
              href="/geo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors whitespace-nowrap"
            >
              Run the free check <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
