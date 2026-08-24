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
| `3582d5d` | Methodology doc, public case study, register through D-33, KB §52 (docs only) |
| `52cc9bf` | **D-34 / D-35** — brand default neutralised; count-label guards de-conflicted + label insertion |

---

## ⚠️ Numbering note — read before using this register

**D-20, D-26, D-28 and D-29 have no surviving record.** They were assigned during the live run,
but their detail was lost when the working context rolled over and it is not recoverable from the
transcript, the commits, or the repo. They are recorded here as gaps rather than reconstructed
from memory. **Do not reuse those numbers**, and do not assume they were trivial — assume nothing
about them at all. Total findings assigned: **38** — D-34/D-35 from the retest (§H2), D-36/D-37/D-38
from the full regression sweep (§H4). Documented below: **34**.

---

## A. Defects — product & quality

| # | Finding | Evidence | Sev | Fix | Status |
|---|---|---|---|---|---|
| **D-1** | **Title-tag character counts wrong on every output.** SEO Meta Generator states a length for each title; all 5 overstated by 6–15 chars. Meta descriptions accurate to ±1 — titles specifically wrong. A 60-char limit is the entire reason the number is shown. | claimed 58/56/57/54/60 → actual **52/44/43/39/47**. Reproduced on a second run (claimed 58 → actual 45). | **S2** | Stop asking the model to count. `correctCharacterCounts()` recomputes from the real string after generation. | **LIVE** — re-tested on production: **10/10 exact** |
| **D-3** | **Required fields not enforced server-side.** `POST /api/generate` with `inputs:{}` returned 200, consumed a generation, billed real tokens. The `required:true` flags in the registry were honoured by the form only. | `{"toolId":"seo-meta-generator","inputs":{}}` → **200**, `remaining=0`, output began *"Since the page topic and target keyword are undefined…"* | **S2** | Validate required fields from the registry in the route; 400 with `missingFields[]`. | **LIVE** |
| **D-4** | **Tools invent factual claims the user never supplied.** Meta description asserted "**with certified instructors**"; another "Expert guidance, affordable pricing"; captions "Spots are filling up!". Maya supplied none of these. Scarcity puffery is arguable; **a credential claim is not**. | Run 1, SEO Meta Generator + Post Caption Generator | **S2** | `ACCURACY_GUARD` appended to every prompt — no invented credentials, certifications, awards, ratings, counts or scarcity; visible `[YOUR CREDENTIAL]` placeholders instead. | **LIVE** — verified across ~64,000 chars from all 12 tools, zero fabrications remaining |
| **D-5** | **The limit-reached upsell had nothing to click.** At the highest-intent moment in the product the box said "Upgrade now" and contained **zero** links or buttons. Generate stayed enabled so the user could keep failing. | 0 clickable elements in the error box; `Generate` still `enabled:true` | **S2** (revenue) | CTA inside the box → `/dashboard/billing`; **and** disable Generate at 0 remaining. | ⚠️ **PARTIALLY LIVE** — CTA shipped and verified (§H5); **Generate is still enabled** (`disabled={loading}` only). Tracked as **D-5b**. |
| **D-25** | **Keyword Research presented estimates as measured search data.** Intent and competition ratings read like search-tool output; they were model inference from phrasing. A marketer reading "competition: low" reasonably assumes a source. | `lib/tools/prompts.ts` | **S2** | Forced opening disclaimer that intent/competition are estimates not measured data, pointer to a live-data keyword tool, and an outright prohibition on stating volume figures. | **LIVE** |
| **D-8** | **No input length cap.** Textarea fields went into the prompt unbounded. Output capped by `max_tokens`; input capped by nothing. | `app/api/generate/route.ts` | **S3** | `MAX_FIELD_CHARS = 20,000` per field, enforced server-side, 400 over the limit. | **LIVE** |
| **D-9** | **Usage counter goes stale in the UI.** Showed "1 of 3 left" while the server had recorded 3 of 3. Corrected only on reload. Affects anyone with two tabs open. | UI vs `/api/usage` (`used:3, remaining:0`) | S4 | `usageTick` bumped in `finally` — refetch after **every** attempt, not only successful ones. | **LIVE** |
| **D-10** | **Validation error doesn't clear.** "Please fill in: Page Topic, Target Keyword" stayed on screen after both fields were filled. | SEO Meta Generator | S4 | Error clears on any input change. | **LIVE** |
| **D-11** | **Comment/code drift.** `lib/tools/usage.ts` said "9 of the 12 tools run on Sonnet". Registry has **10** sonnet, 2 haiku. | `lib/tools/usage.ts` | S4 | Comment corrected. | **LIVE** |
| **D-23** | **Label prefixes dropped.** The `Title Tag:` / `Meta Description:` prefixes were lost from output labels during the D-1 rework. | SEO Meta Generator output | S4 | Restore the prefixes in `LENGTH_LABEL_GUARD`. | **LIVE** — verified in §H3: `Title Tag (49 characters):` |

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
| ~~No Stripe price IDs in client~~ | ❌ **RETRACTED — this claim was false.** A complete chunk enumeration found **8** price IDs in `layout-*.js`. See §H5 / D-39. |
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

