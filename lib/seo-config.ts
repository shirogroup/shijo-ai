// SEO Configuration - Based on Keyword Research
// Primary Keywords: AI SEO tools (18.1k/mo), keyword research tool (33.1k/mo)

export const seoConfig = {
  siteName: 'SHIJO.ai',
  siteUrl: 'https://www.shijo.ai',
  defaultTitle: 'SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social',
  defaultDescription: 'AI-powered marketing platform with 12 tools for keyword research, content generation, ad copy, and email. 2 tools free forever, no credit card required.',

  // Primary keywords (sorted by priority)
  primaryKeywords: [
    'AI SEO tools',           // 18,100/mo - CRITICAL
    'keyword research tool',   // 33,100/mo - HIGH
    'SEO automation',         // 3,600/mo - HIGH
    'keyword research software', // Part of 33.1k cluster
    'enterprise SEO tools',    // 1,600/mo - HIGH
  ],

  // Secondary keywords
  secondaryKeywords: [
    'keyword clustering tool',
    'search volume checker',
    'SERP analysis tool',
    'rank tracking software',
  ],

  // Page-specific SEO
  // NOTE: only `pages.home` is actually wired up (app/page.tsx calls
  // generatePageMetadata('home')) — the other entries below are unused dead
  // config as of 2026-07-18. Left in place but not linked from any route.
  pages: {
    home: {
      title: 'SHIJO.AI - AI Marketing Tools for SEO, Ads, Email & Social',
      description: 'AI-powered SEO and marketing platform with 12 tools for keyword research, content generation, ad copy, and email. 2 tools free forever, no credit card required.',
      keywords: ['AI SEO tools', 'keyword research tool', 'AI marketing tools'],
      canonical: 'https://www.shijo.ai',
    },
    // REWRITTEN 2026-08-31, when /features and /pricing stopped being 404s.
    //
    // Both entries previously described capabilities that do not exist —
    // clustering, intent classification, SERP analysis, rank tracking — while
    // declaring canonicals for routes that returned 404. That combination was
    // dead config, but it was one generatePageMetadata() call away from
    // publishing fabricated feature claims against a dead URL. Both now
    // describe the pages that actually exist.
    features: {
      title: 'Features | 12 AI Marketing Tools + AI Visibility - SHIJO.AI',
      description: 'Every SHIJO.AI feature: 12 AI marketing tools across SEO, ads, email and social, plus an AI visibility checker that shows whether answer engines name your business.',
      keywords: ['ai marketing tools', 'ai visibility checker', 'seo content tools', 'ad copy generator'],
      canonical: 'https://www.shijo.ai/features',
    },
    pricing: {
      title: 'Pricing | Free, Standard $29, Plus $79, Pro $199 - SHIJO.AI',
      description: 'Simple pricing for AI-powered marketing tools. 2 tools free forever. Standard $29/mo, Plus $79/mo with 30 AI visibility scans, Pro $199/mo with multi-brand exports.',
      keywords: ['AI marketing tools pricing', 'ai visibility tracking cost', 'affordable SEO software'],
      canonical: 'https://www.shijo.ai/pricing',
    },
    dashboard: {
      title: 'SEO Dashboard | Keyword Tracking & Analytics - SHIJO.ai',
      description: 'Comprehensive SEO dashboard for tracking keywords, monitoring rankings, analyzing SERP performance, and measuring AI search visibility. Real-time SEO analytics.',
      keywords: ['SEO dashboard', 'keyword tracking', 'rank monitoring', 'SEO analytics'],
      canonical: 'https://www.shijo.ai/dashboard',
    },
  },
  
  // Structured data
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SHIRO Technologies LLC',
    url: 'https://www.shijo.ai',
    // Was /logo.png, which does not exist in public/ — the Organization
    // structured data has been advertising a 404 logo to crawlers.
    logo: 'https://www.shijo.ai/brand/shijo-logo-square-1200.png',
    sameAs: [
      'https://twitter.com/shijoai',
      'https://linkedin.com/company/shijo-ai',
    ],
  },
  
  // Open Graph defaults
  openGraph: {
    type: 'website',
    locale: 'en_US',
    site_name: 'SHIJO.ai',
  },
};

export function generatePageMetadata(page: keyof typeof seoConfig.pages) {
  const pageConfig = seoConfig.pages[page];
  
  return {
    title: pageConfig.title,
    description: pageConfig.description,
    keywords: [...seoConfig.primaryKeywords, ...pageConfig.keywords],
    alternates: {
      canonical: pageConfig.canonical,
    },
    openGraph: {
      title: pageConfig.title,
      description: pageConfig.description,
      url: pageConfig.canonical,
      siteName: seoConfig.siteName,
      // Was `${seoConfig.siteUrl}/og-image.png`, which does not exist in
      // public/ — the homepage has been advertising a 404 as its social
      // preview image. Pointed at the real brand asset 2026-08-22.
      images: [{
        url: `${seoConfig.siteUrl}/brand/shijo-logo-landscape-1200x300.png`,
        width: 1200,
        height: 300,
      }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageConfig.title,
      description: pageConfig.description,
      // Was `/twitter-image.png`, which does not exist in public/ and has
      // no app/twitter-image file-convention counterpart either — it returned
      // a verified 404 on the live site (checked 2026-08-23), so every X/Twitter
      // share of the homepage rendered a blank summary_large_image card.
      // Pointed at the same real brand asset the openGraph block uses.
      images: [`${seoConfig.siteUrl}/brand/shijo-logo-landscape-1200x300.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
