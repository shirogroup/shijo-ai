#!/usr/bin/env node
/**
 * SHIJO.AI — no-login smoke test suite
 * ------------------------------------
 * Exercises every public (unauthenticated) page and API endpoint against a
 * live deployment. Safe to run repeatedly against production — it does not
 * create accounts, log in, or touch any paid/billing flow. It DOES submit
 * one real contact-form ticket per run (clearly labeled as a test in the
 * subject/message), which will trigger real confirmation/notification
 * emails if RESEND_API_KEY is working correctly.
 *
 * Usage:
 *   node scripts/e2e-smoke-test.mjs
 *   BASE_URL=https://shijo.ai TEST_EMAIL=you@example.com node scripts/e2e-smoke-test.mjs
 *
 * Requires Node 18+ (built-in fetch). No dependencies.
 */

const BASE_URL = process.env.BASE_URL || 'https://shijo.ai';
const TEST_EMAIL = process.env.TEST_EMAIL || 'srikanth@shiroapps.com';

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, pass: true, detail });
    console.log(`✅ ${name}`);
  } catch (e) {
    results.push({ name, pass: false, detail: String(e?.message || e) });
    console.log(`❌ ${name} — ${String(e?.message || e)}`);
  }
}

async function getCaptcha() {
  const res = await fetch(`${BASE_URL}/api/contact/captcha`);
  const data = await res.json();
  const [a, b] = data.question.split(' + ').map(Number);
  return { token: data.token, answer: a + b };
}

async function main() {
  console.log(`\nRunning smoke test against ${BASE_URL}\n`);

  const pages200 = [
    '/', '/blog', '/terms', '/privacy', '/cookies', '/security',
    '/gdpr-compliance', '/ai-compliance', '/login', '/register',
    '/ai-marketing-tools', '/contact',
  ];
  for (const p of pages200) {
    await check(`GET ${p} => 200`, async () => {
      const res = await fetch(`${BASE_URL}${p}`);
      if (res.status !== 200) throw new Error(`status ${res.status}`);
      return res.status;
    });
  }

  // These are known, documented 404s (unlinked internally) — flag it here if
  // that ever changes, since it'd mean something started linking to them.
  const pages404 = ['/pricing', '/features', '/about'];
  for (const p of pages404) {
    await check(`GET ${p} => 404 (expected/documented — flag if this changes)`, async () => {
      const res = await fetch(`${BASE_URL}${p}`);
      if (res.status !== 404) throw new Error(`status ${res.status}, expected 404`);
      return res.status;
    });
  }

  await check('robots.txt has disallow rules', async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    const text = await res.text();
    if (!text.includes('Disallow: /dashboard/')) throw new Error('missing /dashboard/ disallow');
    if (!text.includes('Disallow: /admin/')) throw new Error('missing /admin/ disallow');
    return 'ok';
  });

  await check('sitemap.xml is valid', async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    const text = await res.text();
    if (!text.includes('<urlset')) throw new Error('not a valid sitemap');
    return 'ok';
  });

  await check('Homepage title has no fabricated "AI visibility tracking" claim', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    if (/visibility tracking|ChatGPT.{0,20}Claude.{0,20}Perplexity/i.test(title)) {
      throw new Error(`title still contains fabricated claim: "${title}"`);
    }
    return title;
  });

  await check('GET /api/auth/me unauthenticated => 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    if (res.status !== 401) throw new Error(`status ${res.status}, expected 401`);
    return res.status;
  });

  await check('Contact form valid submission => 200 (also triggers real emails)', async () => {
    const { token, answer } = await getCaptcha();
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Smoke Test',
        email: TEST_EMAIL,
        subject: `Automated smoke test — ${new Date().toISOString()}`,
        message: 'Automated end-to-end smoke test submission. Please ignore or mark resolved.',
        captchaToken: token,
        captchaAnswer: answer,
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(`status ${res.status}, body ${JSON.stringify(data)}`);
    return data;
  });

  await check('Contact form wrong CAPTCHA => 400', async () => {
    const { token } = await getCaptcha();
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', subject: 'test', message: 'test', captchaToken: token, captchaAnswer: 99999 }),
    });
    if (res.status !== 400) throw new Error(`status ${res.status}, expected 400`);
    return res.status;
  });

  await check('Contact form missing fields => 400', async () => {
    const { token, answer } = await getCaptcha();
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: '', subject: '', message: '', captchaToken: token, captchaAnswer: answer }),
    });
    if (res.status !== 400) throw new Error(`status ${res.status}, expected 400`);
    return res.status;
  });

  await check('Contact form invalid email format => 400', async () => {
    const { token, answer } = await getCaptcha();
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'not-an-email', subject: 'test', message: 'test', captchaToken: token, captchaAnswer: answer }),
    });
    if (res.status !== 400) throw new Error(`status ${res.status}, expected 400`);
    return res.status;
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`\n${passed}/${results.length} passed${failed ? `, ${failed} FAILED` : ''}.\n`);
  if (failed) process.exitCode = 1;

  /* ---------------------------------------------------------------------
   * MANUAL / LOGIN-REQUIRED TESTS — not run automatically.
   *
   * These require an actual account with a real password, which this
   * script deliberately does not create or submit on its own — fill in
   * TEST_EMAIL/TEST_PASSWORD for an account you've already created by hand
   * at /register, then uncomment the block below to exercise the
   * authenticated flows (export data, delete account, admin ticket panel).
   * Do this against a throwaway test account, not a real user.
   * ---------------------------------------------------------------------

  const TEST_PASSWORD = process.env.TEST_PASSWORD; // set this yourself, never hardcode
  await check('Login with test account', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    return res.headers.get('set-cookie'); // capture session cookie for subsequent calls
  });

  // ... then use the captured cookie to call /api/account/export,
  // /api/account/delete, /api/admin/tickets, etc.

  --------------------------------------------------------------------- */
}

main();