## H2. RETEST — 2026-08-23, second pass against production (post-`3582d5d`)

Re-ran the regression suite after all fix batches were marked green. **Two new defects found, both
in code we had already "verified".**

### Still holding ✅

| Check | Result |
|---|---|
| D-3 required fields | `{inputs:{}}` → **400** `"Please fill in: Page Topic, Target Keyword"` + `missingFields[]`. Same on `keyword-research`. |
| D-8 length cap | 25,000-char field → **400** `"Too long (limit 20,000 characters): Page Topic"` |
| D-25 estimate disclaimer | Present verbatim at the top of Keyword Research output |
| D-4 fabrications | 0 invented credentials / awards / ratings across 5 fresh generations in 5 verticals |
| D-24 count scoping | Ad Headline A/B stated **no** character counts — correctly out of scope |
| D-27 cost tracking | 42 generations, 32 priced, **$0.0535** total. Arithmetic spot-checked: keyword-research 395 in / 1,559 out on the premium tier = `395/1e6×3 + 1559/1e6×15` = **$0.02457** ✓ matches the recorded $0.0246 |

### Unchanged, still open

| Check | Result |
|---|---|
| D-32 portal half | Billing portal **still offers "Cancel subscription" only.** Plan switching not yet enabled in Stripe. |
| D-33 brand name | **Still "SHIJO AI"** on portal title, header and "SHIJO AI partners with Stripe". |

### 🔴 D-34 (NEW, S2) — our own brand name is hardcoded into customer SEO copy

`lib/tools/prompts.ts:66` — `Brand name: ${i.brand || 'Shijo.ai'}`

`brand` is an **optional** field on the SEO Meta Generator form. When the user leaves it blank —
the common case — the prompt tells the model the customer's brand is **Shijo.ai**, and the model
duly writes it into the title tags and meta descriptions the customer will paste onto their own
site.

**Reproduction: 5 of 5 runs, 35 total occurrences, 5 unrelated verticals.**

| Run | Vertical | "Shijo" occurrences |
|---|---|---|
| 1 | beginner yoga, Dallas | 5 |
| 2 | handmade leather wallets | 7 |
| 3 | emergency plumbing, Austin | 7 |
| 4 | vegan meal-prep delivery | 9 |
| 5 | small-business bookkeeping | 7 |

Verbatim: *"Start your yoga journey with **Shijo.ai's** 6-week beginner course in Dallas this
October."* · *"Handmade Leather Wallets for Men | Free Shipping by **Shijo.ai**"* — the second one
is in the **title tag**.

**This is not a model fabrication — it is our own template.** Every other brand default in the same
file degrades neutrally: `i.brand || 'not specified'` (L91), `i.brand || 'the business'` (L176),
`i.brand || 'the newsletter'` (L192). Exactly one names our product, and it is the tool that writes
the text Google displays.

**Sev S2** — a false claim published into customer-facing copy, on every affected generation.

**Status: LIVE** — deployed in `52cc9bf` and re-verified across 6 runs, **0 occurrences**. See §H3.
`prompts.ts:66` → `${i.brand || 'not specified'}`, matching the other three defaults. All three
`'e.g. Shijo.ai'` placeholders in `registry.ts` → `'e.g. Acme Studio'`.

### 🟠 D-35 (NEW, S3) — the D-1 character-count fix only fires on ~60% of runs

`correctCharacterCounts()` **rewrites** an existing `(N characters)` label; it cannot **insert**
one. So the fix depends on the model emitting the label — and `ACCURACY_GUARD` explicitly tells it
not to:

> `ACCURACY_GUARD`: *"Do NOT state character counts, word counts or any other measurement of your own output."*
> `LENGTH_LABEL_GUARD`: *"Label each length as `Title Tag (N characters):` … keep the label."*

Both are appended to the same prompt for `seo-meta-generator`. They contradict, and the model
picks a side non-deterministically.

| Run | Vertical | Label emitted | Counts exact |
|---|---|---|---|
| 1 | yoga | **no** | — no length stated at all |
| 2 | leather wallets | yes | **10 / 10** |
| 3 | emergency plumbing | **no** | — no length stated at all |
| 4 | vegan meal prep | yes | **10 / 10** |
| 5 | bookkeeping | yes | **10 / 10** |

**When it fires it is perfect — 30/30 exact.** When it doesn't, the tool states no length at all
and the user is back to counting by hand, which is the original D-1 complaint.

**Status: LIVE** — deployed in `52cc9bf`. Re-verified: label emitted **6/6 runs, 60/60 counts exact**. See §H3. Both halves shipped:

1. The prohibition was moved out of `ACCURACY_GUARD` into a new
   `NO_SELF_MEASUREMENT_GUARD`, and `route.ts` now appends **either**
   `LENGTH_LABEL_GUARD` (counted tools) **or** `NO_SELF_MEASUREMENT_GUARD` (everything else) —
   never both. The prohibition is correct where nothing recomputes the number; it must not apply
   where something does.
2. `correctCharacterCounts()` can now **insert** a missing label, not only rewrite an existing one.
   A bare `Title Tag:` / `Meta Description:` heading is treated as a label with a missing number,
   so the outcome no longer depends on the model complying at all.

**Unit-tested** against the four real output shapes: bare labels (the failing run-1 shape),
existing-but-wrong counts (the original D-1 shape), bold + bulleted decoration, and a prose control
that must be left untouched. **4/4 pass, 0 failures** — then confirmed live at a rate, not a
single pass (§H3).

**Process lesson, recorded deliberately:** the original D-1 verification ran the tool **once**, saw
10/10, and marked it LIVE. A fix that works 60% of the time passes a single verification 60% of the
time. **Any fix that runs through a language model must be verified across ≥5 runs on genuinely
different inputs, and the register must record the rate, not the best result.**

### Observed unit economics — real data, not ceilings

The $7.34 / $55.05 figures in §H are **worst-case ceilings** (premium model, every generation).
Observed average across 32 priced generations: **$0.0021**.

| Tool | Tier | Gens | Cost | Per gen |
|---|---|---|---|---|
| keyword-research | premium | 2 | $0.0246 | **$0.0123** |
| seo-meta-generator | fast | 14 | $0.0144 | $0.0010 |
| post-caption-generator | premium | 14 | $0.0101 | $0.0007 |
| ad-headline-ab | fast | 2 | $0.0044 | $0.0022 |

**Two runs of one tool = 46% of all spend.** Keyword Research costs ~12× a meta generation. A
"200 generations" allowance is worth $0.14 in the meta generator and $2.46 in keyword research —
**margin is a function of tool mix, not just volume.**

### Soft observation — not filed as a defect

Keyword Research was seeded with *"beginner yoga classes Dallas"* and its top primaries came back
as *"online yoga classes for beginners"* and *"beginner yoga online"* — the **local** intent in the
seed was dropped in favour of online/national terms. Single observation, not reproduced, so it is
recorded here rather than filed. Worth a dedicated local-intent test case in the next pass.

---

## H3. RE-VERIFICATION after deploy `52cc9bf` — 2026-08-23

**Deploy confirmed live by a deterministic, non-model signal first:** the Brand Name placeholder on
`/dashboard/tools/seo-meta-generator` now renders `"e.g. Acme Studio"`, a string that exists only in
`52cc9bf`. `HEAD == origin/main == 52cc9bf`, 0 ahead / 0 behind.

Then 6 live generations — the same 5 verticals as the failing retest, **plus a sixth with the Brand
field deliberately filled** to prove the fix didn't break the legitimate path.

| Run | Brand supplied | "Shijo" hits | Count labels | Counts exact |
|---|---|---|---|---|
| yoga | — | **0** | 10 | **10/10** |
| leather wallets | — | **0** | 10 | **10/10** |
| emergency plumbing | — | **0** | 10 | **10/10** |
| vegan meal prep | — | **0** | 10 | **10/10** |
| bookkeeping | — | **0** | 10 | **10/10** |
| yoga, brand = "Lotus Flow Studio" | ✅ | **0** | 10 | **10/10** |

