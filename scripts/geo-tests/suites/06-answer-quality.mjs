// Guards added 2026-08-30 after the first live scan produced a confident 0/100
// for a yoga studio off answers about AT&T and Texas Instruments.
// Verbatim strings below are REAL replies from that scan.
import { makeT } from './_harness.mjs';
const G = await import('../.build/pure.mjs');
const { t, hdr, done } = makeT();

// --- real non-answers from the live scan (truncated but verbatim) ---
const NON_ANSWERS = [
  `I'd be happy to help you find some of the best businesses in Dallas! However, to give you the most relevant and current recommendations, could you tell me more about what you're looking for? Are you interested in: - **Restaurants** (specific cuisines)? - **Shopping** (retail stores, malls)?`,
  `I'd be happy to help! However, I'd like to know a bit more about what you're looking for. Dallas has many excellent businesses across different industries. Could you tell me: 1. **What type of business are you interested in?**`,
  `I'd be happy to help you find great businesses in Dallas! However, to give you the most relevant recommendations, could you tell me a bit more about what you're looking for? For example: - **What type of business?**`,
  `I'd be happy to help you find the best business opportunities for beginners in Dallas! However, I need a bit more clarification. When you ask about "which business is best for beginners," are you asking about: 1. **Starting your own business?**`,
];

// --- real genuine answers from the same scan ---
const REAL_ANSWERS = [
  `Based on current data, Dallas's most popular business sectors include major corporations. **Texas Instruments** - [www.ti.com](https://www.ti.com) (semiconductor manufacturing) - **AT&T** - [www.att.com](https://www.att.com)`,
  `Rosewood Mansion on Turtle Creek has kept its elite status as the best resort in Texas. Their website is [www.rosewoodhotels.com](https://www.rosewoodhotels.com). The Ritz-Carlton Dallas was honored as the No. 3 best Texas hotel.`,
  `**AT&T** - Founded in 1983, AT&T is an innovative organization in the telecommunications industry with more than 10,000 employees. - Website: www.att.com`,
  `Here are some well-reviewed businesses in Dallas: **Smokey John's Bar-B-Que** - A top-rated barbecue spot. **Sixty Vines** - Listed among the best reviewed establishments. **Daily Coffee** - Located at 3232 McKinney Ave in Uptown. See mayayoga.com too.`,
];

hdr('looksLikeNonAnswer: REAL clarifying questions must be excluded');
NON_ANSWERS.forEach((a, i) => t(`non-answer #${i + 1} detected`, G.looksLikeNonAnswer(a) === true));

hdr('looksLikeNonAnswer: REAL answers must NOT be excluded');
REAL_ANSWERS.forEach((a, i) => t(`real answer #${i + 1} kept`, G.looksLikeNonAnswer(a) === false));

hdr('looksLikeNonAnswer: edge cases');
t('empty string is a non-answer', G.looksLikeNonAnswer('') === true);
t('whitespace only is a non-answer', G.looksLikeNonAnswer('   \n ') === true);
t('answer WITH a domain is kept even if it also asks a question',
  G.looksLikeNonAnswer('Could you tell me your budget? Meanwhile try Maya Yoga at mayayoga.com') === false);
t('plain recommendation with no question is kept',
  G.looksLikeNonAnswer('Maya Yoga Studio and CorePower are both well regarded in Dallas.') === false);

hdr('identity gate: unresolved business must not receive a score');
const mk = (engine, prompt, o = {}) =>
  ({ engine, prompt, mentioned: false, matchedOn: [], snippet: '', citations: [], ...o });
const engines = ['openai', 'gemini', 'perplexity', 'claude', 'dataforseo'];
const cells = ['p1','p2','p3','p4'].map((p) => mk('claude', p));

let s = G.scoreScan(cells, engines, { identityResolved: false });
t('band = unverified', s.band === 'unverified');
t('answered still reported (grid is still shown)', s.answered === 4);

s = G.scoreScan(cells, engines, { identityResolved: true });
t('resolved identity scores normally (absent, a real 0)', s.band === 'absent');

s = G.scoreScan(cells, engines);
t('omitting the option preserves old behaviour', s.band === 'absent');

const mentioned = ['p1','p2','p3','p4'].map((p) => mk('claude', p, { mentioned: true }));
s = G.scoreScan(mentioned, engines, { identityResolved: false });
t('unverified overrides even a 100% mention rate', s.band === 'unverified');

hdr('BAND_COPY covers the new band');
t('unverified has title + detail',
  !!G.BAND_COPY.unverified?.title && !!G.BAND_COPY.unverified?.detail);
t('unverified copy explains WHY there is no score',
  /could not confirm/i.test(G.BAND_COPY.unverified.detail));

done();
