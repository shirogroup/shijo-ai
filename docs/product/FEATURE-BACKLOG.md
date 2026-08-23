# SHIJO.AI — Feature Backlog

Single list of things that are **promised, half-built, or deliberately switched off**.

**The rule this list exists to enforce:** nothing on this page may be described as
shipped in marketing copy, ad assets, structured data, or product UI until its row
says LIVE. This project has already shipped fabricated claims three times — an ad
headline advertising "AI Search Visibility Tracking" (a waitlist), a Pricing
sitelink advertising an Enterprise plan that cannot be bought, and a "Most Popular"
badge on a plan with zero sales in its history. Each was caught after it was live.
Checking a claim against this file takes ten seconds.

Status: **BACKLOG** (not started) · **PARTIAL** (something exists, feature does not)
· **OFF** (built, deliberately disabled) · **LIVE**

---

## 1. AI Visibility Tracking (AEO) — **PARTIAL**

Track how often a brand is mentioned when people ask AI assistants about its
category, and what to change to improve it.

| | |
|---|---|
| What exists | `/dashboard/ai-visibility` renders "…coming soon" with a **Notify me** button posting to `/api/dashboard/ai-visibility-waitlist`. DB tables `ai_visibility` and `ai_simulations` exist in `db/schema.ts` and are unused. |
| What does not exist | Any tracking. No scanning, no scoring, no reporting. |
| Adjacent and **shipped** | **AI Overview Optimizer** — one of the 12 live tools. It advises on optimising content for AI answers. It does **not** track or monitor anything. These two are easy to conflate, and conflating them is how the false ad headline happened. |
| Prior incident | Advertised as a live feature in a Performance Max headline; corrected 2026-08-23. Also previously present in homepage metadata (KB §46). |
| Before building | `docs/product/2026-07-19-AI-Visibility-Tracking-Scoping.docx`, `-Cost-Model.xlsx`, `-Pricing-Strategy.docx` |
| Blocked on | Scoping decision + cost model sign-off. Every scan is metered API cost against an "unlimited"-flavoured promise — see the fair-use note in `lib/tools/usage.ts`. |
| Waitlist | Real. People are on it. They were told "we'll email you when it launches", so launching silently is not an option. |

**Do not claim:** tracking, monitoring, scanning, visibility scores, or brand-mention
reporting anywhere customer-facing.

---

## 2. Coupon / promotion codes — **OFF**

| | |
|---|---|
| What exists | Stripe Checkout supports it natively. Both checkout routes had `allow_promotion_codes: true`. |
| Why it is off | **Stripe has no coupons on this account** (verified in the dashboard, 2026-08-23). The field rendered, accepted input, and rejected every code — at the exact moment the customer had their card out. Set to `false` in both routes rather than leave a discount field nobody can use. |
| To turn on | 1. Create a coupon in Stripe → Product catalog → Coupons. 2. Create a promotion code against it. 3. Set `allow_promotion_codes: true` in `app/api/billing/checkout/route.ts` **and** `app/api/stripe/create-checkout/route.ts`. 4. Test the real code end-to-end before announcing it. |
| Worth deciding first | What the code is *for* — launch discount, win-back, partner/affiliate, annual nudge. A permanently-available code trains people to wait for it. |
| Related | Annual billing already offers 20% off Standard ($278/yr). That discount now has a working path to checkout (D-17) — it may be enough on its own. |

**Do not claim:** discounts, promo codes or offers until a real code exists and has
been tested.

---

## 3. Enterprise plan — **OFF**

Paused 2026-07-19. Not in `VALID_PLANS`, so self-serve checkout refuses it; the
pricing card reads "Coming Soon" with a Contact Us route. Price config zeroed
2026-08-23 so dead numbers cannot surface anywhere.

**Do not claim:** Enterprise plans, tiers, or "enterprise-ready" positioning while
the plan cannot be bought. (An ad headline and a Pricing sitelink both did; corrected 2026-08-23.)

---

## 4. Team collaboration — **BACKLOG**

Listed as a feature bullet on the Enterprise card, already correctly marked
"(coming soon)" inline. Keep that qualifier wherever it appears.

---

## Known deferred engineering work

| Item | Why it matters |
|---|---|
| Quota check-then-act race (D-12) | `checkToolAccess` reads, the model call runs, `recordToolUsage` writes. Concurrent requests all pass the same check, so plan limits are exceedable. Needs a transaction or atomic increment. |
| Daily-counter insert race (D-13) | Select-then-insert on `daily_limits`; the unique index rejects the second concurrent insert and the throw lands *after* the paid model call — the user loses a generation already billed for. |
| CSP | Only `Report-Only` is safe to ship first — the site loads GTM, gtag, Ahrefs and Stripe. Collect violations, then enforce. |
| Sandbox `CREDITS_*` price ids | Still present in the live `STRIPE_PRICE_IDS` constant, commented as sandbox. Not reachable via the allowlist, but they should not live in a live config. |

---

*Maintained alongside `docs/testing/2026-08-23-shijo-findings-register.md`.
Update the status column the day something ships — this file is only useful if it is true.*