### D-34 → **LIVE**

**0 occurrences of our brand across all 6 runs** (was 35 across 5). The literal fallback string
`"not specified"` also never leaked into the copy — 0 occurrences — which was the main risk of the
fix. Copy degrades to first person instead: *"Start your yoga journey with **our** 6-week beginner
course in Dallas."*

**Regression check passed:** with Brand Name filled, "Lotus Flow Studio" appears 6 times. The
optional field still works exactly as intended when the user uses it.

### D-35 → **LIVE**

**Label emitted 6/6 (was 3/5). 60/60 counts exact.** Rate is 100%, not a best-of.

**Refactor regression check passed:** `ad-headline-ab` and `post-caption-generator` both state **0**
character counts, confirming `NO_SELF_MEASUREMENT_GUARD` still reaches every non-counted tool after
the split. D-24 holds.

### D-23 → **LIVE** (resolved as a side effect)

The `Title Tag:` / `Meta Description:` prefixes are present on every label —
`Title Tag (49 characters):` — so the D-23 item is closed.

### D-4 re-confirmed

Fabrication scan across all 6 outputs (certified / accredited / award-winning / star ratings /
review counts / "voted" / "#1" / guarantee): **0 hits.**

### Second re-verification pass — 6 further verticals, none previously used

Re-ran on a completely fresh set to make sure the first pass wasn't lucky:
family dentist (Phoenix), freelancer invoicing SaaS, mobile dog grooming (Seattle), online guitar
lessons, storm-damage roof inspection (Tampa), and a brand-supplied control
(`brand = "Cactus Ridge Dental"`).

**All 6: 0 "Shijo" occurrences · 0 `"not specified"` leaks · 10 labels each · 10/10 counts exact ·
0 fabrication hits.** The brand-supplied control used "Cactus Ridge Dental" 6 times.

**Running totals across both passes: 12 runs · 12 distinct verticals · 120/120 counts exact ·
0 brand injections · 0 fabrications.**

### ✅ DISCREPANCY RETRACTED — the `/admin/usage` banner was right; my arithmetic was wrong

Recorded here rather than deleted, because the register's own rules require corrections to be
visible.

I flagged `rowsWithoutCostData: 33` as suspect because it read **33** at three different totals
(42 → 50 → 56 generations) and I could not reconcile it. **A third data point settled it — in the
banner's favour.**

At 56 total generations:

| | Rows | Priced? |
|---|---|---|
| Today, before cost tracking deployed | 16 | ✗ |
| Today, after cost tracking deployed | 23 | ✓ |
| 2026-08-12 → 08-22 (all pre-tracking) | 17 | ✗ |
| **Total** | **56** | **33 unpriced, 23 priced** |

16 + 17 = **33.** The banner is correct.

**Two errors of mine, both worth naming:**

1. I assumed every row dated *today* was priced. It isn't — cost tracking deployed partway through
   the day, so today's 39 rows split 16 unpriced / 23 priced. That assumption produced the bogus
   "at most 17 untracked" ceiling.
2. I treated the number **staying constant** as evidence of a stale query. It is the opposite: no
   new unpriced rows are ever created, so a *correct* implementation must report a constant. I had
   the inference exactly backwards.

**No defect — nothing was filed.** (The number D-36 was later assigned to an unrelated, real finding
in §H4; it is *not* this.) The SQL query below is retained as a cheap independent confirmation
if anyone wants it, but it is no longer blocking:

