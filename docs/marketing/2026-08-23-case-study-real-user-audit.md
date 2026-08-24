# We audited our own AI product like a paying customer — then audited the audit

*SHIJO.AI · August 2026 · Every figure below was re-verified against production before publishing*

---

## The one-sentence version

We gave our own SEO tool one simple job — tell the user how long a title tag is — and it got the
answer wrong five times out of five.

Then we fixed it, verified the fix, marked it done, and discovered on retest that the fix was only
firing 3 runs out of 5.

Then we went back a third time, assumed nothing, and found that **two of our own audit findings
had been recorded wrongly** — including one where we'd published a security claim that simply
wasn't true.

This is that whole chain, with the numbers.

---

## A note on evidence, because it matters here

Everything below is one of two kinds:

- **VERIFIED TODAY** — re-observed on production during the final pass. Reproducible.
- **HISTORICAL** — observed during the first run, before the fix shipped. **It cannot be
  re-observed now, because the bug is gone.** We flag these explicitly rather than implying they're
  live measurements.

We also publish two corrections against our own earlier write-up. A case study that only shows the
author being right is a brochure.

---

## Why we did this

SHIJO.AI is a suite of **12** AI marketing tools; **2** are free forever. *(Verified today, counted
from the tool registry in source: 12 entries, 2 with `minPlan: 'free'`, 10 on the premium model
tier and 2 on the fast tier.)*

It had already been through two rounds of code review. Both were competent. Both missed the same
class of problem, because the code was doing exactly what it was written to do — it just wasn't
doing what we were *telling customers* it did.

So we stopped reviewing code and started using the product. A real signup, the real free tier, real
limits, and — the part most internal testing skips — **a real card on the live account.**

---

## The scenario

Abstract testing finds abstract bugs. So before writing a single test case we wrote a customer:

> **Maya Reddy** runs a yoga studio in **Dallas**. She's launching a **6-week beginner course** for
> **$149**, starting in **October**.

Six concrete facts. That's the whole trick. Every output could then be checked two ways: *did it use
Maya's facts*, and *did it make any up?*

The second question is the one that matters, and you can only ask it if you know exactly what the
customer supplied. **A scenario without specifics cannot catch a fabrication.**

---

## Finding 1 — The tool couldn't count

The SEO Meta Generator writes title tags and labels each with its length. Length is the whole point:
Google truncates titles past roughly 60 characters, and counting them by hand is exactly the chore
the product exists to remove.

We counted them. **(HISTORICAL — first run, pre-fix.)**

| Tool claimed | Actually was | Off by |
|---|---|---|
| 58 characters | **52** | −6 |
| 56 characters | **44** | −12 |
| 57 characters | **43** | −14 |
| 54 characters | **39** | −15 |
| 60 characters | **47** | −13 |

Five out of five wrong, every one overstated. Reproduced on a second topic: claimed 58, actual 45.

The cause isn't exotic. We were asking a language model to count characters, and language models
don't see characters — they see tokens. Asking one to count letters is like asking someone reading
through frosted glass to count the ink.

**The fix needed no AI at all.** Stop asking the model for the number; compute `title.length` in code
after generation and rewrite the label with the real figure.

> **Never let a model report a fact your code can measure.** Character counts, word counts, item
> counts, prices, dates, totals.

### …and then the retest found the fix firing only 60% of the time

We came back hours later and ran the same tool across five unrelated businesses.

| Run | Label emitted? | Counts |
|---|---|---|
| yoga | **no** | no length stated at all |
| leather wallets | yes | 10/10 exact |
| emergency plumbing | **no** | no length stated at all |
| meal prep | yes | 10/10 exact |
| bookkeeping | yes | 10/10 exact |

When the label appeared the correction was flawless — 30/30 exact. On two runs in five the tool
stated no length whatsoever, silently handing back the manual counting it exists to remove.

The cause was our own two instructions arguing. Our accuracy rule said *"do not state character
counts — you cannot count reliably."* Our label rule said *"keep the `(N characters)` label; the
number is recomputed afterwards."* Both were appended to the same prompt. The model picked a side,
and which side varied run to run.

