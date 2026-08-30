import * as G from '../.build/pure.mjs';
let pass=0,fail=0;
const t=(n,c)=>{if(c){pass++;console.log(`  ok   ${n}`);}else{fail++;console.log(`  FAIL ${n}`);}};
const id=(name,domain)=>({placeId:null,displayName:name,formattedAddress:null,types:[],googleMapsUri:null,domain,city:'Dallas',resolved:true});

console.log('\n--- nameVariants ---');
console.log('       Maya Yoga Studio ->', JSON.stringify(G.nameVariants(id('Maya Yoga Studio',null))));
console.log('       The Studio       ->', JSON.stringify(G.nameVariants(id('The Studio',null))));
t('drops generic words to form a core', G.nameVariants(id('Maya Yoga Studio',null)).includes('Maya Yoga'));
t('keeps full name too', G.nameVariants(id('Maya Yoga Studio',null)).includes('Maya Yoga Studio'));

console.log('\n--- detectMention: TRUE positives ---');
t('exact name', G.detectMention('I recommend Maya Yoga Studio downtown.', id('Maya Yoga Studio','mayayoga.com')).mentioned);
t('partial core name', G.detectMention('Try Maya Yoga, they are great.', id('Maya Yoga Studio','mayayoga.com')).mentioned);
t('case insensitive', G.detectMention('try MAYA YOGA STUDIO', id('Maya Yoga Studio',null)).mentioned);
t('domain only', G.detectMention('See https://mayayoga.com for details', id('Maya Yoga Studio','mayayoga.com')).mentioned);
t('name with trailing punctuation', G.detectMention('Options: Maya Yoga Studio, CorePower.', id('Maya Yoga Studio',null)).mentioned);

console.log('\n--- detectMention: FALSE positives must NOT fire ---');
t('generic word alone does not match', !G.detectMention('A great studio in town.', id('Maya Yoga Studio',null)).mentioned);
t('substring inside larger word does not match', !G.detectMention('Mayahuel Cantina is nearby.', id('Maya','maya.com')).mentioned);
t('different business not matched', !G.detectMention('CorePower Yoga and YogaSix.', id('Maya Yoga Studio','mayayoga.com')).mentioned);
t('empty text', !G.detectMention('', id('Maya Yoga Studio','x.com')).mentioned);

console.log('\n--- detectMention: matchedOn reporting ---');
const m=G.detectMention('Maya Yoga Studio at mayayoga.com', id('Maya Yoga Studio','mayayoga.com'));
t('reports both name and domain', m.matchedOn.includes('name')&&m.matchedOn.includes('domain'));

console.log('\n--- scoreScan: failed cells MUST NOT count as "not mentioned" ---');
const mk=(engine,prompt,o={})=>({engine,prompt,mentioned:false,matchedOn:[],snippet:'',citations:[],...o});
const engines=['openai','gemini','perplexity','claude','dataforseo'];

// 4 answered (2 mentions) + 4 errored. Correct = 50%, NOT 25%.
let cells=[
  mk('openai','p1',{mentioned:true}), mk('openai','p2',{mentioned:true}),
  mk('gemini','p1'), mk('gemini','p2'),
  mk('claude','p1',{error:'boom'}), mk('claude','p2',{error:'boom'}),
  mk('perplexity','p1',{skipped:true,error:'no key'}), mk('perplexity','p2',{skipped:true,error:'no key'}),
];
let s=G.scoreScan(cells,engines);
t('score is 50 not 25 (errors excluded)', s.score===50);
t('answered counts only usable cells', s.answered===4);
t('mentions correct', s.mentions===2);
t('enginesAnswered excludes failed engines', s.enginesAnswered===2);
t('band moderate', s.band==='moderate');

console.log('\n--- scoreScan: insufficient sample guard ---');
s=G.scoreScan([mk('openai','p1'),mk('openai','p2')],engines);
t('2 answered -> insufficient, not 0%', s.band==='insufficient' && s.score===0);
s=G.scoreScan([mk('openai','p1'),mk('openai','p2'),mk('openai','p3')],engines);
t('3 answered and none mentioned -> absent (a real 0)', s.band==='absent');

console.log('\n--- scoreScan: all engines down ---');
s=G.scoreScan(engines.map(e=>mk(e,'p1',{skipped:true,error:'no key'})),engines);
t('all skipped -> insufficient, score 0, answered 0', s.band==='insufficient'&&s.answered===0);

console.log('\n--- scoreScan: perfect score ---');
s=G.scoreScan(['a','b','c','d'].map((p,i)=>mk('openai',p,{mentioned:true})),engines);
t('100 -> strong', s.score===100 && s.band==='strong');

console.log('\n--- summariseEngines ---');
const sum=G.summariseEngines(cells,engines);
const claude=sum.find(x=>x.engine==='claude'), ppx=sum.find(x=>x.engine==='perplexity'), oa=sum.find(x=>x.engine==='openai');
t('errored engine rate is null not 0', claude.rate===null);
t('errored engine counted unavailable', claude.unavailable===2 && claude.answered===0);
t('skipped engine reported not configured', ppx.configured===false);
t('errored-but-configured engine still configured=true', claude.configured===true);
t('openai rate 1.0', oa.rate===1);
t('engine with no cells at all -> rate null', sum.find(x=>x.engine==='dataforseo').rate===null);

console.log('\n--- BAND_COPY completeness ---');
t('every band has copy', ['strong','moderate','weak','absent','insufficient'].every(b=>G.BAND_COPY[b]?.title&&G.BAND_COPY[b]?.detail));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail?1:0);
