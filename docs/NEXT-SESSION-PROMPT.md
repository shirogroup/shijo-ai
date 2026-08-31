# Next session handoff — 2026-08-30

## State in one line

Commit `7dad555` is on `origin/main`, **its Vercel build failed**, production is still safely serving
the previous deploy `1302442`, and the one-file fix is sitting uncommitted in the working tree.

---

## 1. Where things actually stand

| Thing | State |
|---|---|
| `origin/main` | `7dad555` — "Fix paid funnel: Choose Plus goes to Stripe; billing shows Plus $79." |
| Vercel build of `7dad555` | ❌ **FAILED** — Suspense boundary at `/register` |
| Live production | ✅ Fine — last good deploy `1302442` |
| The paid-funnel fix | ⚠️ Merged but **not live** |
| Working tree | 1 modified file: `components/auth/RegisterForm.tsx` (the fix) |
| tsc | ✅ 0 errors |

### The failure

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/register"
Error occurred prerendering page "/register"
Export encountered an error on /register/page: /register, exiting the build.
```

Caused by adding `useSearchParams()` to `RegisterForm`. `/register` is statically prerendered, so
Next requires a Suspense boundary.

### The fix (already written, needs committing)

The boundary went **inside `components/auth/RegisterForm.tsx`**, not in `app/register/page.tsx`,
because that page is on the ads/freeze list. The file now exports `RegisterForm` as a `<Suspense>`
wrapper with a skeleton fallback, around a private `RegisterFormInner` that holds the hook. The
page's `import { RegisterForm }` and `<RegisterForm />` are unchanged.

Every other `useSearchParams()` consumer in the repo was audited — all six already have a boundary.
`/register` was the only gap.

---

## 2. First thing to do — run these in your own Git Bash

```bash
cd "/c/Users/AI Agent/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai"

# only if git complains about a lock:
rm -f .git/index.lock

git add components/auth/RegisterForm.tsx
git commit -m "Fix /register build: wrap useSearchParams in a Suspense boundary"
git push origin main
```

Then wait for Vercel to report **Ready**.

---

## 3. Then run these three tests in Chrome, and quote each result

1. **Logged out** → `/pricing` → **Choose Plus** → sign up with a throwaway email
   → expect Stripe Checkout showing **"SHIJO.AI Plus — $79.00 per month"**.
   **Do not pay.** Test card only if ever needed: `4242 4242 4242 4242`.
2. **Cancel** out of that checkout → expect `/dashboard/billing` showing the
   complete-your-upgrade banner **and** a Plus $79 card.
3. **Logged out** → `/pricing` → **Start free** → expect the dashboard, and **no Stripe**.

---

## 4. Standing constraints (do not violate)

- **Do not touch:** GTM, `next.config`, the Hero $29/$199 copy, the tool registry, Gemini,
  the $39 report build, ads landing-page prices, `app/register/page.tsx`.
- **GEO is additive.** Code and ads stay as visitors see them.
- **Never name the underlying AI vendor** in public marketing copy or product UI. Disclosure belongs
  only in the Privacy sub-processor list, `/security`, and `/ai-compliance`.
- **SHIJO.AI** is the customer-facing brand. **SHIRO Technologies LLC** appears only in legal contexts.
- **No live DB ALTER without showing the SQL and waiting.** Do not run `drizzle-kit generate`
  (proven destructive against this schema).
- **Never say "done" without proof.** Check `git status` and compare local HEAD to `origin/main`.
  State explicitly which applies: edited locally / committed / pushed and live.

---

## 5. Deferred, explicitly not started

- **$39 GEO Report route** — Checkout `mode:payment` + webhook branch + Resend delivery.
  ⚠️ **Verify `STRIPE_PRICE_GEO_REPORT` in Vercel Production first** — it may still hold the *test*
  price ID `price_1UAJl5…` against a *live* Stripe key. The same bug already bit
  `STRIPE_PRICE_PLUS_MONTHLY`. Sensitive values cannot be read back; the **"Added" vs "Updated"
  timestamp column** is the only evidence an edit landed. Env changes need a redeploy.
- **Gemini timeouts** — 3 of 4 asked prompts still time out at 45s.
- **Perplexity Sonar is deprecated, supported only until 2026-09-27** — needs a replacement.

---

## 6. Lesson from this session, worth carrying

`tsc --noEmit` and lint both passed, 157 unit tests passed, and the build still broke — because
**only `next build` runs the prerender/export step**, and it cannot run in the sandbox. Adding a
client hook to a component rendered by a static page must be hand-checked against the Suspense
requirement before pushing. tsc passing is not "verified".
