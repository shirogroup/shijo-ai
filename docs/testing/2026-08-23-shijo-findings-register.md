# SHIJO.AI — Findings & Fix Register

**Opened** 2026-08-23 · **Source** code audit + live real-user test run against production
**Scenario** "Maya Reddy, yoga studio in Dallas, 6-week beginner course, $149, October"
**Method** `docs/testing/2026-08-23-real-user-audit-methodology.md`
**Test plan** `docs/testing/2026-08-23-shijo-ai-test-plan.md`
**Status key** OPEN · FIXED-LOCAL (written, not pushed) · **LIVE** (deployed and verified on production) · WONTFIX

**Deploys in this run**
| Commit | Contents |
|---|---|
| `c48058f` | 18 audit fixes: char counts, server-side validation, upgrade CTA, checkout allowlist, security headers, pricing accuracy |
| `8533c72` | D-21 / D-24 / D-25 + API cost tracking and `/admin/usage` |
| `7ff5366` | Admin layout; avg-cost calculation corrected over unpriced rows |

---

## ⚠️ Numbering note — read before using this register

**D-20, D-26, D-28 and D-29 have no surviving record.** They were assigned during the live run,
but their detail was lost when the working context rolled over and it is not recoverable from the
transcript, the commits, or the repo. They are recorded here as gaps rather than reconstructed
from memory. **Do not reuse those numbers**, and do not assume they were trivial — assume nothing
about them at all. Total findings assigned this run: **33**. Documented below: **29**.

---

## A. Defects — product & quality

| # | Finding | Evidence | Sev | Fix | Status |
|---|---|---|---|---|---|
| **D-1** | **Title-tag character counts wrong on every output.** SEO Meta Generator states a length for each title; all 5 overstated by 6–15 chars. Meta descriptions accurate to ±1 — titles specifically wrong. A 60-char limit is the entire reason the number is shown. | claimed 58/56/57/54/60 → actual **52/44/43/39/47**. Reproduced on a second run (claimed 58 → actual 45). | **S2** | Stop asking the model to count. `correctCharacterCounts()` recomputes from the real string after generation. | **LIVE** — re-tested on production: **10/10 exact** |
| **D-3** | **Required fields not enforced server-side.** `POST /api/generate` with `inputs:{}` returned 200, consumed a generation, billed real tokens. The `required:true` flags in the registry were honoured by the form only. | `{"toolId":"seo-meta-generator","inputs":{}}` → **200**, `remaining=0`, output began *"Since the page topic and target keyword are undefined…"* | **S2** | Validate required fields from the registry in the route; 400 with `missingFields[]`. | **LIVE** |
| **D-4** | **Tools invent factual claims the user never supplied.** Meta description asserted "**with certified instructors**"; another "Expert guidance, affordable pricing"; captions "Spots are filling up!". Maya supplied none of these. Scarcity puffery is arguable; **a credential claim is not**. | Run 1, SEO Meta Generator + Post Caption Generator | **S2** | `ACCURACY_GUARD` appended to every prompt — no invented credentials, certifications, awards, ratings, counts or scarcity; visible `[YOUR CREDENTIAL]` placeholders instead. | **LIVE** — verified across ~64,000 chars from all 12 tools, zero fabrications remaining |
| **D-5** | **The limit-reached upsell had nothing to click.** At the highest-intent moment in the product the box said "Upgrade now" and contained **zero** links or buttons. Generate stayed enabled so the user could keep failing. | 0 clickable elements in the error box; `Generate` still `enabled:true` | **S2** (revenue) | "See plans & upgrade" button inside the box, linking to `/dashboard/billing`. | **LIVE** |
| **D-25** | **Keyword Research presented estimates as measured search data.** Intent and competition ratings read like search-tool output; they were model inference from phrasing. A marketer reading "competition: low" reasonably assumes a source. | `lib/tools/prompts.ts` | **S2** | Forced opening disclaimer that intent/competition are estimates not measured data, pointer to a live-data keyword tool, and an outright prohibition on stating volume figures. | **LIVE** |
| **D-8** | **No input length cap.** Textarea fields went into the prompt unbounded. Output capped by `max_tokens`; input capped by nothing. | `app/api/generate/route.ts` | **S3** | `MAX_FIELD_CHARS = 20,000` per field, enforced server-side, 400 over the limit. | **LIVE** |
| **D-9** | **Usage counter goes stale in the UI.** Showed "1 of 3 left" while the server had recorded 3 of 3. Corrected only on reload. Affects anyone with two tabs open. | UI vs `/api/usage` (`used:3, remaining:0`) | S4 | `usageTick` bumped in `finally` — refetch after **every** attempt, not only successful ones. | **LIVE** |
| **D-10** | **Validation error doesn't clear.** "Please fill in: Page Topic, Target Keyword" stayed on screen after both fields were filled. | SEO Meta Generator | S4 | Error clears on any input change. | **LIVE** |
| **D-11** | **Comment/code drift.** `lib/tools/usage.ts` said "9 of the 12 tools run on Sonnet". Registry has **10** sonnet, 2 haiku. | `lib/tools/usage.ts` | S4 | Comment corrected. | **LIVE** |
| **D-23** | **Label prefixes dropped.** The `Title Tag:` / `Meta Description:` prefixes were lost from output labels during the D-1 rework. | SEO Meta Generator output | S4 | Restore the prefixes in `LENGTH_LABEL_GUARD`. | **OPEN** |

