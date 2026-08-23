# SHIJO.AI — Findings & Fix Register

**Opened** 2026-08-23 · **Source** code audit + live test run against production
**Scenario** "Maya Reddy, yoga studio in Dallas, 6-week beginner course, $149, October"
**Status key** OPEN · FIXED-LOCAL (written, not pushed) · LIVE (deployed) · WONTFIX

---

## A. Defects

| # | Finding | Evidence | Sev | Fix | Status |
|---|---|---|---|---|---|
| **D-1** | **Title-tag character counts are wrong on every output.** SEO Meta Generator states a length for each title; all 5 were overstated by 6–15 chars. Meta descriptions are accurate to ±1 — titles specifically are wrong. | claimed 58/56/57/54/60 → actual **52/44/43/39/47**. Reproduced on a second run (claimed 58 → actual 45). | **S2** | Stop asking the model to count. Compute `title.length` in code after generation, display the real number, and regenerate/flag anything >60. | OPEN |
| **D-2** | **Open redirect on login.** `?redirect=` was passed straight to `window.location.href`. `\|/login?redirect=https://evil.example` sent a user who had just typed their password on the real login page to an attacker's site (CWE-601). | `components/auth/LoginForm.tsx:29-30` | **S2** | Allow only same-origin paths: must start with `/` and not `//`. | **FIXED-LOCAL** |
| **D-3** | **Required fields are not enforced server-side.** `POST /api/generate` with `inputs:{}` returns 200, consumes a generation, and bills real tokens. The `required:true` flags in the registry are honoured by the form only. | `{"toolId":"seo-meta-generator","inputs":{}}` → **200**, `remaining=0`, output began *"Since the page topic and target keyword are undefined…"* | **S2** | Validate required fields from the registry inside the route before calling the model; return 400. | OPEN |
| **D-4** | **Tools invent factual claims the user never supplied.** Meta description asserted "**with certified instructors**"; another said "Expert guidance, affordable pricing"; captions said "Spots are filling up!". Maya supplied none of these. | Run 1, SEO Meta Generator + Post Caption Generator | **S2** | Add a prompt constraint: never assert credentials, certifications, awards, ratings, counts or scarcity not present in the user's input. Scarcity puffery is arguably fine; **credential claims are not**. | OPEN |
| **D-5** | **The limit-reached upsell has nothing to click.** At the highest-intent moment in the product — user wants another generation and can't have one — the box says "Upgrade now" and contains **zero** links or buttons. The Generate button stays enabled so the user can keep failing. | 0 clickable elements inside the error box; `Generate` still `enabled:true` | **S2** (conversion) | Put a primary "Upgrade to Standard — $29/mo" button inside that box, linking to `/dashboard/billing`. Disable or relabel the Generate button at 0 remaining. | OPEN |
| **D-6** | **Security headers absent.** Only `strict-transport-security` was being sent. No framing protection ⇒ `/dashboard` was embeddable (clickjacking). | live header scan | **S3** | `headers()` in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. CSP deliberately deferred to Report-Only first — the site loads GTM, gtag, Ahrefs and Stripe. | **FIXED-LOCAL** |
| **D-7** | **`/api/billing/checkout` has no priceId allowlist.** Accepts a client-supplied `priceId` *and* `mode` and forwards both to Stripe. The sibling route `/api/stripe/create-checkout` validates `plan` against a server-side list. | bogus priceId → **500** (Stripe rejected it, our API didn't). bogus plan on the other route → **400 "Invalid plan selected"**. | **S3** | Allowlist price IDs server-side, or retire the route in favour of the validated one. | OPEN |
| **D-8** | **No input length cap.** Textarea fields (e.g. AI Overview Optimizer "Page URL or Content") go into the prompt unbounded. Output is capped by `max_tokens`; input is not capped at all. | `app/api/generate/route.ts` | **S3** | Cap per-field length server-side; reject with 400 over the limit. | OPEN |
| **D-9** | **Usage counter goes stale in the UI.** Counter showed "1 of 3 left" while the server had already recorded 3 of 3. Only corrects on reload. Affects anyone with two tabs open. | UI vs `/api/usage` (`used:3, remaining:0`) | S4 | Refresh usage after each generation and on window focus. | OPEN |
| **D-10** | **Validation error doesn't clear.** "Please fill in: Page Topic, Target Keyword" stays on screen after both fields are filled; only clears on submit. | SEO Meta Generator | S4 | Clear the error on field change. | OPEN |
| **D-11** | **Comment/code drift.** `lib/tools/usage.ts` says "9 of the 12 tools run on Sonnet". The registry has **10** sonnet, 2 haiku. | `lib/tools/usage.ts` | S4 | Correct the comment. | OPEN |

### Untested / carried forward

| # | Finding | Why not yet tested |
|---|---|---|
| **D-12** | **Quota limit is check-then-act.** `checkToolAccess` reads the counter → model call → `recordToolUsage` writes. No lock or transaction between. Concurrent requests should all pass the same check. | Needs available quota to test. Free quota exhausted; will test against the **monthly** limit on the paid plan. |
| **D-13** | **Daily-counter insert race.** `recordToolUsage` does select-then-insert on `daily_limits`; the unique index `uniq_daily_limits` will reject the second concurrent insert, and the throw lands *after* the paid model call — user loses a generation already billed. | Same as D-12. |

---

## B. Verified working

| Area | Result |
|---|---|
| New account defaults | `free`, 2 tools of 12, 3 gens/day — all correct |
| Free tier forced to Haiku | shown as "Fast AI", `meta.model = haiku` |
| Quota decrement | 3 → 2 → 1 → 0, UI and `/api/usage` agree after reload |
| 4th generation | 403 "Daily limit reached" |
| Paid tool on free plan | 403 "Upgrade to Standard ($29/mo)" — correct customer-facing plan name |
| Reset time | `resetAt: 2026-08-24T00:00:00Z` — UTC midnight, matches the code |
| Unauthenticated API | 401 on all 6 routes tested |
| Route protection | `/dashboard/*` and `/admin/*` redirect to `/login` |
| robots.txt | disallows `/api`, `/admin`, `/dashboard` |
| Sitemap | 13 URLs, all 200, all `www`, no gated pages leaked |
| 404 | real 404 status on unknown paths |
| "2 tools free" claim | consistent across the whole site (6 mentions, none saying 5) |
| Client-side validation | names the missing fields specifically |
| No Stripe price IDs in client | 16 JS chunks scanned, zero found |

---

## C. Output quality — scenario scoring

Scale: **Ship as-is · Light edit · Substantial rewrite · Unusable**

| Tool | Verdict | Note |
|---|---|---|
| Post Caption Generator | **Ship as-is** | Right price, right month, right brand, tone matched the brief. Genuinely good. |
| SEO Meta Generator | **Substantial rewrite** | Copy reads well, but every character count is wrong and it invented "certified instructors". Both facts must be re-checked by hand — which is the work the tool was supposed to remove. |
| *remaining 10 tools* | pending upgrade | |

---

## D. Fix order (recommended)

1. **D-1** title character counts — highest damage-to-effort ratio; it breaks the tool's core promise and the fix needs no AI
2. **D-5** limit-reached upsell — pure revenue, one button
3. **D-3** server-side required fields — stops burning quota and tokens on junk
4. **D-4** invented credentials — reputational, prompt-level fix
5. **D-2 / D-6** — already written locally, just need pushing
6. **D-7, D-8** — small hardening
7. **D-9, D-10, D-11** — polish

---

## E. Fix batch 1 — written 2026-08-23, awaiting push

All eighteen patchable findings. Two race conditions (D-12/13) deliberately deferred —
they need a transaction/atomic upsert and cannot be verified without quota.

| # | Fix | File(s) |
|---|---|---|
| D-1 | Character counts recomputed from the real string after generation. New `correctCharacterCounts()` rewrites every `(N characters)` claim. Verified against the actual failing output: 58→**52**, 56→**44**, 58→**46**. | `lib/tools/output.ts` (new), `app/api/generate/route.ts` |
| D-2 | Login redirect restricted to same-origin paths (`/` but not `//`). | `components/auth/LoginForm.tsx` |
| D-3 | Required fields validated server-side from the registry; returns 400 with the field labels. | `app/api/generate/route.ts` |
| D-4 | `ACCURACY_GUARD` appended to every prompt: no invented credentials, certifications, awards, ratings, counts or scarcity; placeholders instead. | `lib/tools/output.ts`, `app/api/generate/route.ts` |
| D-5 | "See plans & upgrade" button added inside the limit-reached box. | `components/dashboard/ToolPage.tsx` |
| D-6 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. CSP deferred to Report-Only first (site loads GTM, gtag, Ahrefs, Stripe). | `next.config.ts` |
| D-7 | Price-ID allowlist + `mode` validation. **Deliberately not** `Object.values(STRIPE_PRICE_IDS)` — that would have re-enabled the paused Enterprise prices and exposed the sandbox credit ids. Mirrors `VALID_PLANS`: the three purchasable prices only. | `app/api/billing/checkout/route.ts` |
| D-8 | `MAX_FIELD_CHARS = 20,000` per field, enforced server-side. | `app/api/generate/route.ts` |
| D-9 | Usage refetched after **every** attempt, not only successful ones (`usageTick`). | `components/dashboard/ToolPage.tsx` |
| D-10 | Validation error clears as soon as any input changes. | `components/dashboard/ToolPage.tsx` |
| D-11 | Comment corrected: 10 of 12 tools are Sonnet, not 9. | `lib/tools/usage.ts` |
| D-14 | "Most Popular" → **"Best Value"**. Stripe shows zero subscriptions ever created, so popularity was a claim about customers who do not exist. | `app/dashboard/billing/page.tsx` |
| D-15 | Plans with no annual price now say "Billed monthly — no annual option yet" instead of silently showing `/month` under an "Annual · Save 20%" header. | `app/dashboard/billing/page.tsx` |
| D-16 | Inactive toggle label `gray-500` → `gray-400`; it was too low-contrast to read, making the control look mislabelled. | `app/dashboard/billing/page.tsx` |
| D-17 | "or $278/year (save 20%)" is now a button that switches the card to annual. It was a `<p>` — an advertised discount the buyer could not act on. | `app/dashboard/billing/page.tsx` |
| D-18 | Enterprise price config zeroed — dead numbers for an unbuyable plan. | `app/dashboard/billing/page.tsx` |
| D-19 | `allow_promotion_codes: false` in **both** checkout routes. Stripe has no coupons, so the field could only ever reject people mid-payment. | both checkout routes |

**Verification:** all nine changed/created files typecheck clean (`tsc --noEmit --noResolve`);
only `@types/node` / React-namespace artefacts of the isolated check remain.
`correctCharacterCounts()` unit-tested against the real failing output, including
bullet-prefixed and backtick-wrapped title lines, with prose left untouched.

**Not fixed — needs a decision or more work:**
- D-12 / D-13 — quota check-then-act and the daily-counter insert race.
- Sandbox `CREDITS_*` price ids still sit in the live `STRIPE_PRICE_IDS` constant (commented as such).
