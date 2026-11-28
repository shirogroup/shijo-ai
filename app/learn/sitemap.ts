import type { MetadataRoute } from 'next';

/**
 * Sitemap for the /learn segment, served at /learn/sitemap.xml.
 *
 * learn.shijo.ai/sitemap.xml is rewritten here by middleware. The public
 * URLs below are the learn host, not www. The worksheet download is listed
 * because the lesson links to it as the file to keep.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: 'https://learn.shijo.ai/',
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://learn.shijo.ai/visibility-log',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://learn.shijo.ai/downloads/visibility-log.md',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
