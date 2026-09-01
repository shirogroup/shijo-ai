import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /thank-you is a post-payment endpoint, not a landing page. It also
        // carries robots: noindex in its own metadata — both are needed,
        // because a noindex tag only works if the crawler may fetch the page.
        disallow: ['/api/', '/admin/', '/dashboard/', '/thank-you'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    sitemap: 'https://www.shijo.ai/sitemap.xml',
  };
}
