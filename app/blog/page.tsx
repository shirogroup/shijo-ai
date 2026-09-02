import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { posts } from '@/lib/blog/posts';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | SHIJO.AI',
  description: 'Practical guides on AI SEO tools, ad copy, email marketing, and AI marketing platforms for small teams and agencies.',
  keywords: ['ai seo tools', 'ai marketing tools blog', 'keyword research tool', 'ai ad copy generator'],
  // Canonical host is www: the bare apex 307-redirects to www, and app/sitemap.ts
  // lists www URLs. An apex canonical here pointed crawlers at a redirect.
  alternates: { canonical: 'https://www.shijo.ai/blog' },
};

export default function BlogIndexPage() {
  const sorted = [...posts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Blog</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Practical guides on AI SEO, ad copy, email, and marketing tools — no fluff, no fake stats.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group border border-gray-200 rounded-2xl p-6 hover:border-shiro-red/40 hover:shadow-md transition-all flex flex-col"
              >
                <span className="text-xs font-bold text-shiro-red mb-2">{post.category}</span>
                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-shiro-red transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4 flex-1">{post.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1 text-shiro-red font-medium">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