---

## B. Defects — security

| # | Finding | Evidence | Sev | Fix | Status |
|---|---|---|---|---|---|
| **D-2** | **Open redirect on login (CWE-601).** `?redirect=` passed straight to `window.location.href`. `/login?redirect=https://evil.example` sent a user who had just typed their password on the real login page to an attacker's site. | `components/auth/LoginForm.tsx:29-30` | **S2** | Same-origin paths only: must start with `/` and not `//`. **Auth-adjacent — changed only after explicit sign-off.** | **LIVE** |
| **D-6** | **Security headers absent.** Only `strict-transport-security` was sent. No framing protection ⇒ `/dashboard` was embeddable (clickjacking). | live header scan | **S3** | `headers()` in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. **CSP deliberately deferred** — the site loads GTM, gtag, Ahrefs and Stripe, so it must go out Report-Only first. | **LIVE** (CSP still outstanding) |
| **D-7** | **`/api/billing/checkout` had no priceId allowlist.** Accepted a client-supplied `priceId` *and* `mode` and forwarded both to Stripe. Sibling route `/api/stripe/create-checkout` did validate. | bogus priceId → **500** (Stripe rejected it, we didn't). bogus plan on the sibling → **400 "Invalid plan selected"**. | **S3** ↓ | Explicit 3-price allowlist + `mode` validation. **Deliberately not** `Object.values(STRIPE_PRICE_IDS)` — that also holds the paused `ENTERPRISE_*` prices and sandbox `CREDITS_*` ids, and allowlisting them would have silently re-enabled self-serve Enterprise. | **LIVE** |

> **D-7 severity correction, on the record.** This was initially called **S1** from code reading.
> A live scan of the deployed client bundle (16 JS chunks) found **zero Stripe price IDs exposed**,
> so it was never directly exploitable. Downgraded to **S3** and reported as a downgrade. "Not
> discoverable" is still not an access control, which is why it was fixed anyway.

### Untested — carried forward

| # | Finding | Why not tested |
|---|---|---|
| **D-12** | **Quota limit is check-then-act.** `checkToolAccess` reads the counter → model call → `recordToolUsage` writes. No lock or transaction between; concurrent requests should all pass the same check. | Needs parallel load, not a browser. Requires a transaction or atomic upsert to fix. |
| **D-13** | **Daily-counter insert race.** `recordToolUsage` does select-then-insert on `daily_limits`; the unique index `uniq_daily_limits` rejects the second concurrent insert, and the throw lands *after* the paid model call — the user loses a generation already billed. | Same as D-12. |

---

## C. Defects — billing, pricing & plan naming

| # | Finding | Evidence | Sev | Fix | Status |
|---|---|---|---|---|---|
| **D-32** | **An existing monthly customer cannot buy the annual plan — by any route.** All three paths verified closed on production. Underneath: **the billing interval is never stored** (`users` has `plan_tier`, no interval column), so the app cannot distinguish a monthly customer from an annual one. The 20% annual offer is unbuyable by exactly the people most likely to take it. | ① billing page annual toggle → inert "Current Plan" **text**, zero buttons, while displaying the *annual* price and calling it the customer's current plan (false — they're on monthly). ② `POST /api/stripe/create-checkout {plan:'pro',interval:'annual'}` → **400 "You are already on the pro plan"** (guard compares `planTier` only; monthly and annual share `'pro'`). ③ Stripe Billing Portal → **"Cancel subscription" only**, plan switching not enabled. | **S2** (revenue) | Two parts. **Stripe Dashboard (owner action):** Settings → Billing → Customer portal → enable "Customers can switch plans" and add the three prices, so Stripe handles proration. **Code:** billing card renders "Switch to annual — save 20%" → portal when plan matches but interval differs; relax the guard to compare *(plan, interval)*. **Do not** fix via a second Checkout session — that creates a duplicate subscription. | **OPEN** |
| **D-19** | **Promo-code field with no coupons behind it.** `allow_promotion_codes: true` rendered the field, accepted input, and rejected every code — at the exact moment the customer had their card out. Stripe has zero coupons on this account. | both checkout routes | **S3** (conversion) | `allow_promotion_codes: false` in **both** routes. Flip back the day a real coupon exists — tracked in `docs/product/FEATURE-BACKLOG.md`. | **LIVE** |
| **D-14** | **"Most Popular" badge on a plan with no customers.** Stripe showed zero subscriptions ever created — the badge was a claim about customers who did not exist. | `app/dashboard/billing/page.tsx` | **S3** | → **"Best Value"**. | **LIVE** |
| **D-17** | **Advertised annual discount was not clickable.** "or $278/year (save 20%)" was a `<p>`. The buyer was shown a discount and given no way to act on it. | same | **S3** (revenue) | Now a button that switches the card to annual. | **LIVE** — verified on production |
| **D-15** | **Plans with no annual price silently showed `/month` under an "Annual · Save 20%" header**, implying the monthly figure was the annual one. | same | **S3** | "Billed monthly — no annual option yet". | **LIVE** — verified on the Pro card |
| **D-16** | **Toggle label unreadable.** Inactive label at `gray-500` was too low-contrast; the control looked mislabelled. | same | S4 | → `gray-400`. | **LIVE** |
| **D-18** | **Dead price config on an unbuyable plan.** Enterprise carried real-looking numbers while being paused with no self-serve checkout. | same | S4 | `price: 0, annualPrice: undefined`; renders "Coming Soon". | **LIVE** |
| **D-21** | **Sidebar showed paying customers the wrong plan.** A ternary chain mapped internal `pro` → "Pro Plan" (customer-facing name is **Standard**) and had **no case for `growth` at all**, so $199/mo customers were shown **"Free Plan"**. | `components/dashboard/Sidebar.tsx` | **S2** | Use `PLAN_DISPLAY_NAME[userPlan]`. | **LIVE** — verified: sidebar reads "Standard Plan" |
| **D-33** | **Merchant name missing its dot on every Stripe surface.** Checkout header, portal title, "SHIJO AI partners with Stripe", "SHIJO AI Billing" all read **"SHIJO AI"**. The *product* line is correctly "SHIJO.AI Standard". Brand standard is **SHIJO.AI**. | live checkout + billing portal | S4 | Stripe Dashboard → Settings → Public business name. **No code change.** | **OPEN** — owner action |
| **D-22** | **Undecided:** should free-tier generations already spent count against the customer's first paid month? Currently ambiguous. | — | S4 | Product decision required, then enforce it in `usage.ts`. | **OPEN — needs a decision** |