```sql
SELECT
  COUNT(*)                                                        AS total_rows,
  COUNT(*) FILTER (WHERE metadata->>'inputTokens' IS NULL)         AS untracked_rows,
  COUNT(*) FILTER (WHERE api_cost_usd IS NULL OR api_cost_usd = 0) AS zero_cost_rows
FROM usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Method note earned the hard way:** this is the second severity/validity correction in this
engagement (the first was D-7, downgraded S1 → S3 after a live bundle scan). Both times the fix was
the same — **get a third data point before filing.** Two observations of a constant look like a
frozen query; three observations plus the arithmetic showed it was simply constant.

---


## H4. FULL REGRESSION SWEEP — 2026-08-23, on `07171c1` (product code = `52cc9bf`)

`HEAD == origin/main == 07171c1`, 0/0, worktree clean. `07171c1` and `5ba4993` are docs-only, so
the deployed product code is `52cc9bf`.

### All 12 tools — every one generated successfully

Single fixed scenario (Maya / Lotus Flow Studio, Dallas, 6-week beginner course, $149, October).
**12/12 succeeded, 64,041 characters, 90 seconds wall-clock.**

Model tier matched the registry on all 12 — **10 Sonnet, 2 Haiku** (`seo-meta-generator`,
`ad-headline-ab`), confirming D-11's corrected comment against live behaviour.

| Metric | Result |
|---|---|
| Brand injections ("Shijo") | **0** across all 12 |
| `"not specified"` leaks | **0** |
| Character-count labels | 10, **10/10 exact** |
| Stray counts on the other 11 tools | **0** — D-24 scoping holds |
| Invented scarcity | **0** |
| Fabricated credentials | **0 real hits** (see below) |
| Placeholders emitted instead of invented facts | **52** |

**The two "certified" regex hits were both false positives, checked in context:**

1. `seo-content-brief` — *"[IF APPLICABLE: Content reviewed by certified yoga instructor - RYT
   credential]"* — an explicitly conditional bracketed recommendation.
2. `ai-overview-optimizer` — *"**Certified Instructors** / All beginner classes taught by
   [INSTRUCTOR NAME], [CERTIFICATION LEVEL] registered with [CERTIFICATION BODY]…"* — a fill-in
   template where every fact is a placeholder.

Both are exactly the behaviour `ACCURACY_GUARD` was written to produce. **Zero assertions of fact
the user did not supply.**

### API guards — 10/10 pass

| Probe | Expected | Actual |
|---|---|---|
| `billing/checkout` bogus priceId | 400 | **400** "Invalid plan selected" |
| `billing/checkout` Enterprise priceId | 400 | **400** — paused plan stays unbuyable |
| `billing/checkout` mode `setup` | 400 | **400** "Invalid checkout mode" |
| `billing/checkout` no priceId | 400 | **400** "Missing required field: priceId" |
| `create-checkout` plan `enterprise` | 400 | **400** |
| `create-checkout` interval `weekly` | 400 | **400** "Invalid billing interval" |
| `create-checkout` growth + annual | 400 | **400** "not available on that billing interval yet" |
| `generate` empty required fields | 400 | **400** + `missingFields[]` |
| `generate` 25,000-char field | 400 | **400** "Too long (limit 20,000 characters)" |
| `generate` unknown toolId | 400 | **400** |

### Auth, routing and crawl surfaces — all pass

- **Unauthenticated API:** 401 on all 6 routes (`generate`, `usage`, `admin/usage`,
  `billing/portal`, `billing/checkout`, `stripe/create-checkout`).
- **Route protection:** `/dashboard`, `/dashboard/billing`, `/admin/usage`, `/admin/users` all land
  on `/login?redirect=%2F…` — same-origin and URL-encoded.
- **Security headers (D-6):** `strict-transport-security: max-age=63072000` ·
  `x-frame-options: SAMEORIGIN` · `x-content-type-options: nosniff` ·
  `referrer-policy: strict-origin-when-cross-origin` ·
  `permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.
  **CSP still absent** — known and deliberate, Report-Only first.
- **robots.txt:** disallows `/api/`, `/admin/`, `/dashboard/`.
- **sitemap.xml:** 13 URLs, **0 non-www**, **0 gated paths leaked**.
- **404:** real 404 status.
- **D-25:** disclaimer present verbatim; no volume figures stated.
- **Billing page:** "Standard Plan" in sidebar (D-21) · "Best Value" not "Most Popular" (D-14) ·
  "or $278/year (save 20%)" is a **button** (D-17) · Enterprise "Coming Soon" (D-18).

### Not re-testable this pass

**D-5** (limit-reached upsell) needs an exhausted quota; the account is on Standard with 149 of 200
remaining. **D-2** (open redirect) fires only after a successful login, so it cannot be exercised
without signing out of the owner's live session — source unchanged since it was verified.

---

### 🔴 D-36 (NEW, S2) — subscription status is stale: Stripe says active, our DB says `incomplete`

