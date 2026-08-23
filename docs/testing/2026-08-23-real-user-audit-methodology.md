# The Real-User Audit — internal QA methodology

**Written** 2026-08-23 · **First run** SHIJO.AI production · **Owner** SHIRO Technologies LLC
**Purpose** A repeatable way to audit a live SaaS product by using it as a paying customer would,
and to come out the other side with a fix list ranked by money and reputation rather than by taste.

This document is the *method*. The evidence from the first run lives in
`docs/testing/2026-08-23-shijo-findings-register.md`. The customer-facing version lives in
`docs/marketing/2026-08-23-case-study-real-user-audit.md`.

---

## 0. Why this exists

Two audits had already been run on SHIJO.AI before this one. Both read the code. Both missed
that the SEO Meta Generator was stating character counts that were wrong on **every single
output**, and that the ad copy running on live Google Ads promised "5 Free Tools" when the
registry contained exactly two.

Neither of those is a subtle bug. Both are invisible to code review, because the code was
working *exactly as written* — the code just wasn't doing what the marketing said it did.

The only way to find that class of defect is to **become the customer**, give the product real
inputs, and check what comes back against reality.

---

## 1. Ground rules

| Rule | Why |
|---|---|
| **The bar is "would a real user ship this, or rewrite it?"** | "Does it return 200" is not a quality standard. A tool that produces copy the user must re-verify by hand has not saved them the work it charged for. |
| **Nothing is "fixed" until it is live.** | A local edit is not shipped. Check `HEAD` against `origin/main`, then read the deployed page. |
| **Every number the product states about itself is a claim under test.** | Character counts, search volumes, competition scores, tool counts, "most popular" badges. |
| **Severity is assigned by consequence, not by category.** | A dead button at the upgrade moment (S2) outranks a missing security header (S3), because one loses revenue every day and the other needs an attacker. |
| **Downgrade findings publicly when the evidence downgrades them.** | One finding in the first run was called S1 from code reading; a live check of 16 JS bundles showed the value was never exposed to the client. It was downgraded to S3 in writing. |

---

## 2. The method, in order

### Phase 1 — Establish ground truth from code, *before* opening the browser

Read the source of truth for what the product actually is. On SHIJO.AI that was
`lib/tools/registry.ts` (12 tools, which model each uses, which are free) and
`lib/tools/usage.ts` (plan limits).

Write down the facts. Everything the marketing, the pricing page and the ads claim will be
checked against **this table**, not against memory.

> **First-run trap worth stealing:** the internal plan keys did not match the customer-facing
> names. Internal `pro` renders as **"Standard" ($29)**; internal `growth` renders as
> **"Pro" ($199)**. Any tester who skips this step will file a stream of false positives — or
> worse, miss a real one. On SHIJO.AI the sidebar had no case for `growth` at all and showed
> paying $199 customers "Free Plan".

**Output of this phase:** a one-page fact table. Tools, plans, limits, prices, what is actually
built vs. what is a waitlist.

### Phase 2 — Write the scenario before the test cases

Not "test the caption generator." A named person with concrete, checkable facts:

> **Maya Reddy** runs a yoga studio in **Dallas**. She is launching a **6-week beginner course**
> for **$149**, starting in **October**.

Every one of those specifics becomes an assertion. Did the output use $149, or invent a price?
October, or a different month? Dallas, or a generic city?

More importantly, the scenario defines the **negative space** — the facts Maya did *not* give.
She never said her instructors were certified. She never mentioned awards, ratings, or how many
students had enrolled.

**A scenario without specifics cannot catch a fabrication.** This is the single highest-leverage
step in the method.

### Phase 3 — Sign up as a real user and stay in character

Register a genuine account. Hit the free tier's real limits. Do not seed the database, do not
grant yourself a plan, do not skip the emails.

What this catches that a seeded account never will: the defaults new users actually get, the
first-run empty states, the verification email, and — critically — **what happens at the moment
the free tier runs out.** On the first run, the limit-reached box said "Upgrade now" and
contained zero clickable elements, with the Generate button still enabled so the user could keep
failing. That is the highest-intent moment in the entire product and it was a dead end.

