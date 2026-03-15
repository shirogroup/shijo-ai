/**
 * Prompt builders for each tool.
 * Each function takes user inputs and returns a system message + user prompt.
 */

type PromptBuilder = (inputs: Record<string, string>) => string;

export const PROMPTS: Record<string, PromptBuilder> = {
  'post-caption-generator': (i) => `You are a social media copywriter. Write 5 caption variations for ${i.platform || 'Instagram'}.

Topic/Product: ${i.topic}
Brand voice: ${i.tone || 'engaging'}
Goal: ${i.goal || 'engagement'}
Include: relevant hashtag suggestions at the end.

Each caption should have a strong hook, body, and CTA. Number them clearly.`,

  'social-content-planner': (i) => `You are a social media strategist. Create a ${i.days || '7'}-day content calendar for a ${i.niche || 'business'} brand on ${i.platforms || 'Instagram, LinkedIn'}.

For each day provide: Day #, Platform, Content Type, Topic/Hook, Caption Direction, Best Time to Post.

Format as a clean structured calendar. Be specific and creative. Tailor tone to: ${i.tone || 'professional yet approachable'}.`,

  'hashtag-optimizer': (i) => `You are a hashtag research expert. Generate an optimized hashtag strategy for ${i.platform || 'Instagram'}.

Niche: ${i.niche}
Post topic: ${i.topic || 'general content'}
Account size: ${i.accountSize || 'small (under 10k followers)'}

Provide:
- 5 HIGH-volume hashtags (1M+ posts) with estimated reach
- 10 MEDIUM-volume hashtags (100k-1M posts)
- 10 NICHE hashtags (under 100k posts) — best for engagement
- 3 BRANDED hashtag suggestions

Total: 30 hashtags, ready to copy. Brief strategy note at the end.`,

  'carousel-reels-generator': (i) => `You are a social media content strategist. Create a ${i.type || 'carousel'} script for ${i.platform || 'Instagram'}.

Topic: ${i.topic}
Goal: ${i.goal || 'educate and engage'}
Slides/Segments: ${i.count || '7'}

For each slide/segment provide: Slide #, Headline, Body text (2-3 lines max), Visual suggestion. Include a strong hook as Slide 1 and a CTA as the final slide.`,

  'content-repurposing': (i) => `You are a content repurposing expert. Take the following content and transform it into multiple formats.

Original content: "${i.content}"
Original format: ${i.originalFormat || 'blog post'}
Niche/Brand: ${i.niche || 'business'}
${i.shortFormLength ? `Short-form target length: ${i.shortFormLength}` : ''}

Repurpose into:
1. Twitter/X thread (5-7 tweets)
2. LinkedIn post
3. Instagram caption
4. Short email blast
5. YouTube description
6. TikTok/Reels hook + script (60 sec)
7. Short-form rewrite (${i.shortFormLength || '150-200 words'}) — 3 variations with different angles

Label each clearly and maintain the core message.`,

  'social-bio-optimizer': (i) => `You are a social media copywriter. Write 3 optimized bios for ${i.platform || 'Instagram'}.

Business/Person: ${i.business}
What they do: ${i.description}
Target audience: ${i.audience || 'general'}
Tone: ${i.tone || 'professional'}

For each variation: provide the bio text, character count, and a brief note on the angle used. Respect the character limit: Instagram 150, LinkedIn 220, Twitter 160, TikTok 80, Threads 150, Bluesky 256, YouTube 1000.`,

  'linkedin-post-generator': (i) => `You are a LinkedIn content strategist who understands the LinkedIn algorithm and professional audience.

Write 3 LinkedIn post variations about: ${i.topic}

Post type: ${i.postType || 'Story-based'}
Target audience: ${i.audience || 'professionals'}
Tone: ${i.tone || 'authentic and professional'}
CTA: ${i.cta || 'engage in comments'}

For each post:
- Start with a strong hook line (this determines if people click "see more")
- Use short paragraphs (1-2 sentences max per line)
- Include line breaks for readability
- End with a clear CTA
- Add 3-5 relevant hashtags

Format each post ready to copy-paste directly into LinkedIn. Label clearly as Variation 1, 2, 3.`,

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

For each keyword: estimated intent (informational/commercial/transactional), competition level (low/medium/high), content idea.`,

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

  'pain-to-hook': (i) => `You are a direct response copywriter. Transform pain points into compelling hooks.

Product/Service: ${i.product}
Main pain point: ${i.pain}
Audience: ${i.audience || 'general'}

Generate 10 scroll-stopping hooks/opening lines:
- 3 story openers ("I used to...")
- 3 pattern interrupts ("Stop doing X...")
- 2 bold claims ("In 30 days...")
- 2 questions that hurt ("Are you still...?")

For each: the hook, which emotion it triggers, suggested continuation direction.`,

  'offer-angle-matrix': (i) => `You are a direct response copywriter. Generate a sales angle matrix.

Offer/Product: ${i.offer}
Main benefit: ${i.benefit || 'saves time'}
Target market: ${i.market || 'small business owners'}

Create 12 unique angles across these categories:
- Transformation angles (3): before/after, outcome-focused
- Fear/Loss angles (3): what they lose by not acting
- Speed/Ease angles (3): fast, simple, effortless
- Authority/Proof angles (3): credibility, results, social proof

For each angle: angle name, headline, 2-sentence body, CTA suggestion.`,

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

  'subject-line-generator': (i) => `You are an email marketing specialist. Generate high-open-rate subject lines.

Email topic: ${i.topic}
Audience: ${i.audience || 'subscribers'}
Email goal: ${i.goal || 'get opens and clicks'}
Brand voice: ${i.tone || 'friendly'}

Generate 20 subject lines grouped by strategy:
- Curiosity (4) — tease without giving away
- Value (4) — clear benefit in subject
- Urgency (4) — FOMO, deadlines
- Personalization (4) — feels written for them
- Pattern interrupt (4) — unexpected, weird, bold

For each: subject line + preview text pairing (40 chars). Note open rate psychology.`,

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

  'content-idea-generator': (i) => `You are a content strategist. Generate 20 unique content ideas.

Niche/Industry: ${i.niche}
Target audience: ${i.audience || 'general'}
Platforms: ${i.platforms || 'blog, social media'}
Content goal: ${i.goal || 'educate and grow audience'}

For each idea provide:
- Title/Hook
- Format (video, blog, carousel, etc.)
- Angle (what makes it unique)
- CTA direction

Group into: Educational (7), Inspirational (4), Promotional (4), Engagement (5).`,

  'video-content-suite': (i) => {
    const outputType = i.outputType || 'Extract short-form clips';

    if (outputType === 'Convert to blog post') {
      return `You are an SEO content writer. Convert this video script/transcript into a full blog post.

Script/Transcript: "${i.content}"
Target keyword: ${i.keyword || 'not specified'}
Tone: ${i.tone || 'informative and conversational'}

Write a complete blog post with:
- SEO-optimized H1 title
- Meta description (155 chars)
- Introduction with hook
- 4-6 H2 sections with body content
- Bullet points where appropriate
- Conclusion with CTA
- Suggested internal linking opportunities
- AI Overview optimization: include direct-answer paragraphs that AI search engines can cite`;
    }

    if (outputType === 'Both (clips + blog)') {
      return `You are a video content strategist AND SEO writer. Do both tasks for this transcript.

Transcript: "${i.content}"
Platform target: ${i.platform || 'TikTok/Reels/Shorts'}
Target keyword: ${i.keyword || 'not specified'}
Tone: ${i.tone || 'informative and conversational'}

PART 1 — CLIP EXTRACTION
Identify 5-8 short-form clip moments:
- Hook line (first sentence that grabs attention)
- Full clip transcript excerpt
- Why this works as a clip
- Suggested caption

PART 2 — BLOG CONVERSION
Convert the full transcript into a blog post:
- SEO-optimized H1 title
- Meta description (155 chars)
- Introduction with hook
- 4-6 H2 sections
- Conclusion with CTA`;
    }

    // Default: Extract clips
    return `You are a video content strategist. Analyze this transcript and extract the best short-form clip moments.

Transcript: "${i.content}"
Platform target: ${i.platform || 'TikTok/Reels/Shorts'}

For each clip (identify 5-8):
- Hook line (the first sentence that grabs attention)
- Full clip transcript excerpt
- Why this works as a clip
- Suggested caption`;
  },
};
