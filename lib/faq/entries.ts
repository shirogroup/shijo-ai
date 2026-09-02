// File-based FAQ / explainer content — no CMS, same rationale as lib/blog/posts.ts:
// each body is a typed array of blocks rather than raw markdown, so rendering
// needs no markdown parser dependency.
//
// These pages exist to be indexable definitions for the AI-visibility vocabulary
// (/geo is the tool; these are the explainers). Keep them factual: every claim
// about what SHIJO.AI measures must match lib/geo/* and GEO_DISCLAIMER in
// lib/pricing-plans.ts. No ranking, mention or customer-outcome promises.

export type FaqBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

export interface FaqEntry {
  slug: string;
  /** Page <h1>. */
  title: string;
  /** <title> tag; kept separate so the h1 can stay a plain question. */
  metaTitle: string;
  description: string;
  /** The one keyword this page is written for. One primary per page. */
  primaryKeyword: string;
  keywords: string[];
  updatedAt: string; // ISO date
  readTime: string;
  /** Short answer used for the FAQPage JSON-LD acceptedAnswer. */
  shortAnswer: string;
  content: FaqBlock[];
}

export const faqEntries: FaqEntry[] = [
  {
    slug: 'what-is-ai-visibility',
    title: 'What is AI visibility?',
    metaTitle: 'What Is AI Visibility? Definition and How to Measure It',
    description:
      'AI visibility is whether AI assistants name your business when someone asks them a question you should be the answer to. What it means, why it is not the same as ranking, and how to measure it.',
    primaryKeyword: 'ai visibility',
    keywords: ['ai visibility', 'ai search optimization', 'ai seo'],
    updatedAt: '2026-09-02',
    readTime: '4 min read',
    shortAnswer:
      'AI visibility is whether AI assistants such as ChatGPT, Gemini, Perplexity and Google AI Overviews name your business in their answers when someone asks a question your business should be the answer to. Unlike a search ranking, there is no single position to check — the same question can produce different answers at different moments.',
    content: [
      { type: 'p', text: 'AI visibility is whether AI assistants name your business when someone asks them a question you should be the answer to. When a person asks ChatGPT, Gemini, Perplexity or Google AI Overviews for a recommendation, the assistant returns a short written answer naming a handful of options. AI visibility is simply this: are you one of them?' },
      { type: 'p', text: 'It is a different question from search ranking, and the difference matters. A ranking is a position in a list you can look up. An AI answer is generated text — there is no position ten to be on, no page two to climb from. You are either named in the answer or you are absent from it.' },
      { type: 'h2', text: 'Why it cannot be measured like a ranking' },
      { type: 'p', text: 'Three properties make AI visibility harder to pin down than a keyword position, and any tool that claims otherwise is overselling.' },
      { type: 'ul', items: [
        'Answers vary. Ask the same question twice and the wording, and sometimes the businesses named, can differ.',
        'Answers are personalised. A signed-in assistant session carries the history and context of that particular person, which nobody else can reproduce.',
        'There is no ranking to report. An answer either mentions you or it does not, so the useful unit is presence across many questions and several engines, not a single number you can chart against a competitor.',
      ] },
      { type: 'h2', text: 'How SHIJO.AI measures it' },
      { type: 'p', text: 'Our check is API-grounded: we query each engine through its public API with web search enabled, ask the kinds of questions your customers actually ask, and record engine by engine whether your business was named and which sources were cited.' },
      { type: 'p', text: 'Being explicit about the limit of that method is part of the method. Querying an API is not the same as a signed-in consumer session, which is personalised and changes over time. What you get is a directional signal at one moment — useful for spotting that four engines out of five never mention you, not a guarantee of any ranking, mention or customer outcome. Questions an engine was not asked are marked as not checked and excluded from the score rather than counted as a miss.' },
      { type: 'h2', text: 'What to do with the answer' },
      { type: 'p', text: 'A first check is diagnostic. If no engine names you, the gap is usually that nothing you publish answers the question directly enough to be quoted — the work that follows is Generative Engine Optimization and Answer Engine Optimization, both of which are about making pages that answer questions cleanly rather than pages that merely rank.' },
      { type: 'p', text: 'You can run a check on your own business for free, without an account, and see the engine-by-engine result before deciding whether any of this is worth your time.' },
    ],
  },

  {
    slug: 'what-is-generative-engine-optimization',
    title: 'What is Generative Engine Optimization (GEO)?',
    metaTitle: 'What Is Generative Engine Optimization (GEO)? A Plain Definition',
    description:
      'Generative Engine Optimization (GEO) is the practice of making your content likely to be used and cited in AI-generated answers. What GEO means, how it differs from SEO, and how to check where you stand.',
    primaryKeyword: 'generative engine optimization',
    keywords: ['generative engine optimization', 'llm optimization', 'ai search optimization'],
    updatedAt: '2026-09-02',
    readTime: '4 min read',
    shortAnswer:
      'Generative Engine Optimization (GEO) is the practice of making your content likely to be drawn on and cited when an AI assistant generates an answer. Where classic SEO optimises for a position in a list of links, GEO optimises for being quoted inside the answer itself.',
    content: [
      { type: 'p', text: 'Generative Engine Optimization, usually shortened to GEO, is the practice of making your content likely to be used and cited when an AI assistant writes an answer. The target is not a position in a list of blue links. The target is the paragraph the assistant produces.' },
      { type: 'p', text: 'The name points at what changed. A generative engine does not hand back ten documents and let the reader choose. It reads sources, synthesises them, and returns one composed answer that may name two or three businesses. Everything else that matched the query is invisible to that reader.' },
      { type: 'h2', text: 'How GEO differs from SEO' },
      { type: 'p', text: 'GEO does not replace SEO, and the overlap is large — a page that no crawler can reach will not be quoted either. The difference is in what counts as success.' },
      { type: 'ul', items: [
        'SEO optimises for a position. GEO optimises for being quoted, which has no position.',
        'SEO rewards a page that satisfies a query. GEO rewards a passage that answers a question cleanly enough to be lifted out of the page and reused.',
        'SEO measures rank and clicks. GEO measures whether you were named at all, across several engines and many phrasings of the same question.',
      ] },
      { type: 'h2', text: 'What GEO work actually looks like' },
      { type: 'p', text: 'In practice most of it is unglamorous writing discipline: state the answer before the context rather than after it, put definitions in their own clearly-headed sections, use the words people actually type, and make claims specific enough to be quotable without a caveat attached. Assistants tend to reach for text that stands on its own when lifted from the page around it.' },
      { type: 'h2', text: 'How SHIJO.AI measures GEO' },
      { type: 'p', text: 'You cannot improve what you have not measured, and GEO has no rank tracker. Our check is API-grounded: we query each engine through its public API with web search enabled, ask the questions your customers ask, and record engine by engine whether your business was named and which sources were cited.' },
      { type: 'p', text: 'That is a directional signal at one moment, not a ranking. Querying an API is not the same as a personalised, signed-in consumer session, and we do not guarantee rankings, mentions, or customer outcomes. The value is in the pattern across engines and questions — particularly the questions where every engine names somebody other than you.' },
      { type: 'p', text: 'Run a free check on your own business first, then decide whether ongoing tracking is worth paying for.' },
    ],
  },

  {
    slug: 'what-is-answer-engine-optimization',
    title: 'What is Answer Engine Optimization (AEO)?',
    metaTitle: 'What Is Answer Engine Optimization (AEO)? Definition and Method',
    description:
      'Answer Engine Optimization (AEO) is the practice of structuring content so answer engines can extract a direct answer from it. What AEO means, how it relates to GEO, and how to check whether it is working.',
    primaryKeyword: 'answer engine optimization',
    keywords: ['answer engine optimization', 'llm seo', 'ai seo'],
    updatedAt: '2026-09-02',
    readTime: '4 min read',
    shortAnswer:
      'Answer Engine Optimization (AEO) is the practice of structuring your content so an answer engine can extract a direct, self-contained answer from it. It focuses on the question-and-answer shape of a page rather than on ranking that page in a list of results.',
    content: [
      { type: 'p', text: 'Answer Engine Optimization, or AEO, is the practice of structuring content so an answer engine can pull a direct answer out of it. An answer engine is anything that responds to a question with a written answer instead of a list of links — Google AI Overviews, Perplexity, and the assistant modes of ChatGPT and Gemini all behave this way.' },
      { type: 'p', text: 'The central idea is simple: if a machine has to infer your answer from four scattered paragraphs, it will usually quote a competitor who stated it in one.' },
      { type: 'h2', text: 'What AEO asks of a page' },
      { type: 'ul', items: [
        'A real question as a heading, phrased the way a person would ask it.',
        'The answer immediately underneath, in the first sentence or two, before any background.',
        'Self-contained wording, so the passage still makes sense when lifted away from the rest of the page.',
        'Specifics rather than hedges — a number, a definition, a condition — since vague text is hard to quote responsibly.',
      ] },
      { type: 'h2', text: 'Common ways AEO work goes wrong' },
      { type: 'p', text: 'Most failed attempts share the same few habits, and all of them come from writing for a ranking rather than for extraction.' },
      { type: 'ul', items: [
        'Burying the answer under three paragraphs of preamble, so the extractable sentence never arrives.',
        'Answering a question nobody phrases that way, because the heading was written for a keyword tool rather than a person.',
        'Writing passages that only make sense in sequence, so any single paragraph lifted out of them reads as a fragment.',
        'Adding FAQ markup to a page that does not visibly answer the question, which helps nothing and can be ignored outright.',
      ] },
      { type: 'h2', text: 'AEO and GEO are not rivals' },
      { type: 'p', text: 'The two terms are often used interchangeably and the overlap is genuine. The useful distinction is emphasis. Answer Engine Optimization is mostly about the shape of a page: can a direct answer be extracted from it? Generative Engine Optimization is mostly about the outcome: does the engine actually draw on you when it composes its answer? You do AEO work in order to get a GEO result.' },
      { type: 'h2', text: 'How SHIJO.AI measures whether it worked' },
      { type: 'p', text: 'Structure is a means, not the goal, so the test is not whether your markup validates — it is whether engines name you. Our check is API-grounded: we query each engine through its public API with web search enabled, ask the questions your customers ask, and record engine by engine whether you were named and what was cited.' },
      { type: 'p', text: 'The result is a directional signal at one moment. An API query is not a personalised signed-in session, answers vary between runs, and we do not guarantee rankings, mentions, or customer outcomes. Questions an engine was not asked are marked as not checked and left out of the score.' },
      { type: 'p', text: 'The practical sequence is to check first, fix the pages the check exposes, then check again.' },
    ],
  },

  {
    slug: 'geo-vs-aeo-vs-seo',
    title: 'GEO vs AEO vs SEO: what is the difference?',
    metaTitle: 'GEO vs AEO vs SEO: What Is the Difference? | AI Search Optimization',
    description:
      'GEO, AEO and SEO are three overlapping approaches to ai search optimization. What each term actually means, where they genuinely differ, and which one to start with.',
    primaryKeyword: 'ai search optimization',
    keywords: ['ai search optimization', 'ai seo', 'llm seo', 'generative engine optimization'],
    updatedAt: '2026-09-02',
    readTime: '5 min read',
    shortAnswer:
      'SEO optimises for a position in a list of links. Answer Engine Optimization (AEO) optimises the structure of a page so a direct answer can be extracted from it. Generative Engine Optimization (GEO) optimises for being named and cited inside an AI-generated answer. They overlap heavily and are best treated as three emphases within ai search optimization rather than three separate disciplines.',
    content: [
      { type: 'p', text: 'Three acronyms get used for overlapping work, often interchangeably and often to sell something. Here is what each one actually means, and where the differences are real rather than marketing.' },
      { type: 'h2', text: 'SEO: optimising for a position' },
      { type: 'p', text: 'Search engine optimisation targets a ranked list. Success is a position, measured over time, for a query. The reader sees your title and description and decides whether to click. Everything downstream — traffic, conversions — depends on that click happening.' },
      { type: 'h2', text: 'AEO: optimising the shape of the page' },
      { type: 'p', text: 'Answer Engine Optimization targets extractability. Success is that a machine reading your page can lift out a direct, self-contained answer to a question a person actually asked. That means question-shaped headings, the answer stated up front, and passages that survive being separated from their surroundings.' },
      { type: 'h2', text: 'GEO: optimising for being named' },
      { type: 'p', text: 'Generative Engine Optimization targets the composed answer itself. Success is being one of the two or three businesses the assistant names, and being cited as a source. There is no position, so there is no rank to improve — you are either in the answer or absent from it.' },
      { type: 'h2', text: 'Where they genuinely differ' },
      { type: 'ul', items: [
        'Unit of success: SEO a position, AEO an extractable answer, GEO a mention.',
        'What the reader sees: SEO a link they choose, AEO and GEO an answer already written for them.',
        'How you measure: SEO with rank tracking, AEO by inspecting page structure, GEO by asking engines the question and recording who gets named.',
        'Failure mode: in SEO you are on page two, in GEO you are simply not in the answer, which is invisible unless you check.',
      ] },
      { type: 'h2', text: 'Where they are the same' },
      { type: 'p', text: 'More than the acronyms suggest. All three need pages that are crawlable, accurate and genuinely useful, and none of them rewards keyword stuffing. AEO structure work is largely how you get a GEO outcome, and both depend on the technical hygiene SEO has always required. Treating them as three separate budgets is usually a mistake.' },
      { type: 'h2', text: 'Which to start with' },
      { type: 'p', text: 'Start by measuring, because the answer changes what you should do. If engines already name you, the work is defending and widening that. If none of them do, structural AEO work on your most important pages is the cheapest first move.' },
      { type: 'p', text: 'Our check is API-grounded: we query each engine through its public API with web search enabled and record, engine by engine, whether your business was named and what was cited. It is a directional signal at one moment rather than a ranking, an API query is not a personalised signed-in session, and we do not guarantee rankings, mentions, or customer outcomes.' },
    ],
  },

  {
    slug: 'ai-search-visibility-tools',
    title: 'AI search visibility tools: what they do and what to check',
    metaTitle: 'AI Search Visibility Tools: What They Do and What to Check',
    description:
      'AI search visibility tools check whether AI assistants name your business in their answers. What these tools can measure, what they cannot, and the questions worth asking before you pay for one.',
    primaryKeyword: 'AI search visibility tools',
    keywords: ['ai search visibility tools', 'ai visibility', 'llm optimization', 'ai seo'],
    updatedAt: '2026-09-02',
    readTime: '5 min read',
    shortAnswer:
      'AI search visibility tools ask AI assistants the questions your customers ask and record whether your business is named in the answers. Good ones report engine by engine, show the sources cited, and state plainly that results vary between runs; they cannot promise rankings or customer outcomes.',
    content: [
      { type: 'p', text: 'AI search visibility tools exist to answer one question: when an AI assistant is asked something your business should be the answer to, are you named? Because there is no ranking to look up, the only way to find out is to ask the engines and record what comes back.' },
      { type: 'h2', text: 'What these tools can actually tell you' },
      { type: 'ul', items: [
        'Whether you were named, engine by engine, rather than as a single blended score.',
        'Which sources the engine cited when it answered — often more actionable than the mention itself.',
        'Which phrasings of a question you show up for and which you never do.',
        'Whether the gap is universal or specific to one engine, which points at very different fixes.',
      ] },
      { type: 'h2', text: 'What they cannot tell you' },
      { type: 'p', text: 'This is where claims tend to outrun the method, so it is worth being blunt. No tool can reproduce a personalised, signed-in consumer session — those carry a particular person context nobody else can replay. No tool can promise you a mention, because engines are not a ranked index you can climb. And no tool can honestly attribute customers to an AI assistant, because assistants are not a referral channel that reports back.' },
      { type: 'p', text: 'Answers also vary between runs. A tool that shows a smooth line going up, with no acknowledgement of that variance, is presenting more certainty than the underlying data supports.' },
      { type: 'h2', text: 'Questions worth asking before you pay' },
      { type: 'ul', items: [
        'Is the check API-grounded, and does the tool say so plainly?',
        'Does it show per-engine results, or hide everything behind one number?',
        'Does it distinguish "asked and not named" from "not asked at all"?',
        'Does it state the limits of the method in its own interface, not just in a terms page?',
      ] },
      { type: 'h2', text: 'How SHIJO.AI does it' },
      { type: 'p', text: 'We query each engine through its public API with web search enabled, ask the questions your customers actually ask, and report engine by engine whether your business was named, with the sources each engine cited. Questions an engine was not asked are marked as not checked and excluded from the score rather than counted against you.' },
      { type: 'p', text: 'The result is a directional signal at one moment. An API query is not the same as a signed-in consumer session, which is personalised and changes over time, and we do not guarantee rankings, mentions, or customer outcomes. We would rather you see that stated on the result than discover it later.' },
      { type: 'p', text: 'The check is free and needs no account, so the cheapest way to judge any of this is to run one on your own business.' },
    ],
  },
];

export function getFaqEntryBySlug(slug: string): FaqEntry | undefined {
  return faqEntries.find((e) => e.slug === slug);
}
