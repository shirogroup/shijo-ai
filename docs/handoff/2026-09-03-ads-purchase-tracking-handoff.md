# Handoff — 2026-09-03 · Ads + purchase tracking

Continuation of the 2026-09-02 ads-optimization session. Written at session end so the next session
starts from verified state, not memory. Next-session prompt: `docs/NEXT-SESSION-PROMPT.md`.
KB summary: `SHIJO_AI_KB.md` §68.

---

## 1. What actually shipped

**Commit `7753d91` — "fix(billing): track upgrade purchases from the Stripe portal path"**

Verified on the machine 2026-09-03:

```
local:       7753d91746301b0b72ccdd7cedfefb1270804f36
origin/main: 7753d91746301b0b72ccdd7cedfefb1270804f36
```

Identical. Vercel build completed and deployed (confirmed by Sri).

**State: pushed and live. NOT proven.** It has never fired in production.

### The bug

`app/api/stripe/create-checkout/route.ts` (~line 197): when the user already has a live subscription,
the code does **not** create a Checkout Session. It creates a **Billing Portal** session:

```ts
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${baseUrl}/dashboard/billing`,
  flow_data: {
    type: 'subscription_update_confirm',
    after_completion: {
      type: 'redirect',
      redirect: { return_url: `${baseUrl}/dashboard/billing?success=true&plan=${plan}` },
    },
  },
});
```

The user lands on `/dashboard/billing`, **never `/thank-you`**. `PurchaseTracker` lives on
`/thank-you`. So it never mounted, no `purchase` event ever hit the data layer, and every upgrade was
invisible to Google Ads and GA4.

**The GTM tag was correct the whole time. The routing was the bug.**

### The fix

**NEW `app/api/billing/verify-upgrade/route.ts`** — server-side GET, four gates:

1. `getSession()` returns a signed-in user who owns the `stripeCustomerId`
2. Stripe has an **active** subscription for that customer
3. `latest_invoice.status === 'paid'` **and** `amount_paid > 0`
4. Invoice age < 1 hour (`MAX_INVOICE_AGE_SECONDS = 3600`) — so a refresh next week cannot re-fire

Returns `{ verified: true, purchase: { transactionId: invoice.id, value: amount_paid / 100, currency, plan } }`.

Two deliberate design choices:

- **Asks Stripe directly, never the DB mirror.** D-36 recorded the DB saying `incomplete` while Stripe
  said `active`. The DB is not trusted for money truth.
- **`transaction_id` = the Stripe invoice ID.** Unique per billing event, so Google dedupes correctly
  even with conversion count set to `Every`.

**MODIFIED `app/dashboard/billing/page.tsx`** — added `useEffect` + `PurchaseTracker` imports,
`upgradePurchase` state, a `useEffect` that fetches `/api/billing/verify-upgrade` when
`?success=true`, and renders `{upgradePurchase && <PurchaseTracker purchase={upgradePurchase} />}`.

Untouched per session constraint: Stripe config, `app/layout.tsx`, `next.config.ts`, `app/register`,
`middleware.ts`, `db/`.

---

## 2. "Why does it show so many conversions?" — answered

Asked because Stripe only holds two test payments. Both systems are telling the truth.

| Conversion action | Count | Primary/Secondary | Value |
|---|---|---|---|
| Sign-up | 17 | Secondary | $1 fallback |
| Lead form - Submit | 10 | Secondary | $1 fallback |
| **Purchase** | **0** | **Primary** | — |

The count is **free signups and lead-form fills**, not sales. Nothing is double-counting.

The consequence matters more than the explanation: **both campaigns bid *Maximize conversions* toward
Purchase, which has never fired.** Neither campaign has ever had a real optimization signal. That is
the root cause of the drift to `flow ai` and the $56 of top-10 waste, not a separate problem.

---

## 3. "Separate landing page for the $39 one-off report?" — not yet

Verified in code 3 Sep:

- `lib/pricing-plans.ts` → `{ key: 'report', name: 'One-off Report', price: '$39', cadence: 'one time', cta: null }`,
  with the comment *"wired when the report route ships — see UNPROVEN in the notes"*
- `find app -type d -name "*report*"` → **no route exists**
- `isReportPurchasable()` returns `Boolean(STRIPE_PRICE_IDS.GEO_REPORT)`, reading
  `process.env.STRIPE_PRICE_GEO_REPORT ?? ''` — may be unset

**There is no checkout and no route. The $39 report cannot be bought.** A landing page pointed at it
would send paid clicks to a dead end — the same class of error as the retired Enterprise sitelink
(§51.1).

Correct order: (1) Stripe price + env var, (2) `/report` route + checkout + fulfilment, (3) landing
page, (4) add to campaign. Steps 3–4 are cheap; 1–2 are the real work and are not started.

**Opinion, flagged as opinion:** a $39 one-time offer is a better paid-search product than a $29/month
subscription — lower commitment, no account required, and it matches how people search for a one-off
audit. Worth building. Cannot be advertised before it exists.

---

## 4. Ahrefs — dropped, use free sources

Sri is on the **free Ahrefs plan** (`srikanth@shiroapps.com`). The dashboard shows an **Upgrade**
prompt; **Keywords Explorer is paid-gated**. The planned AEO/GEO keyword research did **not** happen
and should not be planned around.

Free sources to use instead:

- **Google Ads Keyword Planner** — free with the active account, and it is what Google bids against
- **Search terms report** — 833 terms already pulled; real demand, already paid for
- **Google Search Console** — if linked to Ads (unverified)
- **Ahrefs free Webmaster Tools** — Site Audit and Site Explorer organic keywords, but only for a
  *verified* site; may work for `shijo.ai` itself

---

## 5. Two mistakes made, recorded

1. **The GEO video was left on Asset Group 1** after the GEO asset group was created — recreating the
   exact video/message mismatch the new group existed to fix. Caught and removed. **Consequence:
   Asset Group 1 ad strength dropped Average → Poor.**
2. **Google auto-generated 4 false headlines** on the new GEO asset group, live before being caught:
   - *"Free Daily AI Visibility Scan"* — entitlements are 4/30/100 **per month**, not daily
   - *"Test Your GEO Rankings Today"* — the product produces no ranking
   - *"Boost Your ChatGPT Mentions"* — it **measures**, it does not boost

   All cleared and replaced by hand. **Google's auto-generated assets must be reviewed on every
   asset-group edit.** This account has a fabricated-claims history.

---

## 6. Blocked, needs Sri

- **Campaign settings panel hangs** on "Loading name / Loading summary" — ~15 attempts across 2 and
  3 Sep. The page itself displays "Turn off ad blockers". **Hypothesis, UNVERIFIED:** an ad-blocker
  extension breaks it. Sri to disable extensions for `ads.google.com`. This blocks turning **AI Max
  Final URL expansion OFF** (22 clicks, $6.13, 0 conversions — decision made, just unreachable).
- **Lead form asset deletion** — removing the `Lead form - Submit` conversion action does **not**
  persist; verified after a full reload. The live lead form asset ("See SHIJO.AI in Action", 416
  impr, 21 clicks, **$21.47**) regenerates it. Only fix is deleting the asset. **Export the leads CSV
  first** — deleting loses the leads.
- **Google "Confirm it's you" re-auth** fires on asset edits. Sri must complete it.
- **Six videos and nine images** — agreed 2 Sep, not delivered. Three subjects (SEO Meta Generator
  run, GEO five-engine scan, Post Caption Generator), each 16:9 and 9:16, 15–30s; three screenshots
  (tools grid, meta output, GEO result) at 1200×628, 1200×1200, 1200×1500. Real product screenshots
  only — no stock, no invented UI, no claim in frame that is not true of the shipped product.
- **AI-generated labels** on both existing videos — both confirmed AI-made, labels still unset.

---

## 7. Coupon status

| | |
|---|---|
| Qualifying spend | ≈ **$186.81** |
| Remaining to $500 | ≈ **$313.19** |
| Deadline | **16 Sep 2026** |
| Days left | 14 |
| Required run rate | ≈ **$22.40/day** |
| Daily cap | **$42/day** ($22 PMax + $20 Search) |

Billing resolved: **$112.23 credit**, "No upcoming payments", overdue diagnostic gone. **Do not make
another Ads payment.** Payments do not advance the coupon — only spend does.

Check cumulative spend ~9 Sep. If below ~$340, raise the Search budget or the deadline will be missed.

---

## 8. Reference IDs

| Item | Value |
|---|---|
| Production HEAD | `7753d91746301b0b72ccdd7cedfefb1270804f36` |
| Google Ads | 643-120-9303, `authuser=1` |
| Search campaign | `24185975752` |
| PMax campaign | `24045178067` |
| Asset Group 1 / GEO asset group | `6731761385` / `6744666927` |
| GTM | GTM-NGQVZ78Q, container 258715646 — **Version 11 "TAG Fixed" live** |
| Conversion ID / Purchase label | `18330533913` / `MDn1CIfbldIcEJmA16RE` |
| Sign-up label | `QJv5CJy6x9IcEJmA16RE` |
| Purchase conversion type ID | `7688514951` (label ownership UNVERIFIED) |
| GA4 | G-8SSXDRYL30 |
| Promotion | `3JAUN-W7UCQ-6JLK` — $500 for $500, by 16 Sep |
