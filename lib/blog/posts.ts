// File-based blog content — no CMS yet. Each post's body is a typed array
// of blocks (paragraph / heading / list) rather than raw markdown, so
// rendering doesn't need a markdown parser dependency (avoids adding a new
// package to a project that's had node_modules install issues before).
// Swap this for a real CMS or DB table later if the team wants to publish
// without a code deploy — the render layer (app/blog/[slug]/page.tsx)
// would only need to change how it fetches `posts`, not how it renders them.

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string; // ISO date
  readTime: string;
  keywords: string[];
  content: BlogBlock[];
  /** Tool this post naturally points to at the end, per lib/tools/registry.ts id */
  relatedToolHref?: string;
  relatedToolLabel?: string;
}

export const posts: BlogPost[] = [
  {
    slug: 'query-fan-out',
    title: 'Query Fan-Out: Why AI Runs Many Searches',
    description: 'Query fan out is what happens when you ask one question and the engine runs many searches to answer it. What that changes for your business, and why our AI visibility checker fans out on purpose.',
    category: 'AI Search',
    publishedAt: '2026-09-02',
    readTime: '4 min read',
    keywords: ['query fan out', 'ai visibility', 'ai search optimization', 'generative engine optimization'],
    relatedToolHref: '/geo',
    relatedToolLabel: 'Check whether answer engines name your business',
    content: [
      { type: 'p', text: 'Query fan out is what happens when you ask one question and the system runs many searches to answer it. You type a single sentence; behind the scenes the engine decomposes it into a set of related queries, runs them in parallel, reads across all the results, and composes one answer from what it finds. You never see the intermediate searches. You only see the paragraph they produced.' },
      { type: 'h2', text: 'Why one question becomes many searches' },
      { type: 'p', text: 'Traditional search matched your words against an index and handed back a ranked list. The judgement was yours — you scanned ten titles and decided which to open. An answer engine has to make that judgement itself, and a single short query rarely carries enough signal to do it well.' },
      { type: 'p', text: 'So it fans out. "Best yoga studio near me for beginners" might become separate searches for beginner-friendly studios, for reviews in your city, for class schedules and pricing, and perhaps a comparison of two specific studios it encountered along the way. Each sub-query retrieves its own documents. The answer you read is synthesised across all of them, and any one of those sub-queries could be the reason a business was named — or missed.' },
      { type: 'h2', text: 'What fan-out changes for your business' },
      { type: 'ul', items: [
        'You are no longer competing for one query. You are competing across a spread of sub-queries you cannot see.',
        'Ranking for your obvious head term does not guarantee inclusion, because the sub-query that actually sourced the answer may be a phrasing you never targeted.',
        'The reverse is also true: you can be cited for a question you never optimised for, because one sub-query happened to match a page you wrote for another reason.',
        'There is no position to check. You are either named in the composed answer or you are absent from it.',
      ] },
      { type: 'p', text: 'That last point is the awkward one. Fan-out is invisible from the outside, so you cannot inspect which sub-queries ran and infer why you were left out. The only practical response is to ask the question the way a person would ask it, across several phrasings, and record what actually comes back.' },
      { type: 'h2', text: 'Our checker fans out on purpose' },
      { type: 'p', text: 'The free AI visibility checker is built around the same idea, deliberately. When you run a scan we do not ask the engines about you. We ask them the question your customer would ask.' },
      { type: 'p', text: 'Every prompt is name-free. Not one contains your business name or your domain, and that rule lives in the code rather than in the good intentions of whoever writes the prompts. The reasoning is simple: asking an engine to "tell me about Acme Yoga" guarantees a mention and measures nothing at all. A mention only means something when it is earned by the question a stranger would type.' },
      { type: 'p', text: 'From a business category and a city we generate up to eight phrasings of the same underlying question — the plain "what are the best X in Y", the recommendation framing, "which one do people rate most highly", the newcomer framing, the direct comparison. They are ordered by how commonly a real person phrases it, so a shortened run still covers the highest-value wording first. Those go out to five answer engines, which is up to forty separate asks for a single scan.' },
      { type: 'p', text: 'Some of the detail is unglamorous and matters anyway. Category data arrives as machine types like yoga_studio, and rendering that raw would produce "best yoga_studios in Dallas" — a prompt no human would write, and a poor stand-in for the query it is meant to imitate. So types are mapped to the noun a person would actually type, over-broad categories like "establishment" are skipped, and plurals are inflected properly, because "best pharmacys" reads as machine-generated to the very systems being queried.' },
      { type: 'h2', text: 'How to read what comes back' },
      { type: 'p', text: 'Results are API-grounded: we query each engine through its public API with web search enabled. That is not the same as a personalised, signed-in consumer session, and answers vary between runs. What you get is a directional signal at one moment — genuinely useful for seeing that four engines out of five never name you, and not a guarantee of rankings, mentions, or customer outcomes. Questions an engine was not asked are marked as not checked and excluded from the score rather than counted against you.' },
      { type: 'p', text: 'If the pattern shows you absent across most phrasings, the fix sits upstream of any tool: pages that answer those questions directly enough to be quoted. Run a check first, though, because the shape of the gap tells you which questions are worth writing for — and that is cheaper than guessing.' },
      { type: 'p', text: 'The check is free and needs no account. If you want scans saved and repeated over time rather than run one at a time, that is what the paid plans cover on the pricing page.' },
    ],
  },

  {
    slug: 'ai-seo-tools-keyword-research-faster',
    title: 'AI SEO Tools: How to Do Keyword Research 10x Faster',
    description: 'A practical walkthrough of how AI keyword research tools speed up the parts of SEO that used to take hours — without replacing the judgment calls that still need a human.',
    category: 'SEO',
    publishedAt: '2026-07-18',
    readTime: '6 min read',
    keywords: ['ai seo tools', 'keyword research tool', 'ai keyword research tool', 'best keywords for seo'],
    relatedToolHref: '/ai-marketing-tools',
    relatedToolLabel: 'Try the AI keyword research tool',
    content: [
      { type: 'p', text: 'Traditional keyword research means pulling a seed list, expanding it manually, cross-referencing search volume in a separate tool, then guessing at intent by scanning search results one by one. It works, but it eats an afternoon before you\'ve written a single word of content.' },
      { type: 'h2', text: 'What AI actually speeds up' },
      { type: 'p', text: 'AI keyword research tools don\'t replace the strategic decisions — picking which topics matter for your business is still a human call. What they compress is the mechanical middle step: generating long-tail and question-based variations from a seed term, grouping them by likely search intent (informational, commercial, navigational, transactional), and surfacing patterns you\'d otherwise find by trial and error.' },
      { type: 'ul', items: [
        'Seed keyword expansion — turning "project management software" into dozens of realistic long-tail variants in seconds',
        'Intent classification — flagging which variants are "best X for Y" (commercial) versus "what is X" (informational)',
        'Question mining — surfacing the actual questions people ask, useful for FAQ sections and AI Overview optimization',
      ] },
      { type: 'h2', text: 'Where a human still has to step in' },
      { type: 'p', text: 'Search volume and competition data still come from real search data providers, not the AI model itself — a language model doesn\'t know how many people searched a term last month, it can only help you organize and prioritize once you have that number. Similarly, deciding which keywords are worth targeting given your actual product, audience, and competitive position is a judgment call no tool should make for you.' },
      { type: 'h2', text: 'A reasonable workflow' },
      { type: 'p', text: 'Start with 3-5 seed terms that describe what you actually sell. Run an AI expansion pass to get long-tail variants and intent tags. Pull real search volume for the resulting shortlist. Then write content briefs for the terms that combine decent volume with intent that matches a page you can realistically build.' },
    ],
  },
  {
    slug: 'ai-ad-copy-that-converts',
    title: 'How to Write AI Ad Copy That Actually Converts',
    description: 'AI can draft ad copy fast, but fast isn\'t the same as effective. Here\'s what separates AI-generated ad copy that converts from AI-generated ad copy that just fills space.',
    category: 'Ads & Copy',
    publishedAt: '2026-07-04',
    readTime: '5 min read',
    keywords: ['ai ad copy generator', 'google ads copy generator', 'ppc ad copy tool', 'ad headline generator tool'],
    relatedToolHref: '/ai-marketing-tools',
    relatedToolLabel: 'Try the AI ad copy generator',
    content: [
      { type: 'p', text: 'The easiest mistake with AI ad copy tools is treating the first draft as the final draft. A language model will happily generate ten grammatically correct, on-brand-sounding headlines that all convert at roughly the average rate for your industry — which is to say, not particularly well.' },
      { type: 'h2', text: 'What actually moves conversion rate' },
      { type: 'ul', items: [
        'Specificity beats cleverness — "Save 20% on your first order" outperforms a clever pun almost every time',
        'One offer per ad — combining three value props usually weakens all three',
        'Match the ad to the landing page — if the headline promises a discount, the landing page needs to lead with that discount, not bury it',
      ] },
      { type: 'h2', text: 'How to use an AI ad copy generator well' },
      { type: 'p', text: 'Generate several headline variants instead of one — the value of AI here is volume and speed, not a single perfect line. Then apply the same filter you\'d use on human-written copy: does this headline make a specific, believable claim, and does it match what the landing page actually delivers? Discard anything vague.' },
      { type: 'p', text: 'A/B testing still matters. AI can generate the variants; it can\'t tell you in advance which one your specific audience will respond to. Run the strongest 2-3 candidates against each other with real traffic before committing budget to one.' },
      { type: 'h2', text: 'A quick checklist before you publish' },
      { type: 'ul', items: [
        'Does the headline make one clear, specific claim?',
        'Does the landing page deliver on that exact claim above the fold?',
        'Would this ad still make sense if you removed all the adjectives?',
      ] },
    ],
  },
  {
    slug: 'ai-marketing-tools-small-business-2026',
    title: 'AI Marketing Tools Every Small Business Should Consider in 2026',
    description: 'A practical look at where AI marketing tools genuinely save small teams time — and where they\'re still no substitute for a strategy.',
    category: 'Marketing Strategy',
    publishedAt: '2026-06-20',
    readTime: '7 min read',
    keywords: ['ai marketing tools for small business', 'ai marketing platform', 'all in one ai marketing tool', 'affordable ai marketing software'],
    relatedToolHref: '/register',
    relatedToolLabel: 'Try 2 tools free, no credit card needed',
    content: [
      { type: 'p', text: 'Small marketing teams — often one or two people wearing five hats — are the group that benefits most from AI tools, simply because there\'s no headcount to throw at the mechanical parts of the job: drafting the tenth variation of an email subject line, writing meta descriptions for fifty product pages, or turning one blog post into a week of social captions.' },
      { type: 'h2', text: 'Where AI marketing tools genuinely help' },
      { type: 'ul', items: [
        'First-draft generation — ad copy, email sequences, social captions, and SEO meta tags all benefit from a fast first draft you edit down, rather than a blank page',
        'Repurposing — turning one piece of content into formats for multiple channels without redoing the thinking each time',
        'Consistency at volume — keeping tone and structure consistent across dozens of small pieces of copy is tedious for a human and trivial for a model',
      ] },
      { type: 'h2', text: 'Where they don\'t replace a strategy' },
      { type: 'p', text: 'An AI marketing platform can produce copy quickly, but it can\'t decide who your audience is, what makes your offer different, or which channel is worth the investment. Those are still calls a founder or marketer has to make based on knowledge of the actual business — no tool, AI or otherwise, has that context by default.' },
      { type: 'h2', text: 'What to look for in an all-in-one AI marketing tool' },
      { type: 'ul', items: [
        'Coverage across the channels you actually use — SEO, ads, email, and social, not just one',
        'A free tier that lets you test real output before paying, rather than a time-limited trial that pressures a decision',
        'Transparent pricing with no hidden per-word or per-credit surprises',
      ] },
      { type: 'p', text: 'If you\'re evaluating tools, start with whichever channel is currently your biggest time sink — for most small teams, that\'s either weekly social content or ad copy variations — and see how much of a real first draft the tool gets you to before you touch it.' },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