**We'd have missed this entirely without a retest.** The original verification ran once, saw 10/10,
and marked it done. **A fix that works 60% of the time passes a single verification 60% of the
time.**

The real fix was to stop depending on the model at all: the two rules are now mutually exclusive,
*and* the code can now **insert** a missing label rather than only rewrite an existing one.

**VERIFIED TODAY:** 12 further generations across 12 distinct verticals. **Label present every time,
120 out of 120 counts exact.** A rate, not a best-of.

> **Verify a probabilistic fix probabilistically.** If it runs through a language model, one green
> run is not a pass. Five runs on genuinely different inputs, and you report the rate.

---

## Finding 2 — It invented a credential

Maya told us she taught beginner yoga in Dallas for $149. The meta description came back describing
her studio as having **"certified instructors."** *(HISTORICAL — first run.)*

She never said that. We never asked. Other inventions in the same run: *"Expert guidance, affordable
pricing."* *"Spots are filling up!"*

Invented urgency is arguable — marketing has always done that. **An invented credential is not.**
There's a hard line between puffery and a factual claim about professional qualifications, and a
tool writing marketing for small businesses must not cross it on the customer's behalf. A studio
that publishes "certified instructors" because software wrote it has been handed a liability by its
own vendor.

The fix is a constraint on every generation: never assert credentials, certifications, awards,
ratings, review counts or numbers the user didn't supply. Where a detail would genuinely strengthen
the copy, emit a visible placeholder — `[YOUR CREDENTIAL]` — so a human decides.

**VERIFIED TODAY:** all 12 tools, **63,393 characters** of output, scanned for credential claims,
star ratings, review counts, "voted", "#1", guarantees and invented scarcity. **Zero fabricated
assertions. 56 placeholders emitted instead.**

The scan flagged three instances of the word "certified". We read all three in context; every one
was a bracketed template for the user to fill in — *"[AUTHOR BIO: Include if author has personal
yoga experience or is certified instructor]"*. That's the guard working, not failing.

**One honest caveat we're leaving in:** in a single earlier run, the AI Overview Optimizer produced
suggested page copy reading *"taught exclusively by Yoga Alliance certified instructors holding
[RYT-200/RYT-500] credentials"* — the credential *level* bracketed, but the certification itself
asserted flat. We re-ran that tool three more times across yoga, dentistry and roofing; **it did not
reproduce** (2 of 3 runs produced fully-bracketed templates, one produced none at all). One
observation is an anecdote, so we are not claiming a defect — we're logging it as a watch item with
a dedicated test. We'd rather tell you about the loose thread than quietly not mention it.

---

## Finding 3 — We were putting our own brand into the customer's copy

The retest turned up something worse than an invented credential, and it wasn't the AI's fault at
all. **(HISTORICAL — reproduced 5 of 5 runs before the fix.)**

Maya's meta descriptions came back reading:

> *"Start your yoga journey with **Shijo.ai's** 6-week beginner course in Dallas this October."*

That's our product name, inserted into a yoga studio's search-result copy. If Maya had shipped it,
her Google listing would have advertised us.

We ran it four more times across unrelated businesses. **Every single run.** Thirty-five occurrences
across five generations. One put it in the title tag itself: *"Handmade Leather Wallets for Men |
Free Shipping by Shijo.ai."*

The cause was one line in our own prompt template:

```
Brand name: ${i.brand || 'Shijo.ai'}
```

Brand Name is an **optional** field. Leave it blank — as most people will — and the template doesn't
fall back to a neutral placeholder. It falls back to *us*.

The tell was in the same file. Every other tool taking a brand degrades gracefully:
`'not specified'`, `'the business'`, `'the newsletter'`. Exactly one named our product, and it was
the tool that writes the text Google displays.

Nobody typed that maliciously. Someone wrote a plausible example value while building the template,
and it became the production default for every customer who stayed silent.

> **Audit your defaults, not just your outputs.** Every `||` fallback is a claim your product makes
> whenever the user says nothing — and saying nothing is the common case.

**VERIFIED TODAY:** 12 runs across 12 verticals — **zero occurrences of our brand**, and zero
instances of the replacement string leaking into copy either. The output now degrades to first
person: *"our 6-week beginner course in Dallas."* We also checked the opposite direction, because a
fix that quietly breaks the working path isn't a fix: with Brand Name filled in, the supplied brand
appears throughout. The field still does its job.

