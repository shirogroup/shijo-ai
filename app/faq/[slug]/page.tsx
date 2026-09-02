import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { faqEntries, getFaqEntryBySlug } from '@/lib/faq/entries';
import { ArrowRight, ArrowLeft } from 'lucide-react';

/**
 * /faq/[slug] — indexable explainer pages for the AI-visibility vocabulary.
 *
 * Chrome is deliberately the same as app/blog/[slug]/page.tsx (Header, Footer,
 * block renderer, Article JSON-LD) so there is one content pattern in the repo
 * rather than two. Two differences on purpose:
 *   - canonicals use the www host, matching app/sitemap.ts. The blog route
 *     still emits apex canonicals against a www sitemap; that is a known open
 *     bug and is NOT fixed here, to keep this pass to its stated scope.
 *   - each page also emits FAQPage JSON-LD alongside Article, since every one
 *     of these answers a single question.
 *
 * Metadata is declared here rather than via lib/seo-config.ts's
 * generatePageMetadata(): that helper is only wired to app/page.tsx (home),
 * so adding entries there would be dead config, which that file's own comments
 * warn about.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return faqEntries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getFaqEntryBySlug(slug);
  if (!entry) return {};

  const url = `https://www.shijo.ai/faq/${entry.slug}`;

  return {
    title: `${entry.metaTitle} | SHIJO.AI`,
    description: entry.description,
    keywords: entry.keywords,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      // Next.js does not merge openGraph field-by-field: a page defining its own
      // openGraph block replaces the root layout's entirely, images included.
      images: [{ url: '/brand/shijo-logo-landscape-1200x300.png', width: 1200, height: 300 }],
      title: entry.metaTitle,
      description: entry.description,
      url,
      type: 'article',
    },
  };
}

export default async function FaqEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = getFaqEntryBySlug(slug);
  if (!entry) notFound();

  const url = `https://www.shijo.ai/faq/${entry.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      description: entry.description,
      dateModified: entry.updatedAt,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'SHIRO Technologies LLC' },
      publisher: { '@type': 'Organization', name: 'SHIJO.AI' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: entry.title,
          acceptedAnswer: { '@type': 'Answer', text: entry.shortAnswer },
        },
      ],
    },
  ];

  const others = faqEntries.filter((e) => e.slug !== entry.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-shiro-red mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All AI visibility answers
          </Link>

          <span className="text-xs font-bold text-shiro-red">AI visibility</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">{entry.title}</h1>
          <p className="text-sm text-gray-400 mb-10">
            Updated{' '}
            {new Date(entry.updatedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {' · '}
            {entry.readTime}
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            {entry.content.map((block, i) => {
              if (block.type === 'h2') {
                return (
                  <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-2">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === 'ul') {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-1.5 text-gray-700">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="text-gray-700 leading-relaxed">
                  {block.text}
                </p>
              );
            })}
          </div>

          {/* CTA: free checker first, plans second. Existing routes only. */}
          <div className="mt-12 bg-shiro-black text-white rounded-2xl p-6">
            <p className="font-semibold mb-1">Check your own AI visibility</p>
            <p className="text-sm text-gray-300 mb-5">
              Free, no account needed. See engine by engine whether your business is named.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/geo"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors"
              >
                Run the free check <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center text-sm font-semibold border border-gray-600 hover:border-gray-400 text-white rounded-lg px-4 py-2.5 transition-colors"
              >
                See plans
              </Link>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Related answers</h2>
            <ul className="space-y-2">
              {others.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/faq/${e.slug}`}
                    className="text-gray-600 hover:text-shiro-red transition-colors"
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