---

## D. Defects — cost, observability & admin

| # | Finding | Evidence | Sev | Fix | Status |
|---|---|---|---|---|---|
| **D-27** | **API cost was unmeasurable.** `api_cost_usd` had been in the schema since it was written and was **never written to** — every row read `0.0000`. Only output tokens were retained, so real spend could not be reconstructed retroactively even in principle. An AI product's gross margin *is* its API bill. | `lib/tools/usage.ts`, `usage_logs` | **S2** (business) | `recordToolUsage` now takes both token counts, prices via `lib/ai/pricing.ts` at the rate in force at call time, and writes `api_cost_usd` + raw counts. Historical rows survive a rate change. | **LIVE** — verified: 378 in / 396 out recorded as **$0.0024**, matching hand calculation |
| **D-30** | **Admin pages had no navigation.** Five admin pages existed with no way to move between them. | `/admin/*` | S4 | `app/admin/layout.tsx` with a nav bar across all five + "← Back to app". | **LIVE** — verified on production |
| **D-31** | **The new admin spend page averaged wrong by 24×.** Divided total cost by *all* generations including 33 that predated cost tracking and carried no price. Reported **$0.0001** against a real **$0.0024**. *A defect introduced by this run's own fix.* | `/admin/usage` | **S3** | Average priced rows only; label it "(priced only)"; amber banner naming the number of unpriced rows and the date tracking began. | **LIVE** — verified: "Avg cost / generation (priced only) — $0.0024" |
| **D-24** | **The D-1 character-count fix broke a different tool.** The corrector counted "the next non-empty line", which on Ad Headline A/B is the *rationale*, so a 43-character headline was labelled "(130 characters)". *A defect introduced by this run's own fix.* | Ad Headline A/B | **S3** | Scoped the whole mechanism to `COUNTED_TOOLS = {seo-meta-generator}` — the only tool that states counts. | **LIVE** |

