// Minimal assertion harness. No dependencies on purpose — this suite must run
// with nothing but node and the bundled source under test.
export function makeT() {
  const s = { pass: 0, fail: 0 };
  const t = (name, cond) => {
    if (cond) { s.pass++; console.log(`  ok   ${name}`); }
    else      { s.fail++; console.log(`  FAIL ${name}`); }
  };
  const eq = (name, got, want) => {
    const A = JSON.stringify(got), B = JSON.stringify(want);
    if (A === B) { s.pass++; console.log(`  ok   ${name}`); }
    else { s.fail++; console.log(`  FAIL ${name}\n         got:  ${A}\n         want: ${B}`); }
  };
  const hdr = (n) => console.log(`\n--- ${n} ---`);
  const done = () => {
    console.log(`\n=== ${s.pass} passed, ${s.fail} failed ===`);
    process.exit(s.fail ? 1 : 0);
  };
  return { t, eq, hdr, done, s };
}
/** JSON Response helper for mocked fetch. */
export const J = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
/** Standard Places payload so suites resolve the same identity. */
export const PLACES_OK = {
  places: [{
    id: 'places/ABC',
    displayName: { text: 'Maya Yoga Studio' },
    formattedAddress: '123 Main St, Dallas, TX',
    types: ['yoga_studio', 'gym', 'point_of_interest'],
    googleMapsUri: 'https://maps.google.com/?cid=1',
  }],
};
export const ALL_KEYS = ['ANTHROPIC_API_KEY','OPENAI_API_KEY','GEMINI_API_KEY',
  'PERPLEXITY_API_KEY','DATAFORSEO_LOGIN','DATAFORSEO_PASSWORD','GOOGLE_PLACES_API_KEY'];
