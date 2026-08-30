import * as G from '../.build/pure.mjs';
let pass=0, fail=0;
const eq=(n,a,b)=>{const A=JSON.stringify(a),B=JSON.stringify(b);
  if(A===B){pass++;console.log(`  ok   ${n}`);}else{fail++;console.log(`  FAIL ${n}\n         got: ${A}\n         want:${B}`);}};
const t=(n,c)=>{if(c){pass++;console.log(`  ok   ${n}`);}else{fail++;console.log(`  FAIL ${n}`);}};

console.log('\n--- pluralise ---');
for (const [i,o] of [['business','businesses'],['pharmacy','pharmacies'],['travel agency','travel agencies'],
  ['yoga studio','yoga studios'],['spa','spas'],['church','churches'],['box','boxes'],['bakery','bakeries'],
  ['attorney','attorneys'],['day','days']]) eq(`pluralise(${i})`, G.pluralise(i), o);

console.log('\n--- categoryNoun (generic types must be skipped) ---');
eq('yoga_studio wins over establishment', G.categoryNoun(['establishment','point_of_interest','yoga_studio']), 'yoga studio');
eq('all-generic -> business', G.categoryNoun(['establishment','point_of_interest','store']), 'business');
eq('empty -> business', G.categoryNoun([]), 'business');
eq('unmapped specific de-snaked', G.categoryNoun(['establishment','axe_throwing_venue']), 'axe throwing venue');

console.log('\n--- buildLocalPrompts ---');
const id={placeId:'p',displayName:'Maya Yoga Studio',formattedAddress:null,types:['yoga_studio'],googleMapsUri:null,domain:'mayayoga.com',city:'Dallas',resolved:true};
const P=G.buildLocalPrompts(id);
t('returns exactly MAX_PROMPTS (8)', P.length===8);
t('NO prompt contains the business name', !P.some(p=>/maya/i.test(p)));
t('NO prompt contains the domain', !P.some(p=>/mayayoga/i.test(p)));
t('every prompt mentions the city', P.every(p=>/Dallas/.test(p)));
t('no double-s pluralisation', !P.some(p=>/studioss|businesss/i.test(p)));
t('all unique', new Set(P).size===P.length);
console.log(P.map(p=>'       · '+p).join('\n'));

console.log('\n--- buildLocalPrompts: unresolved identity (worst case) ---');
const id2={...id,displayName:'Acme',types:[],domain:null,city:'',resolved:false};
const P2=G.buildLocalPrompts(id2);
t('still produces 8 prompts with no city/types', P2.length===8);
t('no "businesss" typo', !P2.some(p=>/businesss/.test(p)));
t('handles empty city gracefully', !P2.some(p=>/ in \?|in \./.test(p)));
console.log(P2.map(p=>'       · '+p).join('\n'));

console.log('\n--- normalisePrompts ---');
eq('non-array -> []', G.normalisePrompts('nope'), []);
eq('trims + drops empties', G.normalisePrompts(['  a  ','','   ']), ['a']);
eq('dedupes case-insensitively', G.normalisePrompts(['Best gym','best gym']), ['Best gym']);
t('caps at 8', G.normalisePrompts(Array.from({length:50},(_,i)=>'p'+i)).length===8);
t('drops >300 char prompt', G.normalisePrompts(['x'.repeat(301)]).length===0);
t('keeps 300 char prompt', G.normalisePrompts(['x'.repeat(300)]).length===1);
t('ignores non-strings', G.normalisePrompts([1,null,{},'ok']).length===1);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail?1:0);
