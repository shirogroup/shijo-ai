// End-to-end: the real orchestrator and all five real adapters, with fetch
// intercepted to return each vendor's documented response shape. Proves the
// response parsers work without calling (or paying for) a single API.
import { makeT, J, PLACES_OK, ALL_KEYS } from './_harness.mjs';
const { t, hdr, done } = makeT();

for (const k of ALL_KEYS) process.env[k] = 'test-key-value';

let inFlight = 0, maxInFlight = 0, calls = [], nameLeaks = [];

globalThis.fetch = async (url, init) => {
  inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
  const u = String(url);
  calls.push(u);
  // The business name must never appear in an ENGINE request body. It legitimately
  // appears in the Places lookup, which is the whole point of that call.
  if (init?.body && /Maya Yoga/i.test(String(init.body)) && !u.includes('places.googleapis')) {
    nameLeaks.push(u);
  }
  await new Promise((r) => setTimeout(r, 25));
  inFlight--;

  if (u.includes('places.googleapis')) return J(PLACES_OK);

  // Claude: content[] with text blocks carrying citations[]
  if (u.includes('api.anthropic.com')) return J({ content: [
    { type: 'server_tool_use', id: 's1', name: 'web_search', input: { query: 'x' } },
    { type: 'web_search_tool_result', tool_use_id: 's1',
      content: [{ type: 'web_search_result', url: 'https://a.com', title: 'A' }] },
    { type: 'text', text: 'Maya Yoga Studio is well reviewed.',
      citations: [{ type: 'web_search_result_location', url: 'https://a.com', title: 'A' }] },
  ] });

  // OpenAI Responses: output[].content[].{text,annotations[]}
  if (u.includes('api.openai.com')) return J({ output: [{ type: 'message', content: [
    { type: 'output_text', text: 'Top picks include Maya Yoga Studio and CorePower.',
      annotations: [{ type: 'url_citation', url: 'https://b.com', title: 'B' }] },
  ] }] });

  // Gemini Interactions: steps[] -> model_output -> content[].annotations[]
  if (u.includes('generativelanguage.googleapis.com')) return J({ steps: [
    { type: 'thought', summary: [{ type: 'text', text: 'thinking' }] },
    { type: 'google_search_call', arguments: { queries: ['best yoga dallas'] } },
    { type: 'model_output', content: [{ type: 'text', text: 'CorePower Yoga is popular in Dallas.',
      annotations: [{ type: 'url_citation', url: 'https://c.com', title: 'C' }] }] },
  ] });

  // Perplexity Sonar: choices[].message.content + citations[] + search_results[]
  if (u.includes('api.perplexity.ai')) return J({
    choices: [{ message: { content: 'Visit mayayoga.com for classes.' } }],
    citations: ['https://d.com'],
    search_results: [{ title: 'D', url: 'https://d.com' }, { title: 'E', url: 'https://e.com' }],
  });

  // DataForSEO: tasks[].result[].items[] with NESTED items[] and references[]
  if (u.includes('api.dataforseo.com')) return J({ status_code: 20000, tasks: [{ status_code: 20000,
    result: [{ items: [{ type: 'ai_mode_element', text: 'Several studios rank highly.',
      references: [{ url: 'https://f.com' }],
      items: [{ type: 'nested', text: 'Maya Yoga Studio is one.',
        references: [{ url: 'https://g.com' }] }] }] }] }] });

  return J({});
};

const G = await import('../.build/scan.mjs');

hdr('configuredEngines');
t('all 5 engines configured when all keys present', G.configuredEngines().length === 5);

hdr('resolveIdentity (real Places adapter, mocked HTTP)');
const identity = await G.resolveIdentity({
  businessName: 'Maya Yoga', websiteUrl: 'https://www.MayaYoga.com/classes', city: 'Dallas' });
t('resolved = true', identity.resolved === true);
t('uses canonical Places name over user input', identity.displayName === 'Maya Yoga Studio');
t('placeId captured', identity.placeId === 'places/ABC');
t('types captured', identity.types.includes('yoga_studio'));
t('domain normalised (scheme/www/path stripped)', identity.domain === 'mayayoga.com');

hdr('runScan: 5 engines x 3 prompts');
const prompts = [
  'What are the best yoga studios in Dallas?',
  'Recommend a good yoga studio in Dallas.',
  'Compare top yoga studios in Dallas.',
];
calls = []; maxInFlight = 0;
const r = await G.runScan({ identity, prompts });

t('15 cells produced', r.cells.length === 15);
t('15 HTTP calls made', calls.length === 15);
t(`concurrency capped at 3 (observed ${maxInFlight})`, maxInFlight <= 3);
t('no cell errored', r.cells.filter((c) => c.error).length === 0);
t('degraded list empty', r.degraded.length === 0);
t('NO engine request body carried the business name', nameLeaks.length === 0);

hdr('per-vendor response parsing');
const by = (e) => r.cells.filter((c) => c.engine === e);
t('claude: text + citation parsed',
  by('claude')[0].snippet.includes('Maya Yoga Studio') && by('claude')[0].citations.includes('https://a.com'));
t('openai: output[].content[].text parsed',
  by('openai')[0].snippet.includes('CorePower') && by('openai')[0].citations.includes('https://b.com'));
t('gemini: steps -> model_output parsed',
  by('gemini')[0].snippet.includes('CorePower Yoga is popular'));
t('gemini: correctly NOT a mention (name absent from answer)',
  by('gemini').every((c) => !c.mentioned));
t('perplexity: citations + search_results merged AND deduped to 2',
  by('perplexity')[0].citations.length === 2);
t('perplexity: matched on DOMAIN, not name',
  by('perplexity')[0].matchedOn.includes('domain') && by('perplexity')[0].mentioned);
t('dataforseo: NESTED items harvested',
  by('dataforseo')[0].snippet.includes('Maya Yoga Studio is one'));
t('dataforseo: nested references collected',
  by('dataforseo')[0].citations.includes('https://g.com'));

hdr('scoring for this run');
// claude, openai, perplexity and dataforseo answers all reference the business;
// gemini's does not. 12 of 15 = 80.
console.log(`       score=${r.score.score} band=${r.score.band} ` +
            `mentions=${r.score.mentions}/${r.score.answered} ` +
            `engines=${r.score.enginesAnswered}/${r.score.enginesAttempted}`);
t('score = 12/15 = 80', r.score.score === 80);
t('band = strong', r.score.band === 'strong');
t('all 5 engines answered', r.score.enginesAnswered === 5);
t('durationMs recorded', typeof r.durationMs === 'number' && r.durationMs > 0);
t('every cell has latencyMs', r.cells.every((c) => typeof c.latencyMs === 'number'));

done();
