# Status for review — login checkout intent, Analytics tab, AI Visibility tab (2026-08-31)

Nothing in this document has been changed in code. Every line is either ✅ CONFIRMED by reading the
file named, or ❓ UNKNOWN and labelled as such. No fixes applied, no assumptions about what you want.

Repo state at the time of writing: `HEAD = origin/main = 8378e6b`, working tree has only the two
doc files from the previous pass (`SHIJO_AI_KB.md`, `docs/2026-08-30-verification-prompt-feedback.md`)
plus `docs/testing/Automated-Regression-Test-Suite.xlsx` which this session never touched.

---

## Finding 1 — "Choose Plus, then sign in" loses the plan. ✅ CONFIRMED, in code.

### What you actually did, and why the dashboard was correct

You signed in at `/login` with no `?plan=` on the URL. `LoginForm` sends a user with no plan intent to
`/dashboard`. **That is correct behaviour for that URL** — it is not the bug.

### Where the bug is

The intended returning-customer path is:

```
/pricing → Choose Plus → (logged out) → /register?plan=plus
         → "Already have an account? Sign in" → /login → sign in → Stripe, Plus $79
```

It breaks at the third hop.

- ✅ `components/auth/LoginForm.tsx` lines 33–41 **already handles** `?plan=`: it calls
  `parsePlanIntent(searchParams.get('plan'))` and, if present, `startCheckout(planIntent)` — going
  straight to Stripe, with a fallback to `/dashboard/billing?canceled=1&plan=…` if Stripe cannot start.
  So `/login?plan=plus` works today.
- ✅ `components/auth/LoginForm.tsx` lines 138–143 — its **"Sign up"** link forwards the intent:
  `/register?plan=${plan}`. The login → register direction is correct.
- ❌ `app/register/page.tsx` line 45 — the **"Sign in"** link is a bare
  `<Link href="/login">`. It drops `?plan=plus`. The register → login direction loses the intent.

The asymmetry is one link, in one direction. Everything downstream of it already works.

### Why I have not fixed it

`app/register/page.tsx` is on the **do-not-touch / ads-freeze list** in the 2026-08-30 handoff §4, and
`RegisterForm.tsx`'s own header comment records that the Suspense boundary was put inside the
component *specifically* to avoid editing that page. So this needs your call, not mine.

### ❓ UNKNOWN

- Whether `/login?plan=plus` end-to-end actually opens Stripe on the live site. It is **code-verified
  only** — testing it requires typing a password, which I will not do. One manual pass closes it.
- Whether the register page is still frozen, or whether the freeze was scoped to a period that has passed.

---

## Finding 2 — Analytics tab is a placeholder. ✅ CONFIRMED, and it is not "blank" by accident.

`app/dashboard/analytics/page.tsx` is 21 lines. It renders an icon, the heading "Analytics", the line
*"Track your tool usage, content performance, and generation trends. Analytics dashboard coming soon."*
and a "Browse AI Tools" button. There is no data fetch, no chart, no API route. It renders exactly what
it was written to render.

It is one of **five** placeholder pages under `/dashboard`:

| Page | State |
|---|---|
| `/dashboard/analytics` | placeholder, "coming soon" |
| `/dashboard/keywords` | placeholder, "coming soon" |
| `/dashboard/content` | placeholder, "coming soon" |
| `/dashboard/ai-visibility` | placeholder + waitlist button (see Finding 3) |
| `/dashboard/settings` | **real** page (252 lines); two *sections* inside it say "coming soon" |

All five sit in the sidebar (`components/dashboard/Sidebar.tsx` lines 23–32) with no visual
distinction from the working tabs, so a paying user cannot tell which are real until they click.

### The data for a real Analytics page already exists

- ✅ `db/schema.ts:123` `usage_logs` — `userId`, `feature`, `action`, `creditsUsed`, `apiCostUsd`,
  `metadata` (holds `inputTokens` / `outputTokens`), `createdAt`, indexed on
  `(user_id, feature, created_at)`.
- ✅ It is genuinely written on every generation — `lib/tools/usage.ts:317` `db.insert(usageLogs)`.
- ✅ The aggregation SQL already exists and is proven, in `app/api/admin/usage/route.ts` (generations
  per day, cost, token totals) — but it is **admin-only**, not per-user.

So a per-user Analytics page is a query and a chart over data already being collected, not a new
pipeline. ❓ UNKNOWN: how many rows this user actually has, and whether the chart would look empty for
a new account — not checked, and I will not query the live DB without your say-so.

Note `lib/analytics.ts` is unrelated — it is the Google Analytics gtag helper, not product analytics.

---

## Finding 3 — AI Visibility tab says "coming soon" for a feature that is built and being sold. ⚠️ This is the serious one.

### What the tab does today ✅ CONFIRMED

`app/dashboard/ai-visibility/page.tsx` renders *"Track how often your brand gets mentioned when people
ask AI tools questions about your category — **coming soon**"* with a **"Notify me when this launches"**
button that POSTs to `/api/dashboard/ai-visibility-waitlist`.

### What actually exists ✅ CONFIRMED

- `app/geo/page.tsx` + `app/geo/GeoChecker.tsx` (418 lines) — the public checker at `/geo`, live.
- `app/dashboard/tools/geo-visibility-checker/page.tsx` — a static route that **redirects to `/geo`**.
- `app/api/geo/scan/route.ts` — runs the scan, persists to `geo_scans` / `geo_scan_cells`, and stamps
  `userId` for signed-in callers (`route.ts:206`).