---

## E. Advertising accuracy (Google Ads — live assets)

Not code, but published claims. Full detail in `SHIJO_AI_KB.md` §51.6–51.7.

| Live ad claim | Reality in code | Action | Status |
|---|---|---|---|
| "Get Started With 5 Free Tools" | `registry.ts` has exactly **2** `minPlan:'free'` entries | → "Start With 2 Free AI Tools" | **LIVE** |
| "AI Search Visibility Tracking" | that page renders "coming soon" with a **waitlist** button | → "AI Overview Optimizer Tool" | **LIVE** |
| "…With Our Enterprise-Ready AI Platform" | Enterprise paused, unbuyable | → "Scale Your SEO Operations With 12 AI Tools In One Platform" | **LIVE** |
| Pricing sitelink advertising Enterprise | same | removed | **LIVE** |
| Description: "Start your free trial." | SHIJO has a **free tier** (2 tools, forever), not a time-limited trial | flagged, not changed | **OPEN** |

**Coverage gap, stated:** callouts, the lead form, and the account-level call asset were **not**
audited.

---

## F. Verified working

| Area | Result |
|---|---|
| New account defaults | `free`, 2 tools of 12, 3 gens/day — all correct |
| Free tier forced to Haiku | shown as "Fast AI", `meta.model = haiku` |
| Quota decrement | 3 → 2 → 1 → 0; UI and `/api/usage` agree |
| 4th generation | 403 "Daily limit reached" |
| Paid tool on free plan | 403 "Upgrade to Standard ($29/mo)" — correct customer-facing name |
| Reset time | `resetAt: 2026-08-24T00:00:00Z` — UTC midnight, matches code |
| Unauthenticated API | 401 on all 6 routes tested |
| Route protection | `/dashboard/*` and `/admin/*` redirect to `/login` |
| robots.txt | disallows `/api`, `/admin`, `/dashboard` |
| Sitemap | 13 URLs, all 200, all `www`, no gated pages leaked |
| 404 | real 404 status on unknown paths |
| "2 tools free" claim | consistent across the whole site (6 mentions, none saying 5) |
| Client-side validation | names the missing fields specifically |
| No Stripe price IDs in client | 16 JS chunks scanned, zero found |
| **Annual price in Stripe** | live checkout renders **"$278.00 per year"**, "$23.17 / month billed annually", "SHIJO.AI Standard", "All 12 AI marketing tools, 200 generations/month, advanced AI models". $348 → $278 = **20.1%**, so "Save 20%" is honest |
| **Stripe Link / pay-by-phone** | Working. "Confirm it's you → code sent to (•••) ••• ••92 → Send code to email instead → Pay without Link" all present. It did **not** appear on the customer's *first* purchase because they weren't enrolled in Link yet — Stripe saved the card to Link **during** that purchase. Both checkout routes pass the same `customer` id. **Not a defect.** |
| Password reset | "send reset link" flow confirmed working by the account owner |

