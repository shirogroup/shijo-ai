# We audited our own AI product like a paying customer. It failed the first test we gave it.

*A case study in shipping AI tools honestly — SHIJO.AI, August 2026*

---

## The one-sentence version

We gave our own SEO tool a simple job — tell the user how long a title tag is — and it got the
answer wrong **five times out of five**, every time in the direction that mattered.

Here is how we found that, what else came up, and the method we now use before anything ships.

---

## Why we did this

SHIJO.AI is a suite of 12 AI marketing tools. It had already been through two rounds of code
review. Both were competent. Both missed the same class of problem, because the code was doing
exactly what it was written to do — it just wasn't doing what we were *telling customers* it did.

So we stopped reviewing code and started using the product.

Not with a seeded admin account. A real signup, the real free tier, real limits, and — the part
most internal testing skips — **a real card on the live account.**

---

## The scenario

Abstract testing finds abstract bugs. So before writing a single test case we wrote a customer:

> **Maya Reddy** runs a yoga studio in **Dallas**. She's launching a **6-week beginner course**
> for **$149**, starting in **October**.

Six concrete facts. That's the whole trick. Every output could now be checked two ways:

- **Did it use Maya's facts?** ($149, October, Dallas, beginner, six weeks)
- **Did it make any up?**

The second question is the one that matters, and you can only ask it if you know exactly what the
customer supplied.

---

## Finding 1 — The tool couldn't count

The SEO Meta Generator writes title tags and labels each with its length. Length is the entire
reason anyone uses the tool: Google truncates titles past roughly 60 characters, and counting them
by hand is exactly the chore the product exists to remove.

We counted them.

| Tool claimed | Actually was | Off by |
|---|---|---|
| 58 characters | **52** | −6 |
| 56 characters | **44** | −12 |
| 57 characters | **43** | −14 |
| 54 characters | **39** | −15 |
| 60 characters | **47** | −13 |

Five out of five wrong. We ran it again on a fresh topic: claimed 58, actual 45.

The cause is not exotic. We were asking a language model to count characters, and language models
do not see characters — they see tokens. Asking one to count letters is like asking someone
reading a book through a frosted window to count the ink.

**The fix took no AI at all.** We stopped asking the model for the number and started computing
`title.length` in code after generation, then rewriting the label with the real figure.

Re-tested against production after the deploy: **10 out of 10 exact.**

There's a general rule buried in this one, and it applies to every AI product on the market:

> **Never let the model report a fact the code can measure.**

Character counts, word counts, item counts, prices, dates, totals. If a deterministic function can
produce it, a deterministic function should.

---

## Finding 2 — It invented a credential

Maya told us she taught beginner yoga in Dallas for $149. The meta description came back
describing her studio as having **"certified instructors."**

She never said that. We never asked. The model filled a persuasive gap the way persuasive writing
does — and handed a small business a claim about professional credentials that it may not be able
to support.

Other inventions in the same run: *"Expert guidance, affordable pricing."* *"Spots are filling
up!"*

Invented urgency is arguable — marketing copy has always done that. **An invented credential is
not arguable.** There is a hard line between puffery and a factual claim about qualifications, and
a tool that writes marketing for small businesses must not cross it on the customer's behalf.

The fix is a constraint applied to every generation: never assert credentials, certifications,
awards, ratings, review counts or numbers the user didn't supply. Where a detail would genuinely
strengthen the copy, emit a visible placeholder — `[YOUR CREDENTIAL]` — so the human decides.

Across a follow-up run of all 12 tools and roughly 64,000 characters of output, we found no
remaining fabricated credentials.

---

## Finding 3 — Estimates dressed up as data

Our Keyword Research tool returned intent and competition ratings for every keyword. They read
like search data. They were not — they were the model's inference from the phrasing.

Nobody had lied. But a marketer reading "competition: low" reasonably assumes it came from
somewhere, and acts on it.

Now the tool opens with an explicit line saying the ratings are estimates rather than measured
search data, points the user to a live-data keyword tool for the real figures, and is forbidden
from stating a search volume number at all.

A confident number with no source behind it is worse than no number.

---

## Finding 4 — The most expensive bug was a button that didn't exist

The free tier gives three generations a day. We used all three, then asked for a fourth.

The product said: **"Daily limit reached. Upgrade now."**

That box contained zero links and zero buttons. Nothing to click. And the Generate button stayed
enabled underneath it, so a user could keep pressing it and keep failing.

This is the highest-intent moment in the entire product. The customer has used it, liked it enough
to want more, and hit the wall. That is when they will pay — and we had built a dead end.

We have no idea how many people that cost us, because they left without a trace.

---

## Finding 5 — We were selling a discount nobody could buy

We offer 20% off for annual billing: $278/year instead of $348. The number is correct and the
Stripe price is configured properly — we checked it at live checkout.

Then we asked a question that sounds trivial and isn't:

> *Can a customer already paying monthly actually switch to it?*

There were three possible routes. We tried all three.

| Route | What happened |
|---|---|
| The billing page, annual toggle on | The card showed the annual price and, beneath it, inert text reading "Current Plan" — no button. It was also simply false: they're on monthly. |
| The upgrade API, asked for annual | **400 — "You are already on the pro plan."** Our guard compared plan names, and monthly and annual share one. |
| The billing portal | One option: **cancel**. Plan switching was never enabled. |

Underneath all three sat a data-model gap: **we never stored the billing interval anywhere.** The
application literally could not tell a monthly customer from an annual one.