- `lib/geo/entitlements.ts` — per-plan monthly scan allowances, enforced:

  ```
  free 0 | pro(Standard) 4 | plus 30 | growth(Pro) 100 | enterprise 100
  ```

- `app/admin/geo-health/*` — admin console for vendor pings, budget, scan history, test scans.

So the feature is real, scans are saved per user, and the quota is enforced. **The dashboard tab that
is named after it tells a paying customer it does not exist yet, and offers to add them to a waitlist
for it.**

### Sold on /pricing but not present in any user-facing UI ✅ CONFIRMED by repo-wide grep

`lib/geo/entitlements.ts` defines four flags. Three of them are **referenced nowhere outside that
file** — not in `app/`, not in `components/`:

| Sold as | Where it is sold | Implementation state |
|---|---|---|
| "Scan history" | `/pricing` Standard $29 | ❌ No user-facing history page or API. Admin-only. |
| "30 saved AI visibility scans per month" | `/pricing` Plus $79 | ⚠️ Half. Scans **are** saved with `userId` and the count **is** enforced — but the user has no way to see them. |
| "One-click into the FAQ Generator and AI Overview Optimizer" | `/pricing` Plus $79 | ❌ `toolCta` flag exists, used nowhere. |
| "CSV export, PDF download" | `/pricing` Pro $199 **and** `components/landing/Pricing.tsx:92` | ❌ `csvExport` / `pdfDownload` flags exist, used nowhere. |
| "5 brands" | `/pricing` Pro $199 | ❌ `brands` field, commented in the source as *"Informational for now."* Not enforced; no brand concept in the UI. |

`app/geo/GeoChecker.tsx` contains **no** auth, entitlement, history, export or quota-display branches
at all — it is purely the public one-scan checker.

**Consequence, stated plainly:** someone can pay $199/month today for CSV export and PDF download that
do not exist, and $29/month for scan history that does not exist. This is the same class of problem as
the fabricated trust badges and the unbuilt "AI visibility tracking" metadata already recorded in the
project instructions, and it is currently live.

---

## What I have NOT done

- No code changed. No commits. Nothing pushed.
- Did not touch `app/register/page.tsx` — frozen per handoff §4.
- Did not query the live database.
- Did not start the $39 GEO report, Gemini, or the Sonar replacement.
- Did not decide anything about pricing copy, which is a commercial call.

---

## ADDENDUM (same day, after your four decisions) — what changed

Everything above was written **before** any code was touched, and its "What I have NOT done" section
is accurate as of that moment only. Your decisions were: lift the freeze for one line; fix the copy
now and build the features after; point AI Visibility at `/geo`; hide the unbuilt tabs.

### Edited locally — NOT committed, NOT pushed at time of writing

| File | Change |
|---|---|
| `components/auth/RegisterSignInLink.tsx` | **NEW.** The "Already have an account? Sign in" link, as a client component that carries `?plan=` to `/login`, with its own `<Suspense>` boundary. |
| `app/register/page.tsx` | Freeze lifted (your call). Import added; the bare `<Link href="/login">` replaced with `<RegisterSignInLink />`. Nothing else on the page touched. |
| `lib/pricing-plans.ts` | Removed "Scan history" (Standard), "One-click into the FAQ Generator and AI Overview Optimizer" (Plus), "CSV and PDF export" and "5 brands" (Pro). Pro `geo` → "100 AI visibility scans per month — the highest allowance". Pro tagline → "The highest AI visibility scan allowance." Dropped the word "saved" from the Standard/Plus scan counts. |
| `components/landing/Pricing.tsx` | "5 brands, CSV + PDF export" → "100 AI visibility scans/month". **Prices untouched** — but this is ad-facing homepage copy, so it is called out here deliberately. |
| `components/dashboard/Sidebar.tsx` | Keywords, Content and Analytics removed from the nav (their routes still resolve if visited directly — hidden, not deleted). AI Visibility now points at `/geo`. Unused icon imports removed. |
| `app/dashboard/ai-visibility/page.tsx` | Replaced the "coming soon" waitlist screen with `redirect('/geo')`, matching the existing `geo-visibility-checker` pattern. The waitlist API route is left in place because it holds real signups. |

### Why the Suspense boundary is inside `RegisterSignInLink.tsx`

Same reason as `RegisterForm`. `useSearchParams()` opts a component out of static prerendering and
`next build` hard-fails without a boundary — that is what broke `7dad555`. Putting it in the component
means `app/register/page.tsx` stays a static server component. The alternative — taking `searchParams`
as a page prop — would have made the whole `/register` route dynamic.

### Verification actually performed ⚠️ READ THIS BEFORE PUSHING

- ✅ `tsc --noEmit` → **0 errors**.
- ❌ `next build` — **NOT completed.** Per §60.7 this is the only check that matters here, and it could
  not be run. Details in §62.2.

**Reasoned prerender risk (an argument, NOT a verification):** the only new client-hook usage is
`useSearchParams()` inside `RegisterSignInLink`, wrapped in its own `<Suspense>` — the exact pattern
that fixed `/register` in `83ec917` and that `/login` already uses at page level. The ai-visibility
page is now a server component calling `redirect()` only, identical to the `geo-visibility-checker`
route that already builds. `Sidebar` is already `'use client'` and gained no hooks. The remaining two
files are data and JSX string changes. Low risk — but **run the build before pushing.**