`/api/auth/me` and `/api/admin/users` both report `subscriptionStatus: "incomplete"` for the only
paying customer. Stripe's own billing portal for the same customer shows an **active** subscription,
a **paid** $29.00 invoice dated Aug 23, and next billing date Sept 23.

`planTier` is correctly `pro`, so access is not affected today — **which is precisely why this is
easy to miss and dangerous to leave.**

Stripe creates a subscription as `incomplete` and moves it to `active` when the first payment
confirms. Our `customer.subscription.created` handler ran; the follow-up
`customer.subscription.updated` evidently did not. The handlers themselves look correct
(`lib/stripe/webhook-handlers.ts` writes `subscription.status` on created, updated and deleted), so
the suspicion falls on **webhook delivery**, not handler logic.

**Why S2 and not cosmetic:** the same endpoint delivers `invoice.payment_failed` and
`customer.subscription.deleted`. If updates are not landing, **a customer who cancels or whose card
fails keeps paid access indefinitely**, and the admin panel shows the operator a status that is
simply wrong.

**To confirm:** Stripe Dashboard → Developers → Webhooks → the `www.shijo.ai/api/webhooks/stripe`
endpoint → check delivery attempts for `customer.subscription.updated` around 2026-08-23. Look for
non-2xx responses or an event type not selected on the endpoint. Then replay the failed event.

### 🟠 D-37 (NEW, S3) — quota resets on the calendar month, billing renews on the anniversary

`/api/usage` reports `resetLabel: "Resets Sep 1"` while Stripe reports next billing **Sept 23**.

A customer subscribing on the 23rd gets a full 200 generations for 8 days, then a fresh 200 on
Sep 1 — **400 generations inside their first billing period**, against a plan sold as "200
generations per month". At the observed cost mix this is real money, and at the Pro tier
(1,500/month) it is 3,000 generations for one payment.

Related to the still-undecided **D-22**. Both come down to one question that has never been
answered: **does a "month" mean a calendar month or a billing period?** Pick one and make the
quota, the copy and the reset label agree.

### 🟡 D-38 (NEW, S4 — needs a decision) — paid admin account has `emailVerified: false`

`/api/auth/me` reports `emailVerified: false` for an account that is an admin and has paid. Email
verification is therefore not enforced for either paid access or admin access.

Not filed as a defect because it may well be deliberate — but it should be a **decision on the
record**, not an accident. If verification is meant to gate anything, it currently gates nothing.

### Unit economics — better sample after the full 12-tool run

| | Value |
|---|---|
| Priced generations | 35 |
| Total API cost | **$0.3453** |
| **Average per generation** | **$0.0099** |

This is a far more representative figure than the earlier $0.0021, which was dominated by cheap
Haiku meta runs. At $0.0099 × 200, a Standard customer running the full tool mix at their plan
limit costs **≈$1.97/month against $29 revenue — roughly 93% gross margin**, well inside the
$7.34 worst-case ceiling in §H.

Cost stays concentrated in the long-form Sonnet tools: `keyword-research` $0.0489 over 3 runs
(**$0.0163 each**) versus `seo-meta-generator` $0.0482 over 27 (**$0.0018 each**) — a **9× spread
per generation**. Margin remains a function of tool mix, not volume.

---

## H5. EVIDENCE-GRADE VERIFICATION PASS — 2026-08-24, on `e168f12` (product code `52cc9bf`)

Run under an explicit "assume nothing" brief, to make the public case study defensible. Every claim
re-derived from primary evidence. **Two of this register's own records turned out to be wrong.**

### Provenance established BEFORE any behavioural test

`HEAD == origin/main == e168f12`, 0/0, worktree clean. Last code-touching commit: `52cc9bf`.
Deploy proved by a deterministic non-model probe: the deployed client bundle contains
`"e.g. Acme Studio"` ×3 and the pre-`52cc9bf` string `"e.g. Shijo.ai"` ×0.

### Fact table re-derived from source (not from these notes)

12 tools · 2 `minPlan: 'free'` (post-caption-generator, seo-meta-generator) · 10 `pro` ·
10 sonnet / 2 haiku · free 3/day forced haiku · pro 200/mo · growth 1500/mo · enterprise unlimited
with fair-use cap. **All prior figures in this register confirmed correct.**

### All 12 tools — VERIFIED

