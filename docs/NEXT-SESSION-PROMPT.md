# Next session prompt — written 2026-09-03 (REVENUE-FIRST)

**State in one line:** the app has **zero paying customers** after $186.81 of ad spend, and the
reason is not the ads account — **paying $29 makes the GEO product 7.5× worse than free** (KB §69).
Fix the offer before spending another dollar on traffic.

Read first: `SHIJO_AI_KB.md` **§69** (revenue blocker), then **§68** (ads + tracking state), then
`docs/handoff/2026-09-03-ads-purchase-tracking-handoff.md`.

---

## The one number that matters

**27 free signups → 0 paid conversions.** Stripe holds only Sri's two test payments. Top of funnel
works; monetisation does not. **More traffic multiplies a zero.**

## The finding

| Plan | GEO scans/month | What $29 adds vs free |
|---|---|---|
| Free / anonymous | **≈30** (1/day, full five-engine scan, no teaser) | — |
| **Standard $29** | **4** | nothing — `csvExport`, `pdfDownload`, `toolCta` all `false`, same as free |
| Plus $79 | 30 | matches what free already gave |
| Pro $199 | 100 | |

A customer must pay **$79 to get back to what they had for free**. And the ads are currently pushing
the GEO/AI-visibility angle — driving paid traffic at the part of the product whose free tier beats
its paid tier. No keyword, bid, budget or audience signal can fix that.

---

## Paste this to start the session

> Continue SHIJO.AI. **The goal is revenue, not ad-account hygiene and not the $500 coupon.**
> Read `SHIJO_AI_KB.md` §69 then §68, and `docs/handoff/2026-09-03-ads-purchase-tracking-handoff.md`.
> They are current as of 3 Sep and verified against code.
>
> Context: 27 free signups, 0 paying customers, $186.81 spent. §69 found that paying $29 gives 4 GEO
> scans/month while free gives ~30 — the offer talks people out of buying. That is the blocker, not
> targeting.
>
> Standing constraints, unchanged:
> - Ads freeze on `/ai-marketing-tools` and `/lp`. The Hero stays.
> - Registry stays 12 tools.
> - Do not touch `app/layout.tsx`, `next.config.ts`, `app/register`, `middleware.ts`, `db/`.
> - **Ask before any auth/session/credential change**, and before changing live Stripe prices.
> - Show me anything that changes the live Ads account **before** saving it.
> - No fabricated claims. If something is unverified, say UNVERIFIED.
> - Never say "done" without checking local HEAD vs `origin/main`. Local edit ≠ shipped.
> - SHIJO.AI is the public brand; SHIRO Technologies LLC is legal-only. Do not name the AI vendor in
>   public copy.
>
> Work in this order:
>
> 1. **Fix the GEO offer ladder.** Read §69.5 — four options are already worked out. Read
>    `lib/geo/budget.ts` first so any new scan allowance is costed against five paid APIs per scan,
>    then give me a recommendation with the actual per-customer API cost at the number you propose.
>    Do not change `lib/geo/entitlements.ts` until I pick one. Do not "fix" this by editing marketing
>    copy — the copy is accurate, the offer is wrong.
> 2. **Scope the $39 one-off report.** It is `cta: null` with no route (§68.5), so it cannot be
>    bought — and it is the best paid-search product here: one-time payment, no account, matches how
>    people search for a one-off audit. The scan engine already works. Tell me exactly what is needed
>    (Stripe price, `STRIPE_PRICE_GEO_REPORT`, `/report` route, checkout, email delivery), what you
>    can build without touching anything I have frozen, and how long. Then build it if I say go.
> 3. **Prove the Purchase conversion fires.** Commit `7753d91` is live but has never fired. I will
>    make a real upgrade payment; confirm Google Ads records Purchase **exactly once** with the real
>    value, `currency = USD`, and a `transaction_id` starting `in_`. Until this works, Google is
>    optimising toward free signups — actively buying non-payers.
> 4. **Only after 1–3:** ads work. Audience signal on PMax (custom segment from `meta description
>    generator`, `ai seo tools`, `keyword research tool`), AI Max Final URL expansion OFF on Search
>    campaign 24185975752 (22 clicks, $6.13, 0 conversions), Enhanced Conversions on Purchase, rename
>    the `CamShijo AI Landing Page` typo.
> 5. **Keyword economics, free sources only.** I am on the free Ahrefs plan — Keywords Explorer is
>    paid, do not plan around it. Use Google Ads Keyword Planner, the 833-term search terms report,
>    and `docs/marketing/2026-08-23-keyword-clusters.csv`. Current keywords are head terms bidding
>    $10–66 against a $29/mo product; that math cannot close. Give me an ad-group structure with real
>    bid estimates and a CAC-vs-LTV calculation, not a keyword dump.
>
> Do not optimise for the $500 coupon. It is real money but it is a byproduct of spend worth making.
> Burning ~$313 to unlock $500 of credit on a funnel converting at 0% just buys more of the same.
>
> End the session by updating `SHIJO_AI_KB.md` and `docs/handoff/` with what actually changed.

---

## Decisions Sri needs to make (nothing can ship without these)

| Decision | Why it blocks |
|---|---|
| **Which GEO offer fix** (§69.5: raise Standard's cap / make free a teaser / differentiate on export+history instead of volume / lead with the $39 report) | Every other revenue action is downstream of this. |
| **Build the $39 report route?** | Best paid-search product available, and it matches the pay-per-activity thesis. Currently unpurchasable. |
| **Is the public checker a marketing asset or a leak?** | It is the full product, free, daily, forever. That is a defensible top-of-funnel choice *or* the reason nobody pays — but it cannot be both by accident. |

## Sri's to-dos before or during the session

| Item | Why |
|---|---|
| One real upgrade payment | Nothing about tracking can be trusted until Purchase fires once. |
| Disable ad blockers for `ads.google.com` | Campaign settings panel has hung ~15 times over two days; the page itself says "Turn off ad blockers". |
| Export the leads CSV | Deleting the lead form asset is the only way to stop the `Submit lead form` "Misconfigured" badge regenerating — and deleting loses the leads. |
| Complete "Confirm it's you" re-auth | Fires on every asset-group save; the session cannot do it. |
| AI-generated labels on both videos | Both confirmed AI-made; Google requires the label. |

## Hard "do nots"

- **Do not build a landing page for the $39 report until the route exists.** `cta: null`, no route —
  paid clicks would hit a dead end (§68.5).
- **Do not fix §69 by rewriting pricing copy.** The copy accurately describes a broken offer.
- **Do not trust Google's auto-generated ad assets.** It generated four false headlines on 2 Sep that
  went live before being caught (§68.8).
- **Do not make another Google Ads payment.** The account carries credit; the coupon counts *spend*,
  not payments.