---

## Finding 4 — Estimates dressed up as data

Our Keyword Research tool returned intent and competition ratings for every keyword. They read like
search data. They were the model's inference from phrasing.

Nobody lied. But a marketer reading "competition: low" reasonably assumes it came from somewhere,
and acts on it.

**VERIFIED TODAY** — the tool now opens with this line, verbatim:

> *"Note: intent and competition below are estimates based on the phrasing and the market, not
> measured search data. For real search volume and competition scores, check these terms in Google
> Keyword Planner or a keyword tool with live data."*

It's also now forbidden from stating a search volume figure at all. **Verified: zero volume numbers
in the output.**

A confident number with no source behind it is worse than no number.

---

## Finding 5 — The most expensive bug was a button that didn't exist *(and our record of the fix was wrong)*

The free tier gives three generations a day. We used all three and asked for a fourth.

The product said: **"Daily limit reached. Upgrade now."** That box contained zero links and zero
buttons. Nothing to click. And the Generate button stayed enabled underneath, so a user could keep
pressing it and keep failing. *(HISTORICAL.)*

This is the highest-intent moment in the entire product. The customer has used it, liked it enough
to want more, and hit the wall. That's when they pay — and we'd built a dead end.

**Here's the correction.** Our findings register recorded this as fully fixed. On the final pass we
tested it properly for the first time — by intercepting the API response to force the real
limit-reached state on the live UI, since we couldn't practically exhaust a 200-generation plan.

**Half of it was fixed. Half was not.**

| | Status |
|---|---|
| Upgrade CTA inside the error box | ✅ **Fixed** — renders `See plans & upgrade` linking to billing |
| Generate button disabled at limit | ❌ **Never fixed** — still enabled |

We clicked Generate three more times in the limit state. All three attempts fired. The button reports
`disabled: false`.

So the revenue half landed and the annoyance half didn't, and for weeks our own records said both
were done. **The lesson isn't about the button. It's that "fixed" is a claim, and claims need the
same evidence standard as bugs.**

---

## Finding 6 — We were selling a discount nobody could buy

We offer 20% off annual billing: $278/year against $348. The price is configured correctly — we
confirmed it at live checkout: *"Subscribe to SHIJO.AI Standard · $278.00 per year · $23.17/month
billed annually."* $278/$348 is a **20.1%** saving, so the badge is honest.

Then we asked a question that sounds trivial and isn't: *can a customer already paying monthly
actually switch to it?*

Three possible routes. **VERIFIED TODAY — all three still closed:**

| Route | Result |
|---|---|
| Billing page, annual toggle on | Inert "Current Plan" text, no button — while displaying the annual price and calling it their current plan, which is false |
| The upgrade API, asking for annual | **400 — "You are already on the pro plan"** |
| The billing portal | One option: **cancel**. Plan switching not enabled |

Underneath all three sits a data-model gap: **we never store the billing interval.** The application
cannot tell a monthly customer from an annual one.

So the annual discount is purchasable by new signups and unreachable for existing paying customers —
the group most likely to want it.

Each route alone looks like a UI nit. Together they're a revenue hole. **Enumerate every path to an
outcome and try all of them**, because a product with two working routes and one broken one looks
fine from outside.

*Still open at publication. The portal half is a payment-provider setting; the code half is ours.*

---

## Finding 7 — Our own ads made claims our code contradicted

Live ad copy, checked line by line against the source of truth:

| The ad said | The code said |
|---|---|
| "Get Started With 5 Free Tools" | exactly **2** tools are free |
| "AI Search Visibility Tracking" | that page is a **waitlist** — "coming soon" |
| "…Enterprise-Ready AI Platform" | Enterprise is paused and unbuyable |
| A sitelink advertising Enterprise pricing | same |

Four false claims, running, spending money, in front of customers.

Nobody wrote them dishonestly. They accumulated: a plan got paused, a feature slipped to a waitlist,
a tool count changed — and the ad account is the one surface no engineer ever opens.

