/**
 * Tool Registry — Central configuration for all SHIJO.AI tools
 *
 * Each tool defines its metadata, fields, model tier, and category.
 * This registry drives the tools directory page, the generate API routing,
 * and the access control system.
 *
 * Lineup consolidated from 23 to 12 tools per the Product Handoff Rev2
 * (market-research-backed keep/cut decision, section 4). The 'content'
 * category was removed here because both tools that used it (Content Idea
 * Generator, Video Content Suite) were cut, leaving it empty — an empty
 * category in the nav would be a broken UI state, not a business decision.
 */

export type ToolCategory = 'social' | 'seo' | 'ads' | 'email';
export type ModelTier = 'haiku' | 'sonnet';
export type PlanAccess = 'free' | 'pro' | 'growth' | 'enterprise';

export interface FieldConfig {
  id: string;
  label: string;
  placeholder: string;
  type?: 'input' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  modelTier: ModelTier;
  minPlan: PlanAccess;
  fields: FieldConfig[];
  outputLabel?: string;
}

// ─── Category metadata ──────────────────────────────────────────────

export const CATEGORIES: Record<ToolCategory, { label: string; color: string; bgColor: string }> = {
  social: { label: 'Social Media', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  seo:    { label: 'SEO', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ads:    { label: 'Ads & Copy', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  email:  { label: 'Email', color: 'text-green-600', bgColor: 'bg-green-50' },
};

// ─── Tool definitions ───────────────────────────────────────────────

export const TOOLS: ToolConfig[] = [
  // ── SOCIAL MEDIA ────────────────────────────────────────────────
  {
    id: 'post-caption-generator',
    name: 'Post Caption Generator',
    description: 'Write scroll-stopping captions with hooks, CTAs, and hashtags for any platform.',
    icon: '✍️',
    category: 'social',
    modelTier: 'sonnet',
    minPlan: 'free',
    outputLabel: 'Your Captions',
    fields: [
      { id: 'topic', label: 'Topic or Product', placeholder: 'e.g. New fitness app launch', required: true },
      { id: 'platform', label: 'Platform', placeholder: 'Instagram', type: 'select', options: ['Instagram', 'LinkedIn', 'Twitter/X', 'TikTok', 'Facebook', 'Threads'] },
      { id: 'tone', label: 'Brand Voice', placeholder: 'e.g. Playful, professional, bold' },
      { id: 'goal', label: 'Goal', placeholder: 'e.g. Engagement, sales, awareness', type: 'select', options: ['Engagement', 'Sales', 'Awareness', 'Traffic', 'Community'] },
    ],
  },

  // ── SEO ─────────────────────────────────────────────────────────
  {
    id: 'keyword-research',
    name: 'Keyword Research',
    description: 'Get primary, long-tail, question, and local keywords with intent analysis and content ideas.',
    icon: '🔍',
    category: 'seo',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Keyword Research Results',
    fields: [
      { id: 'topic', label: 'Seed Keyword / Topic', placeholder: 'e.g. Project management software', required: true },
      { id: 'business', label: 'Business Type', placeholder: 'e.g. SaaS, e-commerce, agency' },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. Small business owners' },
      { id: 'goal', label: 'Goal', placeholder: 'Drive organic traffic', type: 'select', options: ['Drive organic traffic', 'Generate leads', 'Build authority', 'E-commerce sales', 'Local visibility'] },
    ],
  },
  {
    id: 'seo-content-brief',
    name: 'SEO Content Brief',
    description: 'Generate a complete content brief with title, outline, secondary keywords, and E-E-A-T signals.',
    icon: '📋',
    category: 'seo',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your Content Brief',
    fields: [
      { id: 'keyword', label: 'Target Keyword', placeholder: 'e.g. Best CRM for small business', required: true },
      { id: 'contentType', label: 'Content Type', placeholder: 'Blog post', type: 'select', options: ['Blog Post', 'Pillar Page', 'Product Page', 'Landing Page', 'Comparison Article', 'How-To Guide'] },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. SaaS decision makers' },
      { id: 'wordCount', label: 'Word Count Target', placeholder: '1500-2000', type: 'select', options: ['800-1000 words', '1500-2000 words', '2500-3000 words', '3000+ words'] },
    ],
  },
  {
    id: 'seo-meta-generator',
    name: 'SEO Meta Generator',
    description: 'Write 5 title tag + meta description variations optimized for click-through rates.',
    icon: '🏷️',
    category: 'seo',
    modelTier: 'haiku',
    minPlan: 'free',
    outputLabel: 'Your Meta Tags',
    fields: [
      { id: 'topic', label: 'Page Topic', placeholder: 'e.g. Best project management tools 2026', required: true },
      { id: 'keyword', label: 'Target Keyword', placeholder: 'e.g. project management tools', required: true },
      { id: 'pageType', label: 'Page Type', placeholder: 'Blog post', type: 'select', options: ['Blog Post', 'Product Page', 'Landing Page', 'Category Page', 'Homepage'] },
      { id: 'brand', label: 'Brand Name', placeholder: 'e.g. Acme Studio' },
    ],
  },
  {
    id: 'faq-generator',
    name: 'FAQ Generator',
    description: 'Generate 12 structured FAQs optimized for featured snippets across awareness, consideration, and objection stages.',
    icon: '❓',
    category: 'seo',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your FAQ Section',
    fields: [
      { id: 'topic', label: 'Topic / Product / Service', placeholder: 'e.g. AI-powered SEO tools', required: true },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. Marketing managers' },
      { id: 'niche', label: 'Industry / Niche', placeholder: 'e.g. Digital marketing' },
    ],
  },
  {
    id: 'ai-overview-optimizer',
    name: 'AI Overview Optimizer',
    description: 'Optimize your content for Google AI Overviews and AI search engines like ChatGPT and Perplexity.',
    icon: '🤖',
    category: 'seo',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'AI Optimization Recommendations',
    fields: [
      { id: 'url', label: 'Page URL or Content', placeholder: 'Paste your page URL or content text...', type: 'textarea', required: true },
      { id: 'keyword', label: 'Target Query / Keyword', placeholder: 'e.g. Best CRM software for startups', required: true },
      { id: 'brand', label: 'Brand Name', placeholder: 'e.g. Acme Studio' },
      { id: 'competitors', label: 'Key Competitors', placeholder: 'e.g. Semrush, Ahrefs, Frase' },
    ],
  },

  // ── ADS & COPY ──────────────────────────────────────────────────
  {
    id: 'ad-copy-generator',
    name: 'Ad Copy Generator',
    description: 'Write 4 complete ad variations: problem-agitate-solution, story-based, testimonial, and direct offer.',
    icon: '📢',
    category: 'ads',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your Ad Copy',
    fields: [
      { id: 'product', label: 'Product / Service', placeholder: 'e.g. AI SEO tool for agencies', required: true },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. Digital marketing agencies' },
      { id: 'platform', label: 'Ad Platform', placeholder: 'Facebook/Instagram', type: 'select', options: ['Facebook/Instagram', 'Google Ads', 'LinkedIn Ads', 'TikTok Ads', 'Reddit Ads', 'Twitter/X Ads'] },
      { id: 'offer', label: 'Offer / CTA', placeholder: 'e.g. Start free trial, 50% off first month' },
      { id: 'tone', label: 'Tone', placeholder: 'e.g. Direct and compelling' },
    ],
  },
  {
    id: 'ad-headline-ab',
    name: 'Ad Headline A/B Tester',
    description: 'Generate 15 headline variations across 5 strategies: curiosity, benefit, urgency, social proof, and questions.',
    icon: '🎯',
    category: 'ads',
    modelTier: 'haiku',
    minPlan: 'pro',
    outputLabel: 'Your Headlines',
    fields: [
      { id: 'offer', label: 'Product / Offer', placeholder: 'e.g. AI writing assistant', required: true },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. Content marketers' },
      { id: 'platform', label: 'Platform', placeholder: 'Facebook Ads', type: 'select', options: ['Facebook Ads', 'Google Ads', 'LinkedIn Ads', 'TikTok Ads', 'Reddit Ads'] },
      { id: 'benefit', label: 'Main Benefit', placeholder: 'e.g. Save 10 hours per week on content creation' },
    ],
  },
  {
    id: 'audience-targeting',
    name: 'Audience Targeting Profiles',
    description: 'Build 3 detailed audience personas with demographics, psychographics, and platform-specific targeting interests.',
    icon: '🎯',
    category: 'ads',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your Audience Profiles',
    fields: [
      { id: 'product', label: 'Product / Offer', placeholder: 'e.g. Online course on email marketing', required: true },
      { id: 'price', label: 'Price Point', placeholder: 'e.g. $97 one-time, $29/mo' },
      { id: 'problem', label: 'Problem It Solves', placeholder: 'e.g. Low email open rates, no email strategy' },
    ],
  },
  {
    id: 'landing-page-copy',
    name: 'Landing Page Copy Generator',
    description: 'Generate complete landing page sections: hero, benefits, social proof, FAQ, and CTA blocks.',
    icon: '🖥️',
    category: 'ads',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your Landing Page Copy',
    fields: [
      { id: 'product', label: 'Product / Service', placeholder: 'e.g. AI email marketing platform', required: true },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. E-commerce store owners', required: true },
      { id: 'offer', label: 'Offer / CTA', placeholder: 'e.g. Start free 14-day trial' },
      { id: 'tone', label: 'Tone', placeholder: 'e.g. Professional, friendly, bold' },
      { id: 'sections', label: 'Sections to Generate', placeholder: 'All', type: 'select', options: ['All Sections', 'Hero Only', 'Benefits + Features', 'Social Proof + Testimonials', 'FAQ + Objection Handling', 'CTA Block'] },
    ],
  },

  // ── EMAIL ───────────────────────────────────────────────────────
  {
    id: 'email-sequence-generator',
    name: 'Email Sequence Generator',
    description: 'Write a complete multi-email sequence with subject lines, preview text, body, and send timing.',
    icon: '📧',
    category: 'email',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your Email Sequence',
    fields: [
      { id: 'brand', label: 'Brand / Product Name', placeholder: 'e.g. Acme Studio', required: true },
      { id: 'sequenceType', label: 'Sequence Type', placeholder: 'Welcome', type: 'select', options: ['Welcome', 'Onboarding', 'Sales / Launch', 'Abandoned Cart', 'Re-engagement', 'Nurture'] },
      { id: 'purpose', label: 'Purpose', placeholder: 'e.g. Convert trial users to paid' },
      { id: 'count', label: 'Number of Emails', placeholder: '5', type: 'select', options: ['3', '5', '7'] },
      { id: 'tone', label: 'Tone', placeholder: 'e.g. Warm and conversational' },
    ],
  },
  {
    id: 'newsletter-generator',
    name: 'Newsletter Generator',
    description: 'Create a complete newsletter issue with subject line, personal opening, feature content, tips, and P.S. line.',
    icon: '📰',
    category: 'email',
    modelTier: 'sonnet',
    minPlan: 'pro',
    outputLabel: 'Your Newsletter',
    fields: [
      { id: 'brand', label: 'Newsletter / Brand Name', placeholder: 'e.g. The SEO Weekly', required: true },
      { id: 'topic', label: 'Topic / Theme', placeholder: 'e.g. AI search optimization trends', required: true },
      { id: 'audience', label: 'Audience', placeholder: 'e.g. Marketing professionals' },
      { id: 'length', label: 'Length', placeholder: 'Medium', type: 'select', options: ['Short (200-400 words)', 'Medium (400-600 words)', 'Long (600-900 words)'] },
      { id: 'tone', label: 'Tone', placeholder: 'e.g. Informative and friendly' },
    ],
  },
];

// ─── Helper functions ───────────────────────────────────────────────

export function getToolById(id: string): ToolConfig | undefined {
  return TOOLS.find(t => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
  return TOOLS.filter(t => t.category === category);
}

export function getFreeTools(): ToolConfig[] {
  return TOOLS.filter(t => t.minPlan === 'free');
}

export function getToolCount(): number {
  return TOOLS.length;
}