12/12 success, **63,393 chars, 77 s**. Model tier matched the registry on all 12.
**0 brand injections · 0 fabricated assertions · 56 placeholders · 10/10 counts exact · 0 stray
counts on the 11 non-counted tools · 0 invented scarcity.**

Three "certified" regex hits, all read in context, all bracketed templates → false positives.

### 🔴 CORRECTION 1 — D-5 was recorded as LIVE; only half of it shipped

D-5's original text had two halves: no upsell CTA, **and** "the Generate button stays enabled so the
user can keep failing." The register marked the whole finding **LIVE**.

Tested properly for the first time by intercepting `/api/generate` to force the real limit-reached
response shape (`403` + `upgradePrompt`) against the live UI — a 200-generation plan cannot be
practically exhausted.

| Half | Status |
|---|---|
| Upgrade CTA in the error box | ✅ **LIVE** — renders `<a href="/dashboard/billing">See plans & upgrade</a>` |
| Generate disabled at limit | ❌ **NEVER FIXED** — `disabled: false`; 3 further clicks all fired requests |

`components/dashboard/ToolPage.tsx` has `disabled={loading}` only. **D-5 status corrected to
PARTIALLY LIVE.** Remaining work: disable or relabel Generate at 0 remaining.

### 🔴 CORRECTION 2 — D-39 (NEW, S4) — the "zero price IDs in the client" claim was false

This register asserted, and the case study published: *"No Stripe price IDs in client — 16 JS chunks
scanned, zero found."* **Wrong.**

Enumerating every chunk the app actually loads (via `performance.getEntriesByType('resource')`
rather than `script[src]`, which is what the earlier scan must have used) finds **8 Stripe price IDs
in `layout-*.js`** — all of `STRIPE_PRICE_IDS`, including the paused `ENTERPRISE_*` and the sandbox
`CREDITS_*` ids. One was matched against the known `PRO_ANNUAL` constant to rule out a false
positive.

**Mechanism — a barrel-module leak.** Six client components import from `lib/stripe/products.ts`,
and **every one imports only `PLAN_DISPLAY_NAME`**; no client file references `STRIPE_PRICE_IDS` at
all. Same module ⇒ bundler ships the lot. Introduced in `fcd06fa` (the pricing restructure), so it
**predates this audit** — D-21's fix added one more importer but did not cause it.

**Fix:** move `PLAN_DISPLAY_NAME` into its own module with no server-side constants; point the six
client components at it.

**Impact on D-7's severity:** D-7 was downgraded S1 → S3 with the stated reason "no price IDs are
exposed in the client." **That reason was false.** The S3 conclusion still stands — but on the
*correct* grounds, which the code comment already gives: the server-side allowlist, not obscurity.
Re-verified today: bogus IDs, Enterprise IDs and invalid modes all → **400**.

Also scanned: **0 `sk_live_` keys, 0 AI-vendor API keys** in the bundle.

### D-2 — verified in the deployed artifact for the first time

Previously "not testable without signing out." Instead, the anonymous `/login` bundle (9 chunks,
517,821 bytes) was scanned. The guard is present as a single expression containing all six
structural elements: reads the `redirect` param, `startsWith("/")`, negated `startsWith("//")`,
`/dashboard` fallback, ternary, `location.href` assignment. **D-2 confirmed LIVE.**

### Everything else re-verified

API guards 10/10 → 400. Unauthenticated: 401 on all 6 routes. Route protection: 4/4 →
`/login?redirect=%2F…`. All 4 security headers present (CSP still absent, known). robots.txt correct.
Sitemap 13 URLs, 0 non-www, 0 gated. Real 404. D-25 disclaimer verbatim, 0 volume figures.
Homepage: 12 internal links, **0 broken**.

**Public-site claim audit vs registry:** "5 free tools" **0** · "2 free tools" 6 · "12 tools"
consistent · "visibility tracking" **0** · AI vendor named **0 times on marketing pages**, present
only on `/security` and `/ai-compliance` — exactly the disclosure policy.

**Two potential findings investigated and dissolved:**
- `/pricing` returns 404 — but nothing links to it; the sidebar "Pricing & Plans" points to
  `/dashboard/billing` (200).
- "free trial" on `/lp` and `/ai-marketing-tools` — it is an FAQ answer stating *"Is there a free
  trial? No trial needed — the Free plan is free forever with 2 tools and 3 generations."*
  **Accurate.** The "free trial" wording problem is confined to Google Ads copy.

### Still open, re-confirmed today

