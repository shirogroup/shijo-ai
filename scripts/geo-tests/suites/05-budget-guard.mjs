import { checkGuards, estimateScanCostUsd, currentUtcDay, dailyBudgetUsd, DEFAULT_DAILY_BUDGET_USD } from '../.build/budget.mjs';
const __state = globalThis.__geoTestDbState;
let pass=0,fail=0;
const t=(n,c)=>{if(c){pass++;console.log(`  ok   ${n}`);}else{fail++;console.log(`  FAIL ${n}`);}};
const reset=()=>{__state.queue=[];__state.throwOn=null;__state.calls=0;};

console.log('\n--- currentUtcDay ---');
t('YYYY-MM-DD format', /^\d{4}-\d{2}-\d{2}$/.test(currentUtcDay()));
t('uses UTC not local (23:30 UTC on 1st stays the 1st)', currentUtcDay(new Date('2026-03-01T23:30:00Z'))==='2026-03-01');
t('rolls at UTC midnight', currentUtcDay(new Date('2026-03-02T00:00:01Z'))==='2026-03-02');

console.log('\n--- dailyBudgetUsd (malformed values must NOT disable the guard) ---');
const set=v=>{ if(v===undefined) delete process.env.GEO_DAILY_BUDGET_USD; else process.env.GEO_DAILY_BUDGET_USD=v; };
set(undefined); t('unset -> default 25', dailyBudgetUsd()===DEFAULT_DAILY_BUDGET_USD);
set('50');      t('"50" -> 50', dailyBudgetUsd()===50);
set('abc');     t('"abc" -> falls back to 25, not NaN', dailyBudgetUsd()===25);
set('0');       t('"0" -> falls back to 25 (would disable scanning)', dailyBudgetUsd()===25);
set('-5');      t('"-5" -> falls back to 25', dailyBudgetUsd()===25);
set('');        t('empty -> 25', dailyBudgetUsd()===25);
set('12.5');    t('"12.5" -> 12.5', dailyBudgetUsd()===12.5);
set(undefined);

console.log('\n--- estimateScanCostUsd ---');
t('5 engines x 8 prompts is a sane number', (()=>{const c=estimateScanCostUsd(['openai','gemini','perplexity','claude','dataforseo'],8);return c>0&&c<1;})());
console.log(`       5 engines x 8 prompts = $${estimateScanCostUsd(['openai','gemini','perplexity','claude','dataforseo'],8)}`);
t('zero prompts = 0', estimateScanCostUsd(['openai'],0)===0);
t('unknown engine still costed (no NaN)', Number.isFinite(estimateScanCostUsd(['bogus'],4)));

console.log('\n--- checkGuards: allowed ---');
reset(); __state.queue=[[{count:0}],[{total:'0'}]];
let g=await checkGuards('1.2.3.4',0.30);
t('allows first scan of the day', g.allowed===true);
t('reports utcDay', g.allowed && /^\d{4}-\d{2}-\d{2}$/.test(g.utcDay));

console.log('\n--- checkGuards: per-IP cap ---');
reset(); __state.queue=[[{count:1}],[{total:'0'}]];
g=await checkGuards('1.2.3.4',0.30);
t('BLOCKS second scan from same IP', g.allowed===false && g.reason==='ip_cap');
t('message tells user when it resets', !g.allowed && /midnight UTC/i.test(g.message));
t('did NOT need the spend query (short-circuits)', __state.calls===1);

console.log('\n--- checkGuards: daily budget ---');
reset(); __state.queue=[[{count:0}],[{total:'24.90'}]];
g=await checkGuards('9.9.9.9',0.30);   // 24.90 + 0.30 = 25.20 > 25
t('BLOCKS when planned cost would exceed budget', g.allowed===false && g.reason==='budget');
reset(); __state.queue=[[{count:0}],[{total:'24.50'}]];
g=await checkGuards('9.9.9.9',0.30);   // 24.80 < 25
t('ALLOWS when it fits exactly under', g.allowed===true);
reset(); __state.queue=[[{count:0}],[{total:'999'}]];
g=await checkGuards('9.9.9.9',0.01);
t('blocks hard when way over', g.allowed===false && g.reason==='budget');
t('budget message does not leak the dollar figure', !g.allowed && !/\$|25|999/.test(g.message));

console.log('\n--- checkGuards: FAIL CLOSED on db error ---');
reset(); __state.throwOn=1;
g=await checkGuards('1.2.3.4',0.30);
t('db failure REFUSES the scan (does not fail open)', g.allowed===false);
t('reason=unavailable', !g.allowed && g.reason==='unavailable');
reset(); __state.throwOn=2;
g=await checkGuards('1.2.3.4',0.30);
t('db failure on 2nd query also refuses', g.allowed===false && g.reason==='unavailable');

console.log('\n--- checkGuards: null/empty db rows ---');
reset(); __state.queue=[[],[]];
g=await checkGuards('1.2.3.4',0.30);
t('empty result sets do not crash; treated as 0', g.allowed===true);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail?1:0);
