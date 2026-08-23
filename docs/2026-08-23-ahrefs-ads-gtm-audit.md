# SHIJO.AI — Ahrefs + Google Ads/GTM audit

**Date:** 2026-08-23 · **Mode:** read-only (nothing changed in Google Ads or Tag Manager)
**Full detail:** `SHIJO_AI_KB.md` §47–§49

---

## Headline: do not run the paid end-to-end test yet

The **Purchase** goal reads *Misconfigured* because it has never received a hit, and it cannot,
because nothing exists to fire it at **either** layer:

- GTM container `GTM-NGQVZ78Q` holds exactly 3 tags — Conversion Linker, Google Ads Base Tag,
  and Google Ads Sign Up Conversion. **No purchase tag.**
- The app never emits a purchase event. A repo-wide grep for `dataLayer` / `gtag` / `send_to`
  finds one push: `components/auth/RegisterForm.tsx` → `{ event: 'sign_up_complete' }`.

A real payment made today produces no conversion signal.

---

## Part one — conversion tracking

| System | Identifier |
|---|---|
| Google Ads account | 643-120-9303 "SHIRO Technologies LLC" |
| Conversion ID | AW-18330533913 |
| Google tag ID | GT-K4CR5NFX |
| GTM container | GTM-NGQVZ78Q (account "Shijo.ai", **Chrome authuser=1**) |
| Live campaign | "CamShijo AI Landing Page" — Performance Max, $10/day, Eligible |

### Conversion actions

| Action | Source | Tracking | Optimization | Count | Window |
|---|---|---|---|---|---|
| **Purchase** | Website | **Inactive** | Primary | Every | 30 days |
| Lead form - Submit | Google hosted | Active | Primary | One | 1 day |
| Sign-up | Website | Active | Primary | One | 90 days |
| Local actions - Directions | Google hosted | No recent conv. | Primary | Every | 30 days |

**All four are Primary.** Performance Max has no keywords to steer it — the conversion signal is
nearly all it has, and that signal currently says a free signup equals a paid subscription. The
signup endpoint was the target of the 373,147-account abuse run (KB §44).
`Local actions - Directions` is a physical-storefront goal, meaningless for a SaaS.

### Value is the $1 fallback, not revenue

Last 30 days (Jul 24 – Aug 22): **4.00 conversions, conv. value 4.00, 19.05% conv. rate,
$2.45/conv** — i.e. exactly $1.00 each, which is the Purchase action's fallback
("use different values; if there's no value, use $1"). Enhanced Conversions: **not configured**.

### Nothing to deduplicate on

Checkout returns to `/dashboard/billing?success=true&plan=<plan>`
(`app/api/stripe/create-checkout/route.ts:138`). No value, no currency, no session id —
`success_url` omits `{CHECKOUT_SESSION_ID}`. With Purchase set to *Count: Every*, a refresh or a
bookmarked success URL books another conversion.

Two checkout routes exist and disagree: `app/api/billing/checkout/route.ts:96` omits `&plan=`.

### Container diagnostics: Urgent

1. **Additional domains detected** — the tag fires on domains not in its configuration, almost
   certainly apex `shijo.ai` (307s to www) and Vercel preview URLs. Google: "could impact your
   tag durability and conversion measurement."
2. **One administrator** — single point of lockout.

### Account-switching trap

At Chrome's default Google account, Tag Manager shows account **SHIROAPPS** with only
`aithumbnailgen` / `GTM-T6P4KDWK`. The SHIJO container is at **`authuser=1`**
(`srikanth@shirotechnologies.com`). Nothing is missing — check the account picker first.

---

## Part two — search & backlinks

Ahrefs Webmaster Tools, free tier. Site Explorer is verified for **`www.shijo.ai`** only; the
apex returns "Domain not verified".

### Backlink profile: 129 referring domains, all SPAM-labelled

130 backlinks / 129 domains, **93.8% nofollow**, every link under UR 10, every visible domain
carrying Ahrefs' `SPAM` flag. The 8 **dofollow** domains:

| Domain | DR | First seen |
|---|---|---|
| hotonlinegaming.com | 47 | 22 Aug 2026 |
| betulcrime.com | 39 | 22 Aug 2026 |
| plrdownloadshub.com | 6 | 21 Aug 2026 |
| wecelebrities.com | 5 | 3 Aug 2026 |
| bestnz-poker-casinoslot.com | 1.5 | 6 Aug 2026 |
| masihnyata.com | 0 | 22 Aug 2026 |
| **shiroapps.com** | 0 | 6 Jul 2026 |
| sahammurah.com | 0 | 13 Aug 2026 |

Our own `shiroapps.com` is SPAM-labelled at DR 0.

Four of the eight appeared 21–22 Aug — the same window as the signup flood. **Correlation, not
proven causation**; both are consistent with a new domain being found by automated spam networks.
No action taken: Google generally ignores links like these and careless disavowal has downside.

### No organic or AI footprint

DR 1.5 · Ahrefs Rank 49,840,591 · **0 organic keywords · 0 organic traffic** · 12 pages indexed
(11× 200, 1× 3XX) · **0 AI responses** across AI Overviews, ChatGPT, AI Mode, Gemini, Perplexity
and Copilot.

There is no keyword intelligence in Ahrefs to feed the ads account, because there is no footprint
yet. Keywords Explorer is gated on the free tier.

> The homepage's structured data advertises "AI Overview / AI search optimization" as a feature
> while the site appears in no AI answer engine. Square that before it reaches ad copy.

### Audit errors all trace to one page

| Issue | Affected URLs |
|---|---|
| H1 tag missing or empty (2) | `/login`, `/login?redirect=%2Fdashboard` |
| Low word count (2) | same pair (4 content words each) |
| Duplicate pages without canonical (2) | same pair |

The `noindex` on `/login` written locally clears all three — once pushed.

"Indexable page not in sitemap (10)" is largely a stale-crawl artifact: 8 of the 10 *are* in
`app/sitemap.ts`, but the crawl compared www URLs against a sitemap still listing the apex host.
That mismatch is already fixed and live.

### Live 404 in the social card — fixed locally

`<meta name="twitter:image">` pointed at `/twitter-image.png`, which returns **HTTP 404**. No such
file in `public/`, no file-convention counterpart. The layout's correct twitter block never
applied because `app/page.tsx` calls `generatePageMetadata('home')` and **a page's own `twitter`
block replaces the layout's** — same non-merging behaviour already documented for `openGraph`.
Repointed at `/brand/shijo-logo-landscape-1200x300.png`.

### Correction: `offerCount` is NOT live

Earlier notes recorded it as fixed. It is present in `app/page.tsx` locally but **absent from HEAD
and absent from the live HTML** — verified by fetching the homepage with a cache-buster and
parsing the JSON-LD. `highPrice: '199'` *is* live; it made the commit, `offerCount` did not. The
rich-results validation error still stands on the live site.

---

## Do these in order

**1. Push what's already written** (13 files, none live)

```bash
rm -f .git/index.lock
git config core.autocrlf true
git status --short              # expect ~13 files
git add -A
git commit -m "SEO: meta descriptions, offerCount, /login noindex, fix twitter:image 404"
git push origin main
```

`core.autocrlf true` collapses 34 CRLF-only files out of the diff. Without it, `git add -A`
commits ~12,000 lines of line-ending noise across files nobody edited, including `middleware.ts`,
`lib/auth.ts` and the Stripe webhook handler.

**2. Emit a purchase event** — add `{CHECKOUT_SESSION_ID}` to `success_url`, verify the session
server-side on the billing page, push once:

```js
dataLayer.push({ event: 'purchase', value, currency: 'USD', transaction_id: sessionId })
```

**3. Add the GTM tag, then fix the goal hierarchy**
- GTM: *Google Ads Conversion Tracking* tag on the Purchase conversion ID + label, **Custom Event**
  trigger `purchase`, value/currency/transaction_id from dataLayer variables. Preview before submit.
- Ads: Sign-up and Lead form → **Secondary**; Purchase stays **Primary**; Purchase count → **One**;
  remove *Local actions - Directions*; configure Enhanced Conversions.

**4. Then run the paid end-to-end test.** Also exercises the 22 Aug signup spam fix, which has
still never been hit by a real registration — expect the constant subject
"Welcome to SHIJO.AI — Your 2 free AI tools are ready!" and no second email.

**5. Re-run the Ahrefs crawl** and compare — the current audit predates every fix.