### Phase 4 — The invented-fact diff

For every generation, put the input and the output side by side and mark every factual assertion
in the output that was **not** in the input.

First run, verbatim from the product:

- *"with certified instructors"* — Maya never said anyone was certified
- *"Expert guidance, affordable pricing"* — unsupported
- *"Spots are filling up!"* — invented scarcity

Scarcity puffery is arguable. **A credential claim is not.** A yoga studio that publishes
"certified instructors" because a tool wrote it, when its instructors are not certified, has been
handed a liability by its own software.

Classify each: *supplied · reasonable inference · **fabrication***. Only the third is a defect,
but the third is the one that ends up in a lawsuit.

### Phase 5 — Verify every self-reported number

Anything the product states *about* its own output is measurable, so measure it.

First run: the SEO Meta Generator labelled each title with a length. Claimed 58/56/57/54/60.
Actual **52/44/43/39/47**. Wrong on 5 of 5, overstated by 6–15 characters every time — and a
60-character limit is the whole reason the number is displayed. The tool's one job was to save
the user from counting, and it was the only party in the transaction that couldn't count.

The fix is a template worth reusing: **stop asking the model to count and compute it in code
after generation.** Post-run verification took the same tool from 0/5 to **10/10 exact**.

The same pass caught a second one: the Keyword Research tool was presenting *estimated* intent
and competition as though they were measured search data. The fix was a forced disclaimer plus a
prohibition on stating volume figures at all.

### Phase 6 — Attack the API, not just the form

Client-side validation routinely hides a completely unguarded server. Call the endpoints directly
from the authenticated browser session with `fetch` and send what the form cannot:

- **empty required fields** — first run: `{"toolId":"seo-meta-generator","inputs":{}}` returned
  **200**, consumed one of the user's three daily generations, and billed real API tokens for an
  answer that opened *"Since the page topic and target keyword are undefined…"*
- **oversized fields** — no server-side length cap existed at all; output was capped by
  `max_tokens`, input by nothing
- **values the UI would never send** — a client-supplied `priceId` and `mode` forwarded straight
  to Stripe with no allowlist
- **unauthenticated** — every route, expecting 401

### Phase 7 — Buy the product

This is not optional and it is where the expensive findings live. A free-tier tester cannot see
the paywall transition, the checkout, the plan naming at the moment of payment, the receipt, the
customer portal, or the subscription state afterwards.

The purchase must be **real money on the live account**, because live mode is where the
misconfigurations are: test mode has different coupons, different payment methods, and a
different portal configuration.

First run found, in this phase alone: a "Most Popular" badge on a plan that Stripe showed had
never had a single subscriber; an advertised annual discount rendered as inert text the buyer
could not click; a "promo code" field with no coupons behind it, which could only ever reject
people at the exact moment their card was out; and a pricing card offering an Enterprise plan
that was paused and unbuyable.

### Phase 8 — Test every path to the same outcome

Do not stop at the first working route. Ask *how many ways can a user reach this outcome*, and
try all of them.

This is how the most expensive finding of the first run surfaced. "Can an existing monthly
customer buy the annual plan?" has three possible answers on SHIJO.AI, and all three were closed:

| Path | Result |
|---|---|
| Billing page, annual toggle on | Inert "Current Plan" text, zero buttons — while displaying the *annual* price and calling it the customer's current plan, which was false |
| `POST /api/stripe/create-checkout {plan:'pro',interval:'annual'}` | **400 — "You are already on the pro plan"** |
| Stripe Billing Portal | **"Cancel subscription" only** — plan switching not enabled |

Underneath all three was a data-model gap: the billing interval was never stored anywhere, so the
application could not distinguish a monthly customer from an annual one. The 20%-off annual plan
was unbuyable by exactly the people most likely to want it — the ones already paying.