So the 20% annual offer was purchasable by new signups and completely unreachable for existing
paying customers — the group most likely to want it.

Every one of those three, on its own, reads like a UI nit. Together they're a revenue hole. **The
lesson is to enumerate every path to an outcome and try all of them**, because a product with two
working routes and one broken one still looks fine from the outside.

---

## Finding 6 — Our own ads were making claims our code contradicted

Live Google Ads copy, checked line by line against the source of truth:

| The ad said | The code said | |
|---|---|---|
| "Get Started With 5 Free Tools" | exactly **2** tools are free | ✗ |
| "AI Search Visibility Tracking" | that page is a **waitlist** — "coming soon" | ✗ |
| "…Enterprise-Ready AI Platform" | Enterprise is paused and unbuyable | ✗ |
| A sitelink advertising Enterprise pricing | same | ✗ |

Four false claims, running, spending money, in front of customers.

Nobody wrote them dishonestly. They accumulated: a plan got paused, a feature slipped to a
waitlist, a tool count changed — and the ad account is the one surface no engineer ever opens.

**Advertising copy is part of the product.** It needs the same source-of-truth check as a pricing
page, and it needs it on a schedule.

---

## Finding 7 — We couldn't tell what anything cost

An AI product's gross margin is an API bill. Ours was unmeasurable.

The database had a column for the cost of each generation. It had existed since the schema was
written and had **never once been written to.** Every row read `0.0000`. Worse, only output tokens
were being stored, so the real spend couldn't be reconstructed retroactively even in principle.

We now record both token counts raw *and* the cost priced at the rate in force at the time of the
call — so a future price change doesn't silently rewrite history — plus an internal view of spend
by day, tool, plan and customer.

The first thing it told us was our actual unit economics, which we had never measured:

| Plan | Price | Max API cost at the plan limit | Gross margin |
|---|---|---|---|
| Standard | $29/mo | $7.34 at 200 generations | **~75%** |
| Pro | $199/mo | $55.05 at 1,500 generations | **~72%** |

Healthy — but we'd been guessing, and "healthy" and "guessing" are not a business.

One footnote worth keeping, because it's the honest kind: the first version of that internal
dashboard divided total spend by *every* generation, including the 33 that predated cost tracking
and had no price attached. It reported an average of $0.0001 against a real figure of $0.0024 —
**wrong by 24×.** We caught it because we tested our own fix as hostilely as we'd tested the
original bug.

---

## What we changed

Across three deploys in one day:

- Character counts computed in code, not claimed by the model — verified 10/10 exact live
- An accuracy constraint on every generation, with visible placeholders instead of invented facts
- Estimates explicitly labelled as estimates
- A real upgrade button at the moment the free tier ends
- Server-side validation of required fields, so empty requests stop burning quota and tokens
- A server-side length cap on input
- An allowlist on checkout prices
- Security response headers, and a login redirect restricted to same-origin paths
- "Most Popular" removed from a plan Stripe showed had never had a subscriber
- A promo-code field switched off until an actual coupon exists, so it can't reject people mid-payment
- Per-generation cost tracking and an internal margin view

Still open, and we'd rather say so than not: two concurrency races found by reading code that need
parallel load to reproduce properly, and the annual-switch path from Finding 5, which needs a
change on both our side and our payment provider's.

---

## The method, in one list

If you want to run this on your own product:

1. **Build a fact table from code first.** What do you actually sell? Which features are real and
   which are waitlists? Everything else gets checked against this.
2. **Write a customer with specific numbers** before writing a single test case. Specifics are what
   let you detect fabrication.
3. **Sign up for real.** Hit the free limit. Watch what your product does to a user it just
   stopped serving.
4. **Diff every output against its input.** Anything asserted that wasn't supplied is a defect.
5. **Measure every number the product states about itself.**
6. **Call your API the way your UI never would** — empty fields, huge fields, values the form
   can't send.
7. **Pay real money on the live account.** Test-mode payment configuration is not your production
   payment configuration.
8. **Enumerate every path to each outcome and try all of them.**
9. **Ask what one generation costs and what the margin is at the plan limit.** "We can't tell" is
   a finding.
10. **Check your ads against the fact table.**
11. **Verify fixes on production, not in the diff** — and then audit your fixes as hostilely as you
    audited the bugs.

---

## Why we published this

An AI marketing tool that invents credentials for a yoga studio is not a quirky edge case. It's
the central risk of the whole category, and every product in it has some version of these bugs
right now.

We would rather be the company that goes looking for them.

---

*SHIJO.AI is an AI marketing platform: 12 tools for SEO, ads, email and social. Two are free
forever, no card required.*

---

### Publication checklist — internal, remove before posting

- [ ] Confirm every figure against `docs/testing/2026-08-23-shijo-findings-register.md`
- [ ] Confirm the unit-economics table still matches current model pricing
- [ ] Confirm Findings 4, 6 and 7 are still described in the past tense (all fixed and live)
- [ ] Confirm Finding 5 is still accurate at time of posting — if the annual switch has shipped,
      move it to "what we changed" and say so
- [ ] No AI vendor named anywhere (per brand policy — vendor disclosure belongs in the Privacy
      Policy sub-processor list, /security and /ai-compliance only)
- [ ] SHIJO.AI used throughout; SHIRO Technologies LLC appears nowhere in customer-facing copy
- [ ] No open security finding described in enough detail to be actionable by a reader
