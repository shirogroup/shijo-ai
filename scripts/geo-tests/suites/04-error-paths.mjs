let pass=0,fail=0;
const t=(n,c)=>{if(c){pass++;console.log(`  ok   ${n}`);}else{fail++;console.log(`  FAIL ${n}`);}};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

// ============ ERROR PATHS ============
console.log('\n--- one engine 500s, one 401s, one times out, one returns junk ---');
for (const k of ['ANTHROPIC_API_KEY','OPENAI_API_KEY','GEMINI_API_KEY','PERPLEXITY_API_KEY',
                 'DATAFORSEO_LOGIN','DATAFORSEO_PASSWORD','GOOGLE_PLACES_API_KEY']) process.env[k]='k';
globalThis.fetch = async (url,init)=>{
  const u=String(url);
  if (u.includes('places.googleapis')) return J({places:[{id:'p',displayName:{text:'Maya Yoga Studio'},
    formattedAddress:'Dallas',types:['yoga_studio'],googleMapsUri:'x'}]});
  if (u.includes('openai')) return J({error:'boom'},500);
  if (u.includes('anthropic')) return J({error:'nope'},401);
  if (u.includes('generativelanguage')) { // simulate abort
    await new Promise((_,rej)=>{ init?.signal?.addEventListener('abort',()=>{const e=new Error('aborted');e.name='AbortError';rej(e);}); });
  }
  if (u.includes('perplexity')) return J({choices:[]});            // no content
  if (u.includes('dataforseo')) return J({status_code:40401});     // provider-level error
  return J({});
};
const G=await import('../.build/scan.mjs');
const identity=await G.resolveIdentity({businessName:'Maya Yoga',websiteUrl:'mayayoga.com',city:'Dallas'});
const r=await G.runScan({identity,prompts:['q1','q2']});

t('scan still returned a result object', !!r && Array.isArray(r.cells));
t('all 10 cells present despite total failure', r.cells.length===10);
t('every cell has an error', r.cells.every(c=>!!c.error));
t('NO cell falsely marked mentioned', r.cells.every(c=>c.mentioned===false));
t('score band = insufficient (not "absent"/0)', r.score.band==='insufficient');
t('answered = 0', r.score.answered===0);
t('enginesAnswered = 0', r.score.enginesAnswered===0);
const msgs=[...new Set(r.cells.map(c=>c.error))];
console.log('       error messages surfaced:'); msgs.forEach(m=>console.log('         · '+m));
t('401 message is generic (no body echoed)', msgs.some(m=>/Authentication with this engine failed/.test(m)));
t('500 message is status-only', msgs.some(m=>/HTTP 500/.test(m)));
t('timeout produces a timeout message', msgs.some(m=>/Timed out/.test(m)));
t('no message leaks the api key', !msgs.some(m=>/test-key|[^a-z]k[^a-z]|api[_-]?key=/i.test(m)));

// ============ PARTIAL FAILURE ============
console.log('\n--- 2 engines work, 3 fail: score must reflect ONLY the working ones ---');
globalThis.fetch = async (url)=>{
  const u=String(url);
  if (u.includes('places.googleapis')) return J({places:[{id:'p',displayName:{text:'Maya Yoga Studio'},
    formattedAddress:'Dallas',types:['yoga_studio'],googleMapsUri:'x'}]});
  if (u.includes('anthropic')) return J({content:[{type:'text',text:'Maya Yoga Studio is great.',citations:[]}]});
  if (u.includes('perplexity')) return J({choices:[{message:{content:'CorePower only.'}}],citations:[]});
  return J({error:'down'},503);
};
const G2=await import('../.build/scan.mjs?v=2');
const id2=await G2.resolveIdentity({businessName:'Maya Yoga',websiteUrl:'mayayoga.com',city:'Dallas'});
const r2=await G2.runScan({identity:id2,prompts:['q1','q2']});
t('4 scorable cells (2 engines x 2 prompts)', r2.score.answered===4);
t('2 mentions', r2.score.mentions===2);
t('score = 50, unaffected by the 3 dead engines', r2.score.score===50);
t('6 cells errored', r2.cells.filter(c=>c.error).length===6);

// ============ MISSING KEYS ============
console.log('\n--- missing keys: engine skipped, ZERO http calls for it ---');
delete process.env.OPENAI_API_KEY; delete process.env.GEMINI_API_KEY;
delete process.env.DATAFORSEO_LOGIN; delete process.env.DATAFORSEO_PASSWORD;
let hits=[];
globalThis.fetch = async (url)=>{ const u=String(url); hits.push(new URL(u).host);
  if (u.includes('places.googleapis')) return J({places:[{id:'p',displayName:{text:'Maya Yoga Studio'},
    formattedAddress:'Dallas',types:['yoga_studio'],googleMapsUri:'x'}]});
  if (u.includes('anthropic')) return J({content:[{type:'text',text:'Maya Yoga Studio.',citations:[]}]});
  return J({choices:[{message:{content:'x'}}],citations:[]});
};
const G3=await import('../.build/scan.mjs?v=3');
t('configuredEngines drops unkeyed', G3.configuredEngines().sort().join()==='claude,perplexity');
const id3=await G3.resolveIdentity({businessName:'Maya Yoga',websiteUrl:'mayayoga.com',city:'Dallas'});
hits=[];
const r3=await G3.runScan({identity:id3,prompts:['q1']});
t('NO request to openai', !hits.includes('api.openai.com'));
t('NO request to gemini', !hits.includes('generativelanguage.googleapis.com'));
t('NO request to dataforseo', !hits.includes('api.dataforseo.com'));
t('skipped engines still appear as cells', r3.cells.filter(c=>c.skipped).length===3);
t('degraded lists the 3 unconfigured engines', r3.degraded.length===3);
t('degraded reason never names the env var', !r3.degraded.some(d=>/API_KEY|LOGIN|PASSWORD/i.test(d.reason)));
t('skipped cells excluded from scoring', r3.score.answered===2);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail?1:0);
