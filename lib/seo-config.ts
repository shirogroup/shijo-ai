// SEO Configuration - Based on Keyword Research
// Primary Keywords: AI SEO tools (18.1k/mo), keyword research tool (33.1k/mo)

export const seoConfig = {
  siteName: 'SHIJO.ai',
  siteUrl: 'https://shijo.ai',
  defaultTitle: 'SHIJO.ai - AI-Powered SEO Tools | Keyword Research & AI Search Visibility',
  defaultDescription: 'Enterprise AI SEO platform for keyword research, AI search visibility tracking in ChatGPT & Claude, and SEO automation. Track rankings, optimize content, dominate AI search.',
  
  // Primary keywords (sorted by priority)
  primaryKeywords: [
    'AI SEO tools',           // 18,100/mo - CRITICAL
    'keyword research tool',   // 33,100/mo - HIGH
    'AI search visibility',    // 590/mo - CRITICAL (trending)
    'ChatGPT SEO',            // 2,900/mo - CRITICAL (trending)
    'SEO automation',         // 3,600/mo - HIGH
    'keyword research software', // Part of 33.1k cluster
    'enterprise SEO tools',    // 1,600/mo - HIGH
  ],
  
  // Secondary keywords
  secondaryKeywords: [
    'AI visibility tracking',
    'generative engine optimization',
    'LLM SEO',
    'keyword clustering tool',
    'search volume checker',
    'SERP analysis tool',
    'rank tracking software',
  ],
  
  // Page-specific SEO
  pages: {
    home: {
      title: 'SHIJO.ai - AI-Powered SEO Tools | Keyword Research & AI Search Visibility Tracking',
      description: 'Enterprise AI SEO platform for keyword research, AI search visibility tracking in ChatGPT & Claude, and SEO automation. Track rankings, optimize content, and dominate AI search. Free trial available.',
      keywords: ['AI SEO tools', 'keyword research tool', 'AI search visibility', 'ChatGPT SEO'],
      canonical: 'https://shijo.ai',
    },
    features: {
      title: 'AI SEO Features | Keyword Research, Clustering & Search Volume Analysis - SHIJO.ai',
      description: 'Explore SHIJO.ai\'s AI-powered SEO features: automated keyword research, clustering, intent classification, search volume checking, SERP analysis, and rank tracking. Enterprise-grade SEO tools.',
      keywords: ['keyword research', 'keyword clustering', 'search volume checker', 'keyword difficulty'],
      canonical: 'https://shijo.ai/features',
    },
    aiVisibility: {
      title: 'AI Search Visibility Tracking | Monitor ChatGPT, Claude & Perplexity Rankings - SHIJO.ai',
      description: 'Track your brand visibility in ChatGPT, Claude, and Perplexity with SHIJO.ai. Monitor LLM citations, AI search rankings, and generative engine optimization (GEO) performance.',
      keywords: ['AI search visibility', 'ChatGPT SEO', 'LLM SEO', 'generative engine optimization'],
      canonical: 'https://shijo.ai/ai-visibility',
    },
    pricing: {
      title: 'SEO Tools Pricing | Affordable AI-Powered Keyword Research Plans - SHIJO.ai',
      description: 'Transparent pricing for enterprise AI SEO tools. Plans starting at $39/month. Includes unlimited keyword research, AI visibility tracking, and rank monitoring. 14-day free trial.',
      keywords: ['SEO tools pricing', 'keyword research tool cost', 'affordable SEO software'],
      canonical: 'https://shijo.ai/pricing',
    },
    dashboard: {
      title: 'SEO Dashboard | Keyword Tracking & Analytics - SHIJO.ai',
      description: 'Comprehensive SEO dashboard for tracking keywords, monitoring rankings, analyzing SERP performance, and measuring AI search visibility. Real-time SEO analytics.',
      keywords: ['SEO dashboard', 'keyword tracking', 'rank monitoring', 'SEO analytics'],
      canonical: 'https://shijo.ai/dashboard',
    },
  },
  
  // Structured data
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SHIRO Technologies LLC',
    url: 'https://shijo.ai',
    logo: 'https://shijo.ai/logo.png',
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
      images: [{
        url: `${seoConfig.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
      }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageConfig.title,
      description: pageConfig.description,
      images: [`${seoConfig.siteUrl}/twitter-image.png`],
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