**VERIFIED TODAY across the public site:** "5 free tools" appears **zero** times; "2 free tools"
appears 6 times on the pages that mention it; "12 tools" is consistent everywhere; "visibility
tracking" appears **zero** times. All match the registry.

**Advertising copy is part of the product.** It needs the same source-of-truth check as a pricing
page, on a schedule.

---

## Finding 8 — We couldn't tell what anything cost

An AI product's gross margin is an API bill. Ours was unmeasurable.

The database had a column for per-generation cost. It had existed since the schema was written and
had **never once been written to** — every row read `0.0000`. Worse, only output tokens were stored,
so spend couldn't be reconstructed retroactively even in principle.

We now record both token counts raw *and* the cost priced at the rate in force at the time of the
call, so a future price change can't silently rewrite history.

**VERIFIED TODAY — 51 priced generations, $0.7028 total, average $0.0138 per generation.** We
hand-checked the arithmetic on one row against the published model rates; it matched to the cent.

The interesting part isn't the average. It's the spread:

| Tool | Cost per generation |
|---|---|
| AI Overview Optimizer | **$0.0268** |
| Audience Targeting | $0.0211 |
| Email Sequence Generator | $0.0210 |
| Keyword Research | $0.0195 |
| SEO Content Brief | $0.0158 |
| Landing Page Copy | $0.0155 |
| FAQ Generator | $0.0096 |
| Ad Copy Generator | $0.0073 |
| Newsletter Generator | $0.0072 |
| Post Caption Generator | $0.0035 |
| Ad Headline A/B | $0.0032 |
| SEO Meta Generator | **$0.0018** |

**A 14.6× spread.** A "200 generations per month" allowance is worth $0.37 if the customer lives in
the meta generator and $5.35 if they live in the AI Overview Optimizer.

At the observed average, a Standard customer at their plan limit costs **≈$2.76 against $29 — about
90% gross margin.** Even the pathological case, 200 runs of the most expensive tool, lands at ~82%.
Healthy — but we'd been guessing, and "healthy" and "guessing" are not a business.

**Margin is a function of tool mix, not volume.** You cannot see that until you price each call.

One footnote worth keeping: the first version of that internal dashboard divided total spend by
*every* generation, including those predating cost tracking. It reported an average of $0.0001
against a real $0.0024 — **wrong by 24×.** We caught it by testing our own fix as hostilely as we'd
tested the original bug.

---

## The correction we least enjoyed writing

Our first write-up contained this line, presented as verified fact:

> *"No Stripe price IDs in client — 16 JS chunks scanned, zero found."*

**That was wrong.** On the final pass we enumerated every JavaScript chunk the app actually loads —
not just the ones linked in the page source — and scanned them properly.

**Eight Stripe price IDs are in the deployed client bundle**, including the paused Enterprise prices
and some sandbox credit-pack IDs. We confirmed one against the known constant to be certain it
wasn't a false positive.

The cause is a barrel-module leak, and it's almost funny: six client components import exactly one
thing from that module — a plan-name lookup table. **Not one of them references the price IDs.** But
the IDs live in the same file, so the bundler ships the lot. (It predates this audit by months —
we checked when each import was added.)

**Does it matter?** Price IDs aren't secrets in the payment provider's threat model, and our
server-side allowlist means only the three purchasable prices are accepted — **verified today: bogus
IDs, Enterprise IDs and invalid modes all rejected with 400.** So the real-world risk is low.

**But that's not the point.** We had originally downgraded that finding's severity from critical to
minor, and the stated reason was *"the IDs aren't exposed to the client."* That reason was false.
The conclusion happens to survive — because the fix rests on a server-side allowlist rather than on
obscurity — but **we reached the right answer through a wrong fact, and published the wrong fact as
evidence.**

Also verified today, since we were in there: **zero secret keys of any kind in the bundle.**

> **The audit needs auditing.** Ours produced two bad records — a half-fix marked complete, and a
> security claim that didn't hold. Both were found by re-checking work already marked green.

---

## What we changed