**D-32** all three paths still closed (portal offers only "Cancel subscription"; API → 400 "You are
already on the pro plan"). **D-33** still "SHIJO AI" without the dot. **D-36** `subscriptionStatus:
"incomplete"` while Stripe shows an active subscription, paid $29.00 invoice dated Aug 23, next
billing Sept 23. **D-37** `resetLabel: "Resets Sep 1"` vs billing Sept 23. **D-38**
`emailVerified: false`.

### 👁 WATCH ITEM — not filed, single observation, did not reproduce

One earlier `ai-overview-optimizer` run produced suggested page copy reading *"Lotus Flow Studio
beginner classes are taught exclusively by Yoga Alliance certified instructors holding
[RYT-200/RYT-500] credentials"* — credential *level* bracketed, certification itself asserted flat,
attached to the named business, in copy the user is meant to paste.

**Re-ran the tool 3× (yoga / dentistry / roofing): did not reproduce.** 2 of 3 produced fully
bracketed templates (`"Certified by [CERTIFICATION BODY] with [SPECIFIC CREDENTIAL]"`), 1 produced
none. Per this register's own rule, one observation is an anecdote — **not filed**. Add a targeted
test for unbracketed credential claims in *suggested page copy* (as distinct from ad/meta copy,
where ACCURACY_GUARD is proven).

### Unit economics — best sample yet

**51 priced generations · $0.7028 · avg $0.0138/generation.** Per-tool spread **14.6×**:

| Tool | $/generation |
|---|---|
| ai-overview-optimizer | **0.0268** |
| audience-targeting | 0.0211 |
| email-sequence-generator | 0.0210 |
| keyword-research | 0.0195 |
| seo-content-brief | 0.0158 |
| landing-page-copy | 0.0155 |
| faq-generator | 0.0096 |
| ad-copy-generator | 0.0073 |
| newsletter-generator | 0.0072 |
| post-caption-generator | 0.0035 |
| ad-headline-ab | 0.0032 |
| seo-meta-generator | **0.0018** |

Standard ($29, 200/mo): avg-mix **≈$2.76 → ~90% margin**; worst case (200× the dearest tool)
**$5.35 → ~82%**. Both inside the $7.34 ceiling in §H. **Margin is a function of tool mix.**

---

## I. Still open — ranked

| # | Finding | Sev | Owner |
|---|---|---|---|
| **D-36** | Subscription status stale — Stripe active, our DB `incomplete`. Suspect webhook delivery; the same channel carries payment-failed and cancellation | **S2** | Stripe webhook logs (owner) → then code |
| **D-32** | Annual plan unbuyable for existing monthly customers | **S2** | Stripe portal config (owner) + code |
| **D-39** | 8 Stripe price IDs shipped in the client bundle via a barrel module (`PLAN_DISPLAY_NAME` co-located with `STRIPE_PRICE_IDS`) — retracts the "zero price IDs" claim | S4 | code — split the module |
| **D-5b** | Generate button still enabled at quota limit — half of D-5 never shipped | S4 | code |
| **D-37** | Quota resets Sep 1 (calendar) but billing renews Sep 23 (anniversary) — 400 generations in the first paid period | **S3** | product decision + code |
| **D-38** | Paid admin account has `emailVerified: false` — verification gates nothing | S4 | **product decision** |
| **D-12/13** | Quota check-then-act and daily-counter insert races | **S3** | code — needs transaction/atomic upsert + load test |
| **D-6** | CSP still not shipped (Report-Only first) | **S3** | code |
| **D-33** | "SHIJO AI" missing its dot on all Stripe surfaces | S4 | Stripe Dashboard (owner) |
| **D-22** | Do free-tier generations count against the first paid month? | S4 | **product decision** |
| — | Ad description says "free trial"; SHIJO has a free **tier** | S4 | Google Ads (owner) |
| — | Callouts, lead form and call asset never audited | — | Google Ads (owner) |
| — | Sandbox `CREDITS_*` price ids still sit in the live `STRIPE_PRICE_IDS` constant | S4 | code |

---

## J. Defects this run introduced and then caught

Kept deliberately, because the count matters: **three of the findings above (D-24, D-31, and a
broken import in `Sidebar.tsx` caught by typecheck) were caused by fixes made earlier in the same
run.** An audit that does not re-audit its own patches ships a smaller number of bigger bugs.