Any one path tested in isolation looks like a UI nit. All three together is a revenue defect.

### Phase 9 — Follow the money

Ask three questions the product should already be able to answer, and treat "we can't tell" as a
finding:

1. **What did that generation cost us?** First run: the `api_cost_usd` column had existed since
   the schema was written and had **never been written to** — every row read `0.0000`. Only
   output tokens were retained, so historical spend could not be reconstructed even in principle.
2. **What is the margin per plan at the limit?** Answered for the first time in this run:
   Standard $29 → **max $7.34** of API cost at 200 generations (~75% margin); Pro $199 → **max
   $55.05** at 1,500 (~72%).
3. **Where would we see it if a customer went pathological?** Nowhere. An admin spend view had to
   be built, and then tested like any other page.

Store both token counts raw *and* the price computed at the rate in force at call time, so a
future price change doesn't silently rewrite history.

### Phase 10 — Audit the advertising against the code

The claims running in paid ads are part of the product and nobody QAs them.

First run, against live Google Ads assets:

| Live ad claim | Reality in code | Action |
|---|---|---|
| "Get Started With 5 Free Tools" | `registry.ts` has exactly **2** `minPlan: 'free'` entries | rewritten to "Start With 2 Free AI Tools" |
| "AI Search Visibility Tracking" | the page renders *"coming soon"* with a **waitlist** button | rewritten to "AI Overview Optimizer Tool" |
| "…Enterprise-Ready AI Platform" | Enterprise is paused and unbuyable | rewritten |
| Pricing sitelink advertising Enterprise | same | removed |

Every headline, description, sitelink and callout gets checked against the fact table from Phase 1.
Where an asset list is paginated, exhaust it — and if you don't, **say so in writing** rather than
implying full coverage.

### Phase 11 — Verify the fix live, then say what state it is in

Three distinct states, never conflated:

**edited locally** → **committed** → **pushed and live**

For each fix: confirm `HEAD == origin/main`, then re-run the original failing case against
production and record the new observed value. "The diff looks right" is not verification.

The first run produced a correction of its own record at this step: a fix the *previous* session
had marked as done turned out, on reading the live HTML, never to have been committed.

**Verify a probabilistic fix probabilistically.** If the patched path runs through a language
model, one green run is not a pass. Run it **at least five times across genuinely different
inputs** and record the *rate*, not the best result.

This rule exists because the first run broke it. The character-count fix was verified once, scored
10/10, and marked LIVE. A retest hours later across five verticals found the correction firing on
only **3 runs in 5** — perfect when it fired (30/30 exact), absent entirely otherwise, because two
prompt instructions we had written were contradicting each other. **A fix that works 60% of the
time passes a single verification 60% of the time.**

### Phase 11b — Audit hardcoded defaults

Every `||` fallback in a prompt template is a claim the product makes on the user's behalf whenever
they leave a field blank — and blank is the common case for any optional field.

Grep the templates for every default and read them as though a customer had shipped them. The first
run's retest found this line in production:

```
Brand name: ${i.brand || 'Shijo.ai'}
```

Brand Name is optional. Leave it blank and the tool wrote **our own product name** into the
customer's title tags and meta descriptions — reproduced on 5 of 5 runs across 5 unrelated
verticals, 35 occurrences, once inside the title tag itself. Every other brand default in the same
file degraded neutrally (`'not specified'`, `'the business'`, `'the newsletter'`); exactly one named
us, and it was the tool that writes the text Google displays.

**No amount of output-diffing catches this if you only ever test with the optional fields filled
in.** Test the empty-optional path explicitly.

### Phase 11c — Retest days later, after everything is green

Schedule a second full pass once the fix batch is deployed and the register says LIVE. Treat it as
a fresh audit, not a spot-check.

The first run's second pass produced two new S2/S3 findings, both in code that had already been
verified — and both invisible to a re-read of the diff.

### Phase 12 — Audit your own fixes with the same hostility

Fixes introduce defects. Three of the first run's findings were caused by earlier fixes in the
same run:

- The character-count corrector, applied globally, started reading the *rationale* line on a
  different tool and labelled a 43-character headline "(130 characters)". It had to be scoped to
  the one tool that states counts.
- The accuracy guard told the model never to state a character count — which removed the very
  anchor text the corrector needed to find and rewrite.
- The new admin spend page divided total cost by *all* generations including 33 that predated
  cost tracking, under-reporting average cost by **24×** ($0.0001 vs. the real $0.0024).

An audit that doesn't re-audit its own patches ships a smaller number of bigger bugs.

---

## 3. Severity scale

| | Meaning | First-run examples |
|---|---|---|
| **S1** | Data loss, unauthorised access, or money moved incorrectly | none confirmed |
| **S2** | Revenue lost, or a false claim published to customers | dead upgrade CTA · annual plan unbuyable · wrong character counts · invented credentials · open redirect |
| **S3** | Real exposure needing an attacker or an unusual path | missing security headers · no price allowlist · no input length cap |
| **S4** | Polish, drift, cosmetic | stale usage counter · code comment out of date · merchant name missing its dot |

Two rules that keep the scale honest:

- **A false claim is at least S2**, whatever its technical difficulty, because it is published and
  it is wrong.
- **Downgrade in writing** when live evidence contradicts a code-read severity, and say that you
  did.

---

## 4. What to produce

| Artifact | Contents |
|---|---|
| **Fact table** (Phase 1) | tools, plans, limits, prices, built vs. waitlist |
| **Scenario** (Phase 2) | one named persona, five to seven concrete facts, explicit negative space |
| **Test plan** | numbered cases grouped in suites, each with an expected result stated *before* running |
| **Findings register** | one row per finding: what, evidence, severity, fix, status (OPEN / FIXED-LOCAL / LIVE / WONTFIX) |
| **Output quality scoring** | per tool: *Ship as-is · Light edit · Substantial rewrite · Unusable* |
| **Unit economics** | cost per generation, margin per plan at the plan limit |
| **Case study** | the public version — see the marketing doc |

---

## 5. Applying this to another product

The method transfers; the specifics do not. For each new product:

1. Find the file that is the **registry** — the single place that defines what the product sells.
   Build the fact table from it. If no such file exists, that is finding #1.
2. Write a scenario in the product's own domain, with numbers a human would actually supply.
3. Sign up, exhaust the free tier, and **watch the wall** — what does the product do to a user it
   has just stopped serving?
4. Pay real money.
5. Diff every output against its input.
6. Measure every number the product states about itself.
7. Call the API the way the UI never would.
8. Enumerate the paths to each outcome and try all of them.
9. Ask what a generation cost, and what the margin is at the limit.
10. Check the ads against the fact table.
11. Read every hardcoded default in the prompt templates, and test the empty-optional path.
12. Verify live — five runs minimum for anything that goes through a model, reporting the rate.
13. Re-audit the patches. Then come back days later and run the whole suite again.

**Rough effort, first run:** one product, 12 tools, ~64,000 characters of generated output
reviewed by hand, 90+ test cases across 12 suites, 33 findings, three deploys.

---

## 6. Method limitations — state these, don't hide them

- **One scenario is one market.** Maya Reddy is a solo local-services operator. The tools were not
  tested against B2B SaaS, e-commerce, or agency inputs; a second scenario is planned precisely
  because one persona cannot represent the customer base.
- **Concurrency was not tested.** Two race conditions (quota check-then-act, and the daily-counter
  insert) were found by reading code and remain unverified, because reproducing them needs
  parallel load, not a browser.
- **Model output is non-deterministic** — and this cuts both ways. Every quality *finding* here was
  reproduced before being filed, because a single bad generation is an anecdote. The retest showed
  the converse matters just as much: a single *good* generation is also an anecdote, and the first
  run used one to close a finding that was in fact only 60% fixed. Rates, not results.
- **Paginated asset lists were not always exhausted.** Where coverage stopped, the register says so.
