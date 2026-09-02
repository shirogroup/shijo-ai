import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { posts, getPostBySlug } from '@/lib/blog/posts';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    // Suffix shortened from '| SHIJO.AI Blog' to '| SHIJO.AI' (5 chars back on
    // every post). metaTitle overrides the <title> only where the h1 wording is
    // longer than Google's ~60-char display width; h1 always stays post.title.
    title: `${post.metaTitle ?? post.title} | SHIJO.AI`,
    description: post.description,
    keywords: post.keywords,
    // Canonical host is www, matching app/sitemap.ts. The apex 307-redirects,
    // so an apex canonical aimed crawlers at a redirect rather than the final URL.
    alternates: { canonical: `https://www.shijo.ai/blog/${post.slug}` },
    openGraph: {
      // Next.js does NOT merge openGraph field-by-field: a page defining its own
      // openGraph block replaces the root layout's entirely, images included.
      // Without this the page ships no og:image at all, which is what Ahrefs
      // flagged as "Open Graph tags incomplete" (2026-08-22).
      images: [{ url: '/brand/shijo-logo-landscape-1200x300.png', width: 1200, height: 300 }],
      title: post.metaTitle ?? post.title,
      description: post.description,
      url: `https://www.shijo.ai/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'SHIRO Technologies LLC' },
    publisher: { '@type': 'Organization', name: 'SHIJO.AI' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-shiro-red mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
          </Link>

          <span className="text-xs font-bold text-shiro-red">{post.category}</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">{post.title}</h1>
          <p className="text-sm text-gray-400 mb-10">
            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}{post.readTime}
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            {post.content.map((block, i) => {
              if (block.type === 'h2') {
                return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-2">{block.text}</h2>;
              }
              if (block.type === 'ul') {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-1.5 text-gray-700">
                    {block.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                );
              }
              return <p key={i} className="text-gray-700 leading-relaxed">{block.text}</p>;
            })}
          </div>

          {post.relatedToolHref && (
            <div className="mt-12 bg-shiro-black text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="font-semibold">{post.relatedToolLabel}</p>
              <Link
                href={post.relatedToolHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors whitespace-nowrap"
              >
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
