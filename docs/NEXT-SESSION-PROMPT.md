# Next session prompt — written 2026-09-03 (REVENUE-FIRST)

**State in one line:** the app has **zero paying customers** after $186.81 of ad spend, because
**paid GEO has no features** — a customer's $29 changes one number in a quota check and nothing else
(KB §70). Build something worth buying before spending another dollar on traffic.

**DECIDED 3 Sep:** the free daily scan is a **marketing asset** and stays. So paid cannot be "more
scans" — it has to be a different product: free answers *where do I stand today*, paid answers *am I
improving, across my brands, with something I can send a client.*

Read first: `SHIJO_AI_KB.md` **§70** (the decision + what to build), then **§69** (how the offer
inverted), then **§68** (ads + tracking state), then
`docs/handoff/2026-09-03-ads-purchase-tracking-handoff.md`.

---

## The one number that matters

**27 free signups → 0 paid conversions.** Stripe holds only Sri's two test payments. Top of funnel
works; monetisation does not. **More traffic multiplies a zero.**

## The finding

**Paid GEO has zero features.** `csvExport`, `pdfDownload` and `toolCta` are declared in
`GeoEntitlement` and **read nowhere in the codebase**. `entitlementFor()` has one caller, and the
only field ever read is `monthlyScans`.

**A paying customer can never see their own scans again.** `app/geo/` is three files. Every scan IS
persisted to `geoScans` with userId, score, band and timestamp — but that table is read back only by
admin routes and the quota counter. No history, no trend, no saved brand, no re-scan, no export.

**And the cap defends nothing.** At `ENGINE_COST_ESTIMATE_USD` × `MAX_PROMPTS = 8`, a scan costs
**$0.28** (a deliberate over-estimate; internal ceiling only, never a customer-facing price).

| Standard $29 allowance | COGS/month | Margin |
|---|---|---|
| **4 scans (today)** | **$1.12** | **96%** |
| 30 scans | $8.40 | 71% |
| 100 scans | $28.00 | 3% |

The 4/month cap protects **$1.12** on a $29 product while free gives ~30. It is not defending
margin — it is costing every sale.

**Risk created by the free-asset decision:** `GEO_DAILY_BUDGET_USD` defaults to **$25/day** ≈ 89
scans account-wide, and `checkGuards` runs for everyone — `skipIpCap` skips only the per-IP cap, not
the budget. A busy free day can 429 **paying customers**. Not yet observed; check before scaling spend.

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
> 1. **Build the smallest purchasable paid GEO product.** §70 is the brief. The free daily scan
>    stays — it is a marketing asset, that is decided. So paid must be *the record*, not more scans:
>    scan history, score-over-time, and CSV/PDF export, scoped to the signed-in user. The expensive
>    half already works — five-engine fan-out, scoring and persistence — and `geoScans` has been
>    accumulating real rows the whole time with `userId` on them. What is missing is a read path:
>    one `/dashboard/geo` page, one API route selecting `geoScans` by `userId`, a trend chart, export.
>    Scope it, show me the plan, then build it if I say go.
> 2. **Raise the Standard GEO cap in the same change, not before it.** 4/month protects $1.12 of COGS
>    while free gives ~30 — the pricing page currently argues against buying. 30/month costs $8.40
>    and keeps 71% margin. **Do not ship the cap change alone** — it removes the embarrassment without
>    adding a reason to buy. And check `lib/geo/budget.ts`: `GEO_DAILY_BUDGET_USD` defaults to $25/day
>    (~89 scans) and applies to paying users too, so tell me whether free traffic can starve paying
>    customers before we scale ads.
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

## Decided — do not reopen

| Decision | Made |
|---|---|
| **The free daily scan is a marketing asset and stays.** | 3 Sep. Closes "make free a teaser". Paid must differentiate on capability, not volume. |

## Still open for Sri

| Decision | Why it blocks |
|---|---|
| **Approve the paid-GEO build** (history + trend + export, and the Standard cap moving to ~30) | It is the only thing that makes the $29 plan purchasable. Nothing downstream converts without it. |
| **Where Plus $79 moves** once Standard is at 30 | Plus is 30 today; if Standard matches it the ladder collapses. Suggested: Plus climbs on brands + scheduled re-scans/alerts. |
| **Build the $39 report route?** | Best paid-search product available and it matches the pay-per-activity thesis. Currently `cta: null`, unpurchasable. |

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