- Character counts computed in code, not claimed by the model — **120/120 exact across 12 verticals**
- An accuracy constraint on every generation, with visible placeholders instead of invented facts
- Our own brand name removed as the default customer brand
- Estimates explicitly labelled as estimates; volume figures forbidden
- A real upgrade button at the moment the free tier ends
- Server-side validation of required fields, so empty requests stop burning quota and tokens
- A server-side input length cap
- A server-side allowlist on checkout prices
- Security response headers; login redirects restricted to same-origin paths
- "Most Popular" removed from a plan that had never had a subscriber
- A promo-code field switched off until a real coupon exists, so it can't reject people mid-payment
- Per-generation cost tracking and an internal margin view

**Verified today alongside the above:** all 12 tools generate successfully; unauthenticated requests
are rejected on all 6 API routes; all 4 gated route groups redirect to login; the security headers
are present; robots.txt excludes the private areas; the sitemap contains 13 URLs with no gated paths
and no non-canonical hosts; unknown URLs return a real 404; the login redirect guard is present in
the deployed bundle; and every internal link on the homepage resolves.

**Still open, and we'd rather say so:**

- **Finding 6** — annual switching, needing a change on both our side and our payment provider's
- **Finding 5's second half** — the Generate button still enabled at the limit
- **A subscription-status sync gap** — our database records a status the payment provider disagrees
  with. Access is unaffected, but the same channel carries cancellation and payment-failure events,
  so we're treating it as urgent
- **A quota-period mismatch** — the allowance resets on the calendar month while billing renews on
  the signup anniversary, so a first billing period can contain two allowances
- **Two concurrency races** found by reading code, which need parallel load to reproduce properly

We're publishing the open list on purpose. A case study that only shows resolved bugs is a marketing
document.

---

## The method, in one list

1. **Build a fact table from code first.** What do you actually sell? Which features are real and
   which are waitlists? Everything else gets checked against this.
2. **Write a customer with specific numbers** before writing a single test case.
3. **Sign up for real.** Hit the free limit. Watch what your product does to a user it just stopped
   serving.
4. **Diff every output against its input.** Anything asserted that wasn't supplied is a defect.
5. **Measure every number the product states about itself.**
6. **Call your API the way your UI never would** — empty fields, huge fields, values the form can't
   send.
7. **Pay real money on the live account.** Test-mode payment config is not production payment config.
8. **Enumerate every path to each outcome and try all of them.**
9. **Ask what one generation costs and what the margin is at the plan limit.** "We can't tell" is a
   finding.
10. **Check your ads against the fact table.**
11. **Read every hardcoded default in your prompt templates**, and test the empty-optional path.
12. **Verify on production, not in the diff** — and prove the build you're testing is the build you
    shipped, using something deterministic, before you trust a single behavioural result.
13. **Verify probabilistic fixes probabilistically** — five runs, report the rate.
14. **Get a third data point before filing.** Two observations are enough to see a pattern and not
    enough to test it. We retracted one finding this way, and it saved a pointless deploy.
15. **Re-audit your own findings, not just your code.** Two of ours were wrong.

---

## Why we published this

An AI marketing tool that invents credentials for a yoga studio is not a quirky edge case. It's the
central risk of the whole category, and every product in it has some version of these bugs right
now.

We'd rather be the company that goes looking for them — and that tells you when its own audit got
something wrong.

---

*SHIJO.AI is an AI marketing platform: 12 tools for SEO, ads, email and social. Two are free
forever, no card required.*

---

### Internal — remove this section before posting

- [ ] Re-run the 12-vertical meta test and the fabrication scan immediately before posting; update
      "VERIFIED TODAY" figures if anything moved
- [ ] Re-run the three annual-switch paths; if the portal setting has been enabled, move Finding 6
      to "what we changed"
- [ ] Confirm Finding 5's second half is still unfixed, or move it
- [ ] Decide whether to publish before or after the price-ID bundle split and the
      subscription-status fix land
- [ ] No AI vendor named anywhere (brand policy — vendor disclosure belongs in the Privacy Policy
      sub-processor list, /security and /ai-compliance only). **Verified today: zero mentions on
      marketing pages; present only on /security and /ai-compliance, which is correct**
- [ ] SHIJO.AI used throughout; SHIRO Technologies LLC appears nowhere in customer-facing copy
- [ ] No open security finding described in enough detail to be actionable by a reader
