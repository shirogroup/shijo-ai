/**
 * Prompt builders for each tool.
 * Each function takes user inputs and returns a system message + user prompt.
 *
 * Consolidated to the 12 tools kept per Product Handoff Rev2 — prompt
 * builders for the 11 cut tools were removed alongside their registry
 * entries in lib/tools/registry.ts.
 */

type PromptBuilder = (inputs: Record<string, string>) => string;

export const PROMPTS: Record<string, PromptBuilder> = {
  'post-caption-generator': (i) => `You are a social media copywriter. Write 5 caption variations for ${i.platform || 'Instagram'}.

Topic/Product: ${i.topic}
Brand voice: ${i.tone || 'engaging'}
Goal: ${i.goal || 'engagement'}
Include: relevant hashtag suggestions at the end.

Each caption should have a strong hook, body, and CTA. Number them clearly.`,

  'keyword-research': (i) => `You are an SEO strategist. Perform keyword research for the following.

Main topic/seed keyword: ${i.topic}
Business type: ${i.business || 'online business'}
Target audience: ${i.audience || 'general'}
Goal: ${i.goal || 'drive organic traffic'}

Provide:
1. 5 PRIMARY keywords (high intent, moderate competition)
2. 10 LONG-TAIL keywords (specific, lower competition)
3. 5 QUESTION keywords (for FAQs, featured snippets)
4. 3 LOCAL keywords (if applicable)
5. Content gap opportunities

For each keyword: estimated intent (informational/commercial/transactional), estimated competition (low/medium/high), content idea.

Open the output with this exact line, on its own:
> Note: intent and competition below are estimates based on the phrasing and the market, not measured search data. For real search volume and competition scores, check these terms in Google Keyword Planner or a keyword tool with live data.

Never present the competition estimate as a measured figure, and never state a search volume number.`,

  'seo-content-brief': (i) => `You are an SEO content strategist. Create a detailed content brief.

Target keyword: ${i.keyword}
Content type: ${i.contentType || 'blog post'}
Target audience: ${i.audience || 'general'}
Word count target: ${i.wordCount || '1500-2000 words'}

Deliver:
- Recommended title (H1)
- Meta description
- Target secondary keywords (5-8)
- Recommended outline (H2s and H3s)
- Key points to cover in each section
- Competitor angles to differentiate from
- Internal linking suggestions
- CTA recommendation
- E-E-A-T signals to include`,

  'seo-meta-generator': (i) => `You are an SEO copywriter specializing in click-through rate optimization. Write meta tags.

Page topic: ${i.topic}
Target keyword: ${i.keyword}
Page type: ${i.pageType || 'blog post'}
Brand name: ${i.brand || 'Shijo.ai'}

Generate 5 variations of:
- Title tag (50-60 characters) — include keyword, compelling hook
- Meta description (145-155 characters) — include keyword, value prop, soft CTA

Label each variation and note the strategy (curiosity / urgency / value / question / list).`,

  'faq-generator': (i) => `You are an SEO content strategist. Generate a comprehensive FAQ section.

Topic/Product/Service: ${i.topic}
Target audience: ${i.audience || 'general'}
Industry/Niche: ${i.niche || 'business'}

Generate 12 FAQs:
- 4 basic/awareness questions
- 4 consideration/comparison questions
- 4 objection-handling questions

For each: provide the Question and a detailed, helpful Answer (3-5 sentences). Format in clean Q&A structure. Optimize for featured snippets.`,

  'ai-overview-optimizer': (i) => `You are an AI search optimization expert specializing in Google AI Overviews, ChatGPT citations, and Perplexity references.

Content or URL to analyze: "${i.url}"
Target query: ${i.keyword}
Brand: ${i.brand || 'not specified'}
Competitors: ${i.competitors || 'not specified'}

Analyze the content and provide:

1. **AI Overview Readiness Score** (1-10) with explanation
2. **Direct Answer Optimization** — Does the content provide clear, concise answers that AI can extract? What changes are needed?
3. **Entity & Authority Signals** — Are there enough named entities, statistics, citations, and expertise signals?
4. **Structure Analysis** — Is the content structured with clear headings, lists, tables, and FAQ schema that AI can parse?
5. **Citation Likelihood** — How likely is this content to be cited by ChatGPT, Perplexity, or Google AI Overviews? What would improve it?
6. **Specific Rewrites** — Provide 3-5 specific paragraph rewrites optimized for AI citation
7. **Competitive Gap** — What are competitors doing that this content is missing for AI visibility?

Be specific and actionable. Don't give generic advice.`,

  'ad-copy-generator': (i) => `You are a performance marketing copywriter. Write ad copy for ${i.platform || 'Facebook/Instagram'}.

Product/Service: ${i.product}
Target audience: ${i.audience || 'general'}
Offer/CTA: ${i.offer || 'learn more'}
Tone: ${i.tone || 'direct and compelling'}

Write 4 complete ad variations:
1. Problem-agitate-solution
2. Story-based
3. Testimonial-style
4. Direct offer/discount

For each: Primary text, Headline (30 chars), Description (18 chars), CTA button suggestion.`,

  'ad-headline-ab': (i) => `You are a conversion rate optimizer. Generate A/B headline variations.

Product/Offer: ${i.offer}
Target audience: ${i.audience || 'general'}
Platform: ${i.platform || 'Facebook Ads'}
Main benefit: ${i.benefit || 'not specified'}

Generate 15 headline variations grouped by strategy:
- Curiosity (3 headlines)
- Benefit-led (3 headlines)
- Urgency/Scarcity (3 headlines)
- Social proof (3 headlines)
- Question-based (3 headlines)

Each headline max 40 characters. Label the angle and explain briefly why it works.`,

  'audience-targeting': (i) => `You are a digital marketing strategist. Build a detailed audience targeting profile.

Product/Offer: ${i.product}
Price point: ${i.price || 'not specified'}
Problem solved: ${i.problem || 'not specified'}

Deliver 3 audience personas, each with:
- Persona name and avatar description
- Demographics (age, income, location, job)
- Psychographics (values, fears, desires, identity)
- Where they spend time online
- What content they consume
- Buying triggers
- Objections to overcome
- Facebook/Instagram targeting interests
- Message that resonates`,

  'landing-page-copy': (i) => `You are a conversion copywriter specializing in landing pages.

Product/Service: ${i.product}
Target Audience: ${i.audience}
Offer/CTA: ${i.offer || 'Sign up free'}
Tone: ${i.tone || 'professional and compelling'}
Sections requested: ${i.sections || 'All Sections'}

Generate the following landing page sections:

1. **Hero Section** — Headline (max 10 words), subheadline (1 sentence), primary CTA button text, supporting text
2. **Problem Section** — 3 pain points the audience faces, written with empathy
3. **Solution/Benefits** — 3-4 benefit blocks, each with: icon suggestion, headline, 2-sentence description
4. **Social Proof** — 3 fictional but realistic testimonial templates with name, role, and quote
5. **Features List** — 6 features with short descriptions
6. **FAQ Section** — 5 objection-handling FAQs
7. **Final CTA Block** — Headline, urgency text, CTA button text, risk-reversal statement

Format each section clearly. All copy should be ready to paste into a page builder.`,

  'email-sequence-generator': (i) => `You are an email marketing strategist. Write a complete ${i.sequenceType || 'welcome'} email sequence.

Product/Brand: ${i.brand || 'the business'}
Sequence purpose: ${i.purpose || 'welcome new subscribers'}
Emails in sequence: ${i.count || '5'}
Tone: ${i.tone || 'warm and conversational'}

For each email:
- Email #
- Subject line (with A/B variation)
- Preview text
- Full email body (opening, value, CTA)
- Send timing (Day 0, Day 2, etc.)

Include a sequence overview at the top. Make each email feel personal, not corporate.`,

  'newsletter-generator': (i) => `You are a newsletter writer. Create an engaging newsletter issue.

Brand/Publication: ${i.brand || 'the newsletter'}
Topic/Theme: ${i.topic}
Audience: ${i.audience || 'subscribers'}
Length: ${i.length || 'medium (400-600 words)'}
Tone: ${i.tone || 'informative and friendly'}

Write a complete newsletter with:
- Compelling subject line
- Preview text
- Personal opening (1 short paragraph)
- Main feature section (meaty, valuable content)
- 1-2 quick tips or links section
- Closing with CTA
- P.S. line

Make it feel written by a real person, not a brand robot.`,
};
