import { MetadataRoute } from 'next';
import { posts } from '@/lib/blog/posts';
import { faqEntries } from '@/lib/faq/entries';

export default function sitemap(): MetadataRoute.Sitemap {
  // Canonical host. The bare apex 307-redirects to www, so listing apex
// URLs in the sitemap points crawlers at redirects instead of final URLs.
const baseUrl = 'https://www.shijo.ai';

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];

  // AI-visibility explainers. Added 2026-09-02 alongside app/faq/[slug].
  // Canonicals on these routes use the www host, matching baseUrl here.
  const faqSitemapEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...faqEntries.map((e) => ({
      url: `${baseUrl}/faq/${e.slug}`,
      lastModified: new Date(e.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  return [
    ...blogEntries,
    ...faqSitemapEntries,
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      // Added 2026-08-31, when these stopped being 404s. lib/seo-config.ts had
      // declared canonicals for both long before the routes existed.
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Public, unauthenticated GEO visibility checker. Added 2026-08-29.
      url: `${baseUrl}/geo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      // Video sitemap extension, added 2026-09-04. This is the second half of
      // making the explainer discoverable: the page carries VideoObject
      // structured data, and this tells Search Console a video lives on that
      // URL so it appears under Video indexing rather than waiting to be
      // stumbled upon. title/description/thumbnail_loc/content_loc are the
      // fields Google treats as required. Keep `duration` (seconds) in step
      // with the encoded file and with PT58S in the page's JSON-LD.
      videos: [
        {
          title: 'AI Visibility, explained',
          thumbnail_loc: `${baseUrl}/videos/ai-visibility-explained-poster.jpg`,
          description:
            'A 58-second explainer: what AI visibility is, whether ChatGPT, Gemini, Perplexity and Google AI Overviews name your business in the answers they write, how Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) differ, and how to run a free AI visibility check.',
          content_loc: `${baseUrl}/videos/ai-visibility-explained.mp4`,
          duration: 58,
          family_friendly: 'yes',
          publication_date: '2026-09-04',
          live: 'no',
        },
      ],
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/gdpr-compliance`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/ai-compliance`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/ai-marketing-tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