---

## G. Output quality — scenario scoring

Scale: **Ship as-is · Light edit · Substantial rewrite · Unusable**

| Tool | Verdict (run 1, pre-fix) | Note |
|---|---|---|
| Post Caption Generator | **Ship as-is** | Right price, right month, right brand, tone matched the brief. |
| SEO Meta Generator | **Substantial rewrite** | Copy read well, but every character count was wrong and it invented "certified instructors". Both facts had to be re-checked by hand — which is the work the tool was sold to remove. |
| Keyword Research | **Light edit** | Useful clusters, but estimates were presented as measured data (D-25). |
| Remaining 9 tools | see test plan | Re-run post-fix across all 12 produced ~64,000 chars with zero fabricated credentials. |

---

## H. Unit economics — measured for the first time

| Plan | Internal key | Price | Limit | Max API cost at limit | Gross margin |
|---|---|---|---|---|---|
| Free | `free` | $0 | 3/day, 2 tools, Haiku forced | — | — |
| **Standard** | `pro` | $29/mo | 200/mo, 12 tools | **$7.34** | **~75%** |
| **Pro** | `growth` | $199/mo | 1,500/mo, 12 tools | **$55.05** | **~72%** |
| Enterprise | `enterprise` | paused | fair-use cap 3,000 | — | — |

Measured sample: 378 input / 396 output tokens = **$0.0024**.

> **Naming trap — keep this visible.** Internal `pro` is customer-facing **"Standard"**; internal
> `growth` is customer-facing **"Pro"**. `PLAN_DISPLAY_NAME` in `lib/stripe/products.ts` is the
> only correct translation. D-21 was caused by hand-rolling it.

---

## I. Still open — ranked

| # | Finding | Sev | Owner |
|---|---|---|---|
| **D-32** | Annual plan unbuyable for existing monthly customers | **S2** | Stripe portal config (owner) + code |
| **D-12/13** | Quota check-then-act and daily-counter insert races | **S3** | code — needs transaction/atomic upsert + load test |
| **D-6** | CSP still not shipped (Report-Only first) | **S3** | code |
| **D-33** | "SHIJO AI" missing its dot on all Stripe surfaces | S4 | Stripe Dashboard (owner) |
| **D-23** | `Title Tag:` / `Meta Description:` label prefixes | S4 | code |
| **D-22** | Do free-tier generations count against the first paid month? | S4 | **product decision** |
| — | Ad description says "free trial"; SHIJO has a free **tier** | S4 | Google Ads (owner) |
| — | Callouts, lead form and call asset never audited | — | Google Ads (owner) |
| — | Sandbox `CREDITS_*` price ids still sit in the live `STRIPE_PRICE_IDS` constant | S4 | code |

---

## J. Defects this run introduced and then caught

Kept deliberately, because the count matters: **three of the findings above (D-24, D-31, and a
broken import in `Sidebar.tsx` caught by typecheck) were caused by fixes made earlier in the same
run.** An audit that does not re-audit its own patches ships a smaller number of bigger bugs.
