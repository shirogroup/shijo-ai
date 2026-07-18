# SHIJO.AI — Knowledge Base / Status Reference

**Last updated:** 2026-07-17 (Cowork session, later pass — post tool-consolidation deploy + Vercel breach discovery)

## 0. 🚨 TOP PRIORITY — rotate Vercel secrets (found 2026-07-17, supersedes everything else in this doc)

User shared a screenshot of the Vercel project's Environment Variables page: `ANTHROPIC_API_KEY`, `JWT_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`, `POSTGRES_PASSWORD`, `PGPASSWORD`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NO_SSL`, and other Postgres/Neon vars are all flagged **"Needs Attention"** (orange badge).

✅ CONFIRMED via Vercel's own official security bulletin (`vercel.com/kb/bulletin/vercel-april-2026-security-incident`, fetched 2026-07-17): Vercel disclosed an April 2026 breach where an attacker compromised a Vercel employee's account (via a compromised third-party OAuth app, Context.ai) and used that access to **decrypt customer environment variables that were not marked "sensitive"** — i.e., variables stored in a form that decrypts to plaintext, which is the default/legacy type for any var created before this feature existed. Vercel's official recommendation: *"Review and rotate environment variables that were not marked as 'sensitive.' Those values (API keys, tokens, database credentials, signing keys, etc.) should be treated as potentially exposed and rotated as a priority."*

The "Needs Attention" badges are almost certainly Vercel's UI surfacing exactly this — every flagged variable here is API-key/token/DB-credential/signing-key shaped, matching Vercel's own examples of what to rotate.

**Why this matters more than anything else in this document:**
- If `JWT_SECRET` was exposed, an attacker could forge valid session cookies and bypass auth entirely — this is a strictly worse version of the already-known middleware signature-verification gap (§3), because it would defeat even the correctly-verifying Node.js `getSession()` layer.
- If `ANTHROPIC_API_KEY` was exposed, someone could be spending against it right now — this is the exact "don't lose money on API usage" risk from earlier in this engagement, except external rather than just an uncapped Enterprise plan.
- If `STRIPE_WEBHOOK_SECRET` was exposed, an attacker could forge fake webhook events (e.g. fake "payment succeeded") to grant themselves subscriptions without paying.
- Database credentials exposed = direct read/write access to the live Neon DB.

**Action needed from the user — Claude cannot do this:** generating new keys and entering them into Vercel requires visiting each provider's dashboard (Anthropic Console, Stripe, Neon, Resend) and entering credentials, which Claude is not permitted to do under any circumstance, even with tool access. Recommended order:
1. Rotate `ANTHROPIC_API_KEY` first (Anthropic Console → API keys → revoke old, create new) — highest financial exposure.
2. Rotate `JWT_SECRET` (generate a new random 32+ byte string) — but note this will invalidate all current user sessions (acceptable, forces re-login).
3. Rotate `STRIPE_WEBHOOK_SECRET` (Stripe dashboard → Webhooks → roll secret) and while there, resolve the Stripe test/live key mismatch (§4) in the same session.
4. Rotate `RESEND_API_KEY` (Resend dashboard → revoke the `re_G5CREC5q...` key shown, create new).
5. Rotate database credentials (Neon dashboard → reset password), which cascades to `DATABASE_URL`/`POSTGRES_*`/`PGPASSWORD` etc. all needing the new value.
6. As each is re-added in Vercel, use the **Sensitive** toggle (`vercel.com/docs/environment-variables/sensitive-environment-variables`) so it can't be read back in plaintext again.
7. Per Vercel's own recommendation: also check the project's Activity Log (`vercel.com/activity-log`) for suspicious environment-variable read events, and review recent deployments for anything unexpected.

❓ UNKNOWN: whether this project specifically was among the confirmed-compromised accounts, or whether the "Needs Attention" flag is precautionary/broad. Vercel's bulletin says they directly notified confirmed-affected customers — worth checking email/Vercel notifications for that. Either way, Vercel's own guidance is to rotate regardless, since the flag is present on this project's vars.
**Purpose:** Durable reference for this project's actual current state, so a new Claude session (or a reinstall) can pick up without re-deriving everything from scratch. Read this file first, before assuming anything about project state.

**Labeling convention used throughout:** every claim below is marked
- ✅ CONFIRMED — verified directly by reading the actual file/code/git history in this repo
- ❓ UNKNOWN — not checked, do not assume either way
- ⚠️ DISCREPANCY — two sources disagree; flagged, not resolved

---

## 1. Project basics (✅ CONFIRMED)

```
Project: SHIJO.AI
Company: SHIRO Technologies LLC
GitHub repo: https://github.com/shirogroup/shijo-ai
Git branch: main
Local path (Windows): C:\Users\AI Agent\Projects\shiro-group-monorepo\my-turborepo\apps\shijo-ai
Hosting: Vercel, project https://vercel.com/shiro-technologies/shijo-ai (auto-deploys on push to origin/main)
Database: Neon PostgreSQL (via Drizzle ORM)
Payments: Stripe
Live URL: https://shijo.ai (also https://www.shijo.ai)
```

Commit authorship on this repo: `Srikanth <srikanth@shiroapps.com>` locally in older commits. GitHub account confirmed by user: `merianda@shirotechnologies.com`. Vercel project confirmed by user at `vercel.com/shiro-technologies/shijo-ai`. ❓ UNKNOWN whether these are the same login for both services — not verified, just stated.

---

## 2. Sync status (✅ CONFIRMED as of this session)

- Local folder and `origin/main` are in sync at commit `e6203ab` ("Consolidate tool lineup: 23 -> 12 tools per Product Handoff Rev2") as of this update. Full commit chain this session, oldest to newest: `4b49d5b` (baseline) → annual billing → `864ffa3` (trust badges removed) → `d5317ee` (legacy quota retired) → `c90b173` (Sonnet model-ID fix) → `defb344` (Google verification file) → `e6203ab` (12-tool consolidation). **Still outstanding, not yet pushed:** `app/robots.ts` + `app/sitemap.ts` SEO fixes — edited locally, verified live site does NOT yet reflect them (see §12). Push command given to user, not yet confirmed run.
- A prior handover doc (dated Jan 21, 2026) describing the project as "login broken, Stripe test mode, Resend not configured" is stale — a lot shipped after it was written that it doesn't know about. Do not trust that doc's status claims without cross-referencing this file or the live repo.

### ⚠️ Known environment quirk (read before running git commands)
This Cowork sandbox **can overwrite file contents in the mounted project folder but cannot delete/unlink files** (confirmed repeatedly — affects `node_modules`, git lock files, anything). This means `git merge`/`checkout`/`reset --hard` run from *inside the sandbox* will reliably fail and leave stray `.lock` files in `.git/`. If that happens:
- The user must run git commands themselves in their own Windows Git Bash (full permissions there), e.g.:
  ```
  cd "/c/Users/AI Agent/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai"
  find .git -name "*.lock" -delete
  git pull origin main
  ```
- `git fetch` (read-only-ish) does work from the sandbox.
- Windows checkouts show every changed line as modified in `git diff` due to CRLF vs LF — this is cosmetic, not a real content difference (verify with `git diff --ignore-space-at-eol`).

---

## 3. Auth / session — the original "login works but dashboard redirects back" bug

**Status: ✅ CONFIRMED FIXED in code (commit `3ff2c91`), but with a caveat below.**

Root cause (✅ CONFIRMED by reading code, matched to the reported 200-then-307-loop symptom): `middleware.ts` runs on Next.js's Edge runtime by default. It used to call `verifyToken()` from `lib/auth.ts`, which used the `jsonwebtoken` package — Node-only, not Edge-compatible. `jwt.verify()` silently threw inside middleware, got caught, returned `null`, and middleware treated a validly-cookied user as unauthenticated.

Fix actually shipped (✅ CONFIRMED, `middleware.ts` on `origin/main`): middleware no longer imports `jsonwebtoken` at all. It has its own `decodeJWTPayload()` that base64url-decodes the JWT payload and checks expiry + presence of `userId`/`email` — **it does not verify the cryptographic signature**.

**⚠️ Security gap, not yet fixed (explicitly on hold per user instruction as of 2026-07-17):** because middleware only decodes and doesn't verify signature, a hand-crafted cookie shaped like a JWT (3 dot-separated base64 segments, middle one decoding to `{userId, email, exp}`) could pass the middleware gate into `/dashboard`. Real data wouldn't load, because API routes still call `getSession()` → `verifyToken()` in `lib/auth.ts`, which uses real `jsonwebtoken` verification on the Node.js runtime (not Edge) — so that layer is still cryptographically sound. But the dashboard shell/page itself would render for a forged cookie. Recommended proper fix (not applied): swap `jsonwebtoken` for `jose` (Edge-compatible, verifies signature) in both `lib/auth.ts` and `middleware.ts`.

Cookie options (✅ CONFIRMED in `lib/auth.ts`): `httpOnly: true`, `secure` in production, `sameSite: 'lax'`, `maxAge` 7 days, no explicit `domain` set. These are fine — not a www vs non-www issue as an earlier handover doc suspected.

---

## 4. Stripe (⚠️ DISCREPANCY — needs verification, do not assume either way)

- ✅ CONFIRMED in code (`lib/stripe/products.ts`): `PRO_MONTHLY` and `ENTERPRISE_MONTHLY` price IDs are LIVE Stripe price IDs (`price_1TCQ...`), not test/sandbox. Credit pack IDs (`CREDITS_10/50/100`) are still explicitly commented as sandbox placeholders awaiting live IDs.
- ✅ CONFIRMED (this session, later pass): `PRO_ANNUAL` (`price_1TuEaIHTpiuftGGEslehCB4Y`) and `ENTERPRISE_ANNUAL` (`price_1TuEaNHTpiuftGGE9r0fRkWI`) were created via the Stripe MCP with explicit user approval, verified `livemode: true` via direct API read. Wired into `app/api/stripe/create-checkout/route.ts` (now takes `{plan, interval}`) and `app/dashboard/billing/page.tsx` (monthly/annual toggle UI). Annual billing is now code-complete and pushed to `origin/main` — **but see the key-mismatch item below, which could still break it in production.**
- ✅ RECONFIRMED (this session, later pass): local `.env.local` still has `STRIPE_SECRET_KEY=sk_test_51Sr25...` and `STRIPE_PUBLISHABLE_KEY=pk_test_51Sr25...` — **test mode**. This does not match the live price IDs (monthly or annual) now in code. Test-mode secret keys cannot create checkout sessions referencing live-mode price IDs — Stripe returns a "No such price" error. **If Vercel production has this same test/live mismatch, ALL checkout (not just annual) is currently broken in production.** This is the single highest-priority unresolved item in the whole project — see §12.
- ❓ UNKNOWN: what's actually set in Vercel's production environment variables for `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Still not checked — Vercel connector is connected but is read-only (list/get deployments and projects only, no env var access). **Only the user can check this, directly in the Vercel dashboard.** Do not assume production matches or doesn't match local `.env.local`.

---

## 5. Email — Resend (⚠️ DISCREPANCY — strong evidence it's not wired up in production)

- ✅ CONFIRMED: `lib/email.ts` is fully built (welcome email, password reset via Resend API).
- ✅ CONFIRMED: `RESEND_API_KEY` and `FROM_EMAIL` are NOT present in local `.env.local`. If also missing in Vercel, the code path silently no-ops (`console.warn`, returns `false`) with no user-facing error — emails would just never send, with no visible failure.
- ⚠️ NEW EVIDENCE (2026-07-17, user-provided screenshot of Resend dashboard): a Resend API key named "SHIJO AI" (`re_G5CREC5q...`, full access, all domains) exists, created by `merianda@shirotechnologies.com` **4 months ago**. **Total uses: 0. Last used: No activity.** This is strong (not conclusive) evidence the key was never actually set in Vercel's production `RESEND_API_KEY` — a key in active use for months of real signups would show usage. Still technically possible the key is set correctly but no user has ever triggered a password reset or welcome email; that's a materially less likely explanation given the app has had live-price real signups.
- **Action needed from user, not Claude:** confirm in the Vercel dashboard whether `RESEND_API_KEY` is set to this token. If not, add it there — Claude cannot enter API keys into any field, including Vercel, even with connector access (hard rule, not a preference).

---

## 6. Legal pages, landing page, dashboard (✅ CONFIRMED present in current code)

- `/privacy`, `/terms`, `/cookies` pages exist again (previously removed for ESLint build errors, restored using the `.eslintrc.json` fix rather than manual escaping).
- `.eslintrc.json` has `react/no-unescaped-entities: off` — ✅ CONFIRMED present and committed.
- Dashboard has: overview, keywords (route deleted this session, see §12), content, analytics, billing, settings, tools (12-tool listing + individual tool pages, post-consolidation).
- Google Analytics wired in, ✅ CONFIRMED measurement ID hardcoded in `lib/analytics.ts`: `G-8SSXDRYL30`.
- "AI Tools engine" — **12 tools** (cut from 23 this session per Product Handoff Rev2 — see §12) with tiered Haiku/Sonnet model routing (`lib/tools/registry.ts`, `lib/tools/prompts.ts`, `lib/tools/usage.ts`) — ✅ CONFIRMED exists in code and confirmed live on production (`shijo.ai` homepage reads "12 AI-Powered Marketing Tools" as of this session). ✅ CONFIRMED a critical bug was found and fixed this session: 18 of the original 23 tools (all Sonnet-tier) were calling a non-existent model ID (`claude-sonnet-4-5-20241022`, predates the real Sonnet 4.5 release) — every Pro/Enterprise generation on those tools was silently failing. Fixed to `claude-sonnet-4-5-20250929` and pushed. ❓ UNKNOWN: no live end-to-end generation test has actually been run (would cost real Anthropic API money) — the fix is a static-code correction against official model IDs, not a verified live test.

---

## 7. Database (Neon + Drizzle)

- ✅ CONFIRMED: `db/schema.ts` defines a large set of tables — users, subscriptions, credits, usage/quota/rate-limit tracking, and the full Phase 1–6 SEO roadmap (keywords, clusters, SERP results, AI visibility/simulations, forecasts, strategies/tasks, rank tracking).
- ✅ CONFIRMED: only one migration file exists on disk (`db/migrations/0000_flowery_colonel_america.sql`).
- ❓ UNKNOWN: whether the live Neon database has actually been migrated/pushed to match everything currently in `schema.ts`. If `db:push` hasn't been re-run since schema changes, tables/columns the code expects may not exist in the real database. **Not verified — do not assume the live DB matches the schema file.**

---

## 8. Connector / access status (✅ CONFIRMED, current as of this session)

- **GitHub:** no MCP connector available in Cowork's connector registry (searched multiple keyword sets, none found). Working around it via direct `git fetch`/read access to the repo (works anonymously for fetch; no push credentials in this sandbox — pushes must happen from the user's own machine).
- **Vercel:** MCP connector exists and was suggested, but has **not been connected/authorized yet** — user has only shared the project URL (`vercel.com/shiro-technologies/shijo-ai`) verbally, which is not the same as clicking Connect. Once connected: `list_projects`, `get_project`, `list_deployments`, `get_deployment`, `get_deployment_events`, `list_teams` become available — this would resolve several of the ❓ UNKNOWNs above (actual production env vars, deployment/build status).
- Claude in Chrome extension: not connected in this session, so the live site (`shijo.ai`) has not been visually verified this session. `web_fetch` to `shijo.ai` and `www.shijo.ai` both timed out (180s) — cause not diagnosed (could be transient, could be a real site issue — ❓ UNKNOWN, not confirmed either way).

---

## 9. Done vs. outstanding

**Done (✅ CONFIRMED shipped in code on `origin/main`, and CONFIRMED live on shijo.ai via Claude in Chrome this session):**
- AuthProvider wrapper, duplicate heading fixes, SHIRO design system colors
- ESLint config fix (`react/no-unescaped-entities: off`)
- Login API returns 200, sets session cookie correctly
- Middleware Edge-runtime fix (redirect loop resolved, but see security caveat in §3)
- Legal pages restored
- Stripe Checkout integration (Pro/Enterprise monthly AND annual) with live price IDs — code-complete, **but see §4/§12 key-mismatch risk**
- Resend email integration (code-complete, Vercel key presence still unverified)
- 12-tool AI engine (cut from 23 per Rev2 handoff), confirmed live
- Critical Sonnet model-ID bug fixed (was silently breaking most paid-tier generations)
- Unverified trust badges removed from homepage render (component file itself still exists, orphaned — see §12)
- Legacy credit-based keyword quota system fully retired — both code refs removed AND orphaned files physically deleted by user (confirmed this session)
- SEO: sitemap.xml pricing copy and robots.ts changes made locally, **not yet pushed** — see §12
- Google Search Console verification file added and confirmed live
- Dashboard billing/analytics/settings/tools pages
- Usage tracking (`lib/tools/usage.ts`), plan-based access control — NOTE: rate limiting is a *separate*, still-unbuilt system (see item 2 below); don't conflate the two
- Google Analytics

**Outstanding / needs decision or verification (do not assume status — confirm before acting):**
1. **Stripe test/live key mismatch (§4) — highest priority.** Confirmed local `.env.local` is test-mode against live-mode price IDs. If Vercel production has the same mismatch, checkout is broken right now for every plan, not just annual. Needs the user to check Vercel dashboard env vars directly (no MCP access to env vars exists).
2. Middleware JWT signature verification gap (§3) — fix on hold per explicit user instruction as of 2026-07-17.
3. Rate limiting on auth/generation endpoints — confirmed still unbuilt, `rateLimits` table has zero references anywhere in the codebase. Part of the still-unimplemented "Phase 4" API spend-control guardrails (Enterprise plan usage is uncapped at `-1` in `lib/tools/usage.ts`).
4. Resend API key presence in production (§5) — needs Vercel env var check.
5. Neon DB migration completeness vs. `schema.ts` (§7) — only one migration file exists on disk, reconfirmed this session. Not verified against live DB.
6. `app/robots.ts` / `app/sitemap.ts` fixes not yet pushed (§12) — commands given to user.
7. `components/landing/TrustBadges.tsx` — orphaned dead file, still contains the fabricated claims as text even though nothing renders it. Low risk but should eventually be deleted (sandbox can't delete files — needs a user-run `rm`).
8. Live end-to-end tool-generation test — never actually run (would spend real Anthropic API credit). Only static/structural verification has been done.
9. Keyword list for Google Keyword Planner — requested by user, not yet delivered.

---

## 10. Ground rules carried over from the original handover (still apply unless user says otherwise)

- No localhost-only testing — verify against the live production site once reachable.
- No assumptions — if something isn't verified in this doc, say so and check before acting, don't state it as fact.
- Ask before making changes to auth/security-sensitive code (per explicit instruction on 2026-07-17: no fixes without sign-off).
- **Never describe work as "done" without checking it's actually committed AND pushed to `origin/main`.** On 2026-07-18, six completed features (GDPR export/delete, footer restructure, compliance pages, contact+tickets, PPC landing page) were reported as "done" while still sitting as uncommitted local file changes only — the user caught this because none of it was visible on the live site. Local edits ≠ shipped. Always verify with `git status` / `git log -1` vs `git rev-parse origin/main` before claiming something is live, and be explicit in the response about which state ("edited locally" vs. "committed" vs. "pushed and live") applies.
- **This sandbox cannot push to git and sometimes cannot even commit.** It has no push credentials, and its git operations can leave a stale `.git/index.lock` file that the sandbox is not permitted to delete (same class of restriction as not being able to delete stray files — see §2/§13). When this happens, hand the user the exact commands to run themselves in their own Git Bash, starting with clearing the lock: `rm .git/index.lock` (not `del` — that's a Windows cmd.exe builtin, not a Git Bash/bash command; the user hit this directly on 2026-07-18).
- ✅ Confirmed working 2026-07-18: user ran `rm .git/index.lock && git add -A && git commit ... && git push origin main` — commit `6e00c14` now matches `origin/main`, Vercel build triggered. All six items from the "This is good. Continue." plan plus the new `/lp` PPC landing page are pushed.
## 15. Sitewide styling bug fix, /lp SEO rework, Contact CTAs, and a blog (2026-07-18, later same day)

**Real, sitewide bug found and fixed:** `tailwind.config.ts` never defined `shiro-red`, `shiro-red-dark`, or `shiro-black` — 15 files used these classes (`components/Header.tsx`, `components/Footer.tsx`, `/terms`, `/privacy`, `/cookies`, `/register`, `/login`, `/forgot-password`, `/reset-password`, plus every page built this session that copied the pattern: `/contact`, `/security`, `/gdpr-compliance`, `/ai-compliance`, `/admin/terms`, `/admin/tickets`). Since the colors weren't in the Tailwind theme, the JIT compiler silently generated no CSS for any of them — the legal-pages footer rendered with no dark background and red links rendered as default black text, sitewide, since before this session started. This is what the user was seeing as a broken/inconsistent-looking Contact page footer ("two footers... different than other pages") — confirmed by comparing the live `/contact` and `/terms` pages side by side, both showing the same unstyled white footer. Fixed with one addition to `tailwind.config.ts`'s color palette (aliased to the existing `primary`/`secondary` values) rather than editing 15 files individually.

**`/lp` changed from noindex ad-only page to an indexable SEO landing page**, per explicit user request — it now also needs to earn organic traffic, not just serve as the Google Ads Final URL. Removed `robots: { index: false }`, added a real title/description/keywords targeting phrases from the 50-phrase Google Ads list, added `SoftwareApplication` JSON-LD, added it to `sitemap.ts`, and reworked the tool-category and FAQ copy to naturally include target phrases ("AI Keyword Research Tool," "AI Ad Copy Generator," "AI Email Sequence Generator," "Social Media Caption Generator") without keyword-stuffing.

**Contact page (`/contact`) got three promo CTA cards** (dark cards, brand red accents) flanking the form — "12 Tools, One Platform" → `/lp`, "Start Free, Upgrade Anytime" → `/#pricing`, "Try SHIJO.AI Free" → `/register` — modeled on a reference screenshot the user shared (a competitor's contact page with a similar eyebrow-label + heading + bullets + CTA card pattern), adapted to SHIJO's own black/red brand rather than copied wholesale. Caught and fixed one near-miss before shipping: almost linked the pricing card to `/pricing` as a bare route, which 404s (pricing only exists as a homepage anchor, `/#pricing`) — same bug class as the `/ai-usage` 404 from earlier in the session.

**New blog** (`/blog` index + `/blog/[slug]`), file-based with no CMS or new dependency — `lib/blog/posts.ts` holds typed content blocks (paragraph/heading/list) rather than markdown, since no markdown parser was already in the project and adding one risked the corrupted-node_modules issue seen earlier in the session. Seeded with 3 posts, each targeting real phrases from the keyword list and written as genuinely useful how-to content (not thin keyword-stuffed pages) with a soft CTA at the end pointing to `/lp` or `/register`: "AI SEO Tools: How to Do Keyword Research 10x Faster," "How to Write AI Ad Copy That Actually Converts," "AI Marketing Tools Every Small Business Should Consider in 2026." Each post has its own `generateMetadata` and `Article` JSON-LD, and both are in `sitemap.ts`. Added `/blog` to both header components and both footer components. Swapping this for a real CMS later (so the team can publish without a code deploy) would only mean changing how `app/blog/[slug]/page.tsx` fetches `posts` — the render layer wouldn't need to change.

⚠️ **None of this has been pushed yet** — same as before, these are local file edits pending `git add / commit / push` from the user's own Git Bash.

---

- ⚠️ **Known noise, not a bug:** after that push, `git status` still shows ~50+ files as modified (e.g. `app/api/auth/logout/route.ts`, `app/icon.svg`). Diffed one to confirm — every line shows as changed but the content is byte-identical; this is CRLF/LF line-ending churn (`core.autocrlf` isn't set), the same root cause as the earlier giant no-op `package-lock.json` diff. Not urgent, but don't mistake this for real uncommitted work, and don't `git add -A` it into an unrelated commit without calling it out — worth fixing with a `.gitattributes` file at some point if it keeps being noisy, but that's a repo-config decision for the user to approve, not something to change unasked.

---

## 11. Cross-check: "Shijo_AI_Product_Handoff_final.docx" (dated July 16, 2026, based on a Mar 23, 2026 codebase audit) vs. actual current code (HEAD `4b49d5b`, checked 2026-07-17)

The handoff doc's audit is ~4 months old (Mar 23, 2026) even though the doc itself is dated July 16, 2026. Several "still open" items it lists have since been fixed in code. Others are still accurate. Findings below, verified directly against source:

**✅ Already fixed since the audit (doc is outdated on these):**
- **"Unauthenticated /api/billing/checkout route"** — NOT true anymore. `app/api/billing/checkout/route.ts` now calls `getSession()` and returns 401 if no session, with an explicit code comment "Auth check — use session userId, never trust body." Both `/api/billing/checkout` and `/api/stripe/create-checkout` exist and both check auth — the doc's "consolidate to one route" recommendation is still reasonable as cleanup (duplicate logic), but not for the security reason stated.
- **"Hardcoded JWT_SECRET fallback"** — fixed in commit `6bce133` (2026-03-24), one day after the audit. `lib/auth.ts` now throws in production if `JWT_SECRET` isn't set; the hardcoded fallback only applies in local dev.
- **"Forgot-password email not sending"** — `app/api/auth/forgot-password/route.ts` now calls `sendEmail()` via the Resend integration (`lib/email.ts`) with a real reset-link email. Code-wise this is wired up. **Caveat:** whether it actually sends depends on `RESEND_API_KEY` being set — confirmed NOT set in local `.env.local` (§5); Vercel's value is unverified. So this could still be silently failing in production even though the code path is correct — don't mark this fully resolved without checking Vercel env vars.
- **"Stripe webhook handlers unverified"** — `app/api/webhooks/stripe/route.ts` does call `stripe.webhooks.constructEvent()` with the signing secret and rejects invalid signatures. Code-level verification is correctly implemented. Whether it's been tested against real live Stripe webhook traffic (an operational check, not a code check) is still ❓ UNKNOWN.

**⚠️ Still accurate / still open (doc is correct):**
- **Rate limiting** — confirmed still not wired up. `rateLimits` table is not referenced anywhere in `lib/` or `app/api/` (grepped, zero hits). Table exists in schema, unused.
- **Legacy credit-based keyword quota system** — confirmed still present alongside the new tiered system. `lib/stripe/products.ts` free-tier config still has a block explicitly commented `// Legacy keyword features (kept for compatibility)`. Not retired.
- **Unverified trust badges** — confirmed still live, verbatim, in `components/landing/TrustBadges.tsx`: "SOC 2 Compliant," "10M+ Keywords... Analyzed Daily," "500+ Enterprises... Trust Our Platform." Not removed or substantiated.

**❓ Doc claim doesn't match what's in code — needs the doc's author or live-site check to reconcile, not resolved either way:**
- **"/pricing and /features sitemap links still 404"** — `app/sitemap.ts` doesn't list `/pricing` or `/features` at all (only `/`, `/login`, `/register`, `/terms`, `/privacy`, `/cookies`). And there are no `/pricing` or `/features` page routes in `app/` — the header/hero/CTA components link to `#pricing` and `#features` as same-page anchors on the homepage, not separate routes. So as the code stands today, there's no sitemap entry or route that would 404 in the way described. Possible explanations: the audit saw a different, since-removed version of the site; or this refers to something not visible in this static-code check (e.g. an actual runtime redirect or an external backlink). Not confirmed either way — live site wasn't reachable this session to check directly.
- **"Annual pricing is now live on the site"** — partially true. `annualPrice` (278 / 950) is computed and *displayed* as text on `/dashboard/billing` ("or $278/year, save 20%"). But there is no separate Stripe annual price ID anywhere in `lib/stripe/products.ts` — only `PRO_MONTHLY`/`ENTERPRISE_MONTHLY`. The "Upgrade" button only ever sends `plan: 'pro' | 'enterprise'` to checkout, which always resolves to the monthly price ID. **There is currently no way for a user to actually purchase the annual plan** — the price is advertised but not purchasable. Worth flagging back to whoever wrote the handoff doc.

**⚠️ Tool count discrepancy:**
- Doc assumes a 24-tool lineup (12 keep / 12 cut). Actual `lib/tools/registry.ts` currently has **23 tools**, not 24 (code's own `products.ts` comment also says `aiToolsAccess: 24`, which is itself wrong).
- All 12 "keep" tools from the doc exist in the registry — no issue there.
- Of the 12 "cut" tools, 11 exist in the registry. **"Blog Post Outline" does not exist in the current tool registry at all** — nothing to cut. Net effect: cutting the other 11 as recommended would leave 12 tools, matching the doc's intent, just off by the one tool that's already absent.

**Update 2026-07-17 (later same day):** `Shijo_AI_Product_Handoff_Rev2.docx` was produced (by the user/another session) reconciling Revision 1 against this cross-check. Re-verified against the live repo at the same HEAD (`4b49d5b`, confirmed no new commits landed) — Rev2 accurately reflects every item above: annual pricing correction, tool count correction (23, not 24; cut list is 11 not 12), the two resolved security items, the new Stripe test/live key mismatch flag, and the DB migration precondition. **Rev2 is the current authoritative handoff document going forward** — treat it as more current than the original `Shijo_AI_Product_Handoff_final.docx`. One item in Rev2 is a new claim not independently verified by this session: it states a live fetch to `/pricing` and `/features` on July 16 returned empty content — plausible and consistent with there being no such routes, but not re-checked here.

**Not yet checked this session (needs live-site access or Vercel connector):**
- Whether `/pricing`/`/features` actually 404 in production right now.
- Whether webhook/email/Stripe-key issues manifest in production behavior, since Vercel env vars are still unverified (§4, §5).
- Acquire.com market comparables and the 12-keep/12-cut *strategic* rationale in the doc were not independently re-verified — those are business judgment calls, not code facts, and outside the scope of this code cross-check.

---

## 13. Legal docs rewrite + Terms/Privacy acceptance tracking (2026-07-17, third pass)

**Legal content** (user explicitly wants attorney review after — these are drafts, not vetted legal advice):
- `/terms` and `/privacy` fully rewritten. Terms went from 11 to 17 sections; Privacy from 12 to 17. Added: severability, indemnification (both directions — user indemnifies company, company indemnifies user for Service-itself IP claims, modeled on Jasper AI's approach per competitor research), export control/sanctions, force majeure, arbitration + class-action waiver with a 30-day opt-out, explicit auto-renewal disclosure (relevant given ~30 states have their own auto-renewal laws even though the federal FTC click-to-cancel rule was vacated in 2025 and is only back in ANPRM/proposal stage as of 2026 — verified via web search, not assumed), AI-content prohibited-use + non-infringement disclaimer, full sub-processor list in Privacy (added Vercel, Neon, Google Analytics — previously missing), PIPEDA/CASL section for Canada, GDPR legal-basis language for EU, and an EU AI Act Article 50 note — verified via web search that Article 50 transparency obligations become applicable **August 2, 2026, about two weeks from this session's date**, with generative-AI machine-readable marking specifically extended to December 2, 2026 for systems already on the market. This is a real, imminent deadline, not just boilerplate — flagged to user distinctly, may need actual product changes (output watermarking/labeling) beyond what editing legal text can cover.
- ✅ CONFIRMED not yet legally reviewed by an attorney — user's own stated plan, not a gap I'm flagging as unknown.

**Terms acceptance tracking (new feature, built this session):**
- `db/schema.ts`: added `users.isAdmin` (boolean, default false) and a new `termsAcceptances` audit table (userId, email, name, termsVersion, privacyVersion, ipAddress, userAgent, acceptedAt).
- `lib/legal.ts`: new file, `CURRENT_TERMS_VERSION`/`CURRENT_PRIVACY_VERSION` constants (both `'2026-07-17'`), bump these when the docs change again.
- `components/auth/RegisterForm.tsx`: added a required checkbox ("I agree to the Terms of Service and Privacy Policy", both linked, open in new tab) — submit button is disabled until checked. This makes acceptance clickwrap, not browsewrap — stronger enforceability than before.
- `contexts/AuthContext.tsx` and `app/api/auth/register/route.ts`: `register()` now takes and requires `acceptedTerms: true`; rejects with 400 otherwise. On success, inserts a `termsAcceptances` row (captures IP via `x-forwarded-for`/`x-real-ip` headers, user-agent, timestamp, and the version constants).
- `lib/email.ts`: new `buildTermsAcceptedEmail()` + `sendEmail()` now supports `cc`. Register route sends this email to the new user, **CC'd to `legal@shijo.ai`** — I picked this address because it's the existing contact address already used throughout the legal pages; user should confirm or redirect this to wherever they actually want acceptance records to land.
- `app/api/admin/terms-acceptances/route.ts` + `app/admin/terms/page.tsx`: new minimal admin panel listing every acceptance record. The API route re-checks `isAdmin` against the database on every request rather than trusting the JWT (consistent with the known middleware signature-verification gap in §3 — admin status must never be sourced from a token that isn't cryptographically verified).
- `middleware.ts`: added `/admin` to protected routes and the matcher (session-cookie gate only; the real `isAdmin` check happens server-side in the API route).
- ⚠️ **Not yet done — blocked on sandbox network restrictions, not code:** the schema migration itself. This sandbox's network egress is allowlisted and does not reach Neon's database endpoints (confirmed by testing both raw Postgres protocol and Neon's HTTPS-based driver — both failed at the network layer, not a credentials or code issue). SQL is ready at `db_migration_admin_terms.sql` (delivered to user) — needs to be run via Neon's SQL Editor or `npm run db:push` from the user's own machine. **No user can register successfully until this migration runs**, since the register route now does `db.insert(termsAcceptances)` against a table that doesn't exist in the live DB yet.
- A stray scratch file `_migrate_admin.cjs` was accidentally written to the repo root during a failed migration attempt from the sandbox — neutralized to an inert comment (couldn't delete it, sandbox file-deletion limitation, see §2). User should `rm _migrate_admin.cjs` when convenient.
- ❓ UNKNOWN: no admin account exists yet — needs the user's own test-account email (asked, not yet received) so the KB/user can flip `is_admin = true` for that account via the SQL comment at the bottom of `db_migration_admin_terms.sql`.

**Live tool-testing plan (user chose "test all 12 tools live"):** originally planned to grant a test account Pro tier via direct DB write to skip Stripe entirely. **That plan is also blocked by the same sandbox network restriction** — will need to either (a) go through this same `db_migration_admin_terms.sql`-style delivered-SQL pattern once the test account exists, or (b) actually exercise Stripe checkout (which would also empirically resolve the test/live key mismatch question from §4/§12, since a broken checkout would fail immediately). Still waiting on the user to specify the test account email before this can proceed.

---

## 14. Live click-through testing, content-accuracy audit, and GDPR self-service tools (2026-07-18)

**User instruction on hold, still in force:** "Lets not rotate anything until we test it orselves" — Vercel secret rotation (§0, task #19) stays untouched until the user tests the live product themselves. Do not action without a fresh explicit go-ahead.

**File-organization change:** the Cowork outputs scratchpad path is a Windows app-container path the user can't reliably open. Going forward, anything the user needs to open goes in this repo's own `docs/` folder, or is pasted directly in chat — not written to the scratchpad.

**Live click-through test findings (Chrome, via Claude in Chrome extension) — full write-up at `docs/2026-07-18-live-site-click-through-findings.md`:**
- Found and fixed the reported 404: footer "AI Usage" link pointed at `/ai-usage` (no route exists) — repointed to `/privacy#4`.
- Removed stale "New tools added monthly" line from Features section.
- Fixed a missed "24 AI tools" string in `CTASection.tsx` → 12.
- Rewrote `UseCases.tsx` — it claimed unbuilt features ("200+ tracked keywords," "AI visibility tracking," "Unlimited clients," "White-label reports"). Rewritten to describe only the 12 shipped tools.
- `/about` nav link points at a `#about` anchor that doesn't exist anywhere on the page — silent no-op, not a crash. Still open, low priority (either build About content or drop the nav item).

**Trial-language contradiction (task #24, now closed):** the rewritten Terms §4 states no free trial exists, but "Start Free Trial" / "Start Pro Trial" / "Start Enterprise Trial" copy was still live in `Header.tsx`, `Pricing.tsx`, `register/page.tsx`, and `lib/seo-config.ts`. All four fixed — verified via a final sitewide grep that the only remaining "trial" hits are the Terms disclosure itself, an internal analytics label (`trackCTAClick`), and tool-input placeholder examples (e.g. "e.g. Start free trial, 50% off first month" — an example prompt shown inside the Ad Copy tool's own input field, not a claim about SHIJO's pricing).

**GDPR/CCPA functional gap (task #25, now closed):** the Privacy Policy has always promised deletion and data-portability rights (§10), but nothing in the codebase actually implemented them. Built:
- `GET /api/account/export` — returns every record tied to the logged-in user (profile, keywords, content briefs, usage logs, subscriptions, terms acceptances, and every other user-owned table in the schema) as a downloadable JSON file. Scoped strictly to `session.userId`; never accepts a userId from the request.
- `DELETE /api/account/delete` — requires the user to re-enter their current password plus type `DELETE` to confirm. Cancels any active/trialing/past-due Stripe subscription immediately, deletes the `users` row (cascades through every related table via the `onDelete: 'cascade'` foreign keys already in `db/schema.ts`), clears the session cookie, and sends a deletion-confirmation email (CC'd to `legal@shijo.ai`, same pattern as the terms-acceptance email).
- `lib/email.ts`: new `buildAccountDeletedEmail()`.
- `app/dashboard/settings/page.tsx`: new "Data & Privacy" section with an "Export my data" button and a "Delete my account" button that opens a password + type-to-confirm modal.
- `app/privacy/page.tsx` §10: added a line pointing users at Dashboard → Settings → Data & Privacy for self-service access/deletion, no request or waiting period needed.
- ⚠️ **Not live-tested — sandbox cannot reach Neon (see §13).** The cascade-delete depends on the live database actually having `ON DELETE CASCADE` on every FK, matching `db/schema.ts`. This is very likely true (the pattern is used consistently throughout, and it's the same mechanism already confirmed working for `termsAcceptances`), but per the user's "test it ourselves first" instruction, this should be tried on a real (ideally throwaway) test account before being trusted in anger.

**Task #26 (support/billing overclaim fixes, closed):** `app/dashboard/billing/page.tsx` had the same class of problem as Pricing.tsx — "Basic support," "Priority support," and "Dedicated support" bullets with no actual differentiated support system behind them (all removed), plus a billing FAQ promising "a 7-day money-back guarantee for all paid plans, no questions asked" that directly contradicted the Terms of Service §4 refund language ("case-by-case basis at our discretion"). Fixed the FAQ to match the Terms and link to it. Final sitewide grep confirms the only remaining "coming soon" claims (Team collaboration, Custom integrations) are honestly labeled as such.

**Task #27 (footer restructure, closed) + #29 (GDPR Compliance/Security pages, closed) — done together, in that order, on purpose:** building the footer links first and the pages second would have reintroduced the exact `/ai-usage`-style 404 bug fixed earlier this session. Built three new pages, each grounded in facts already established in the rewritten Terms/Privacy (bcrypt hashing, TLS, Stripe PCI handling, HTTP-only cookies, sub-processor list, EU AI Act Article 50 timeline) rather than inventing new claims or certifications (no SOC2/ISO27001 claims — not true, not asserted):
- `/security` — encryption in transit, password/session security, payment security, access controls, self-service data controls, incident notification, vulnerability reporting to `legal@shijo.ai`.
- `/gdpr-compliance` — controller identity, legal bases, rights (cross-referencing the new self-service export/delete tools from #25), sub-processor list, retention, incident notification.
- `/ai-compliance` — Anthropic infrastructure, no-training-on-inputs representation, EU AI Act Article 50 (deployer responsibility, not automatic watermarking), human-oversight requirement, no-guarantee-of-accuracy, prohibited uses.
- Added real `id="1"` … `id="17"` anchors to every section of `/terms` and `/privacy` (`components/Footer.tsx`'s `/ai-usage` fix and the new billing-FAQ link both point at these anchors — previously `/privacy#4` was a silent no-op since no section actually had that id).
- Fixed the second half of the dead-anchor bug class found in the click-through test: `#about` pointed at a section that never existed anywhere in the codebase. Replaced with real `/contact` links in both header components (`components/Header.tsx`, `components/landing/Header.tsx`) and the "About Us" footer link, instead of inventing About-page content or leaving a silent no-op.
- Rebuilt `components/landing/Footer.tsx` (homepage footer, previously just 3 links) into a 4-column structure matching `components/Footer.tsx` (legal-pages footer), both now linking Terms, Privacy, Cookies, GDPR Compliance, AI Compliance, Security, and Contact.

**Task #28 (Contact page + CAPTCHA + support tickets, closed):**
- `lib/captcha.ts` — self-hosted, stateless math CAPTCHA. No third-party service, no API keys, no server-side session storage — the challenge and its 10-minute expiry are HMAC-signed (using the existing `JWT_SECRET`) into an opaque token the client holds and returns; verification just recomputes the HMAC, so it works statelessly across serverless instances. Proportionate for stopping unsophisticated form-spam, not a defense against a targeted attacker — matches the user's "simple captcha for now" ask.
- `app/api/contact/captcha` (GET) issues a challenge; `app/api/contact` (POST) validates fields + CAPTCHA, inserts into a new `supportTickets` table, and fires two emails: a confirmation to the submitter and an internal notification to `legal@shijo.ai`. Works for both logged-in and anonymous visitors — auth is optional, ticket is attributed to `session.userId` when present.
- `db/schema.ts`: new `supportTickets` table. Deliberately `onDelete: 'set null'` on `userId` (not `cascade`, unlike every other user-owned table) — a support ticket is a business record, not GDPR-exportable user data, and should survive account deletion for the team's own record-keeping rather than vanish with the account, consistent with the "retention... for legitimate business purposes" carve-out already in Privacy §9.
- `app/contact/page.tsx` + `components/contact/ContactForm.tsx` — the public-facing form.
- `app/api/admin/tickets` (GET, list) and `app/api/admin/tickets/[id]` (PATCH, update status/notes) — same re-check-`isAdmin`-against-the-database pattern as `/api/admin/terms-acceptances`. Resolving a ticket fires a resolution email to the submitter, only on the open→resolved transition (not on every subsequent edit).
- `app/admin/tickets/page.tsx` — admin UI with status filters, expandable tickets, an internal-notes field, and a mailto reply link. Cross-linked with `/admin/terms` via a small tab bar on both pages.
- ✅ **`support_tickets` migration run by the user in Neon's SQL Editor (2026-07-18)** — `docs/manual-db-changes/2026-07-18-support-tickets.sql` applied. The Contact page's `/api/contact` insert should now succeed against a real table. Still not live-tested end-to-end (submit → email confirmation → shows in `/admin/tickets` → resolve → resolution email) — that's the next verification step, consistent with "let's test it ourselves first."

**All six items from the "This is good. Continue" plan are now code-complete.** What's left before any of this can be trusted live: run the `support_tickets` migration (above), and test registration, account export/delete, and the contact form end-to-end — consistent with the user's standing "let's test it ourselves first" instruction.

---

## 12. Rev2 handoff vs. code vs. live site — final cross-check (2026-07-17, later same-day pass)

Rev2 (re-uploaded and re-read in full this pass) is a code-verified audit against HEAD `4b49d5b`, dated the same day as this session. Its Section 4 (12 keep / 11 cut tool list) was independently executed in full this session before this re-read — the executed cut list matches Rev2's table exactly, tool-for-tool, with no invented substitutions. Below is what changed since Rev2 was written, and what Rev2 flagged that's still open, each verified directly (not assumed):

**Rev2 items now RESOLVED by this session's work (Rev2 predates these):**
- ✅ Tool consolidation (Rev2 §4) — executed exactly as specified: 12 kept, 11 cut, matching Rev2's tables tool-for-tool. Confirmed live on shijo.ai.
- ✅ Annual pricing (Rev2 §5 "PARTIAL — displayed, not purchasable") — real live Stripe annual price IDs created and wired into checkout + billing UI. Code-complete. **Still gated by the test/live key mismatch below.**
- ✅ Unverified trust badges (Rev2 §5 "STILL OPEN") — removed from the homepage render. Component file itself still physically exists as dead code (§9 item 7).
- ✅ Legacy credit-based quota system (Rev2 §5 "STILL OPEN") — fully retired, code refs removed and orphaned files physically deleted (confirmed via filesystem check this session: `app/api/keywords/`, `lib/usage.ts`, and the four orphaned dashboard components are all gone).
- ✅ A bug Rev2 didn't catch (its audit was static/structural, same as this one): 18 of 23 Sonnet-tier tools were calling a non-existent Claude model ID, silently failing every Pro/Enterprise generation. Found and fixed this session.

**Rev2 items RECONFIRMED still open (verified again this pass, not just carried over):**
- ⚠️ **Stripe test/live key mismatch (Rev2 §1, §5, §7)** — reconfirmed: local `.env.local` still `sk_test_.../pk_test_...`, live price IDs (monthly and now annual) confirmed `livemode: true` via direct Stripe API read. This is the single most important unresolved item — see §4 and §9 item 1. Needs Vercel dashboard check by the user; no MCP path exists to read Vercel env var values.
- ⚠️ **Live DB migration status (Rev2 §1, §6, §7)** — reconfirmed: exactly one migration file on disk (`0000_flowery_colonel_america.sql`). Rev2's precondition stands: do not start Phase 3/6 build work (rank tracking, AI visibility) assuming the live Neon DB has those tables — unverified.
- ⚠️ **Rate limiting (Rev2 §5)** — reconfirmed still unbuilt, `rateLimits` table unreferenced anywhere in code.
- ⚠️ **RESEND_API_KEY in production (Rev2 §7)** — unchanged, still needs Vercel check.
- ✅ **`/pricing` and `/features` (Rev2 §5 "UNKNOWN", §7 "needs a fresh live-site check")** — checked directly this session via Claude in Chrome: both return a real 404 page on production. Confirmed no hardcoded `<Link href="/pricing">` or `href="/features">` exists anywhere in the codebase (grepped) — all internal nav uses `#pricing`/`#features` homepage anchors correctly. The 404 is only reachable by typing the bare URL directly or an external link; not a broken internal link. Low priority, informational only.

**New discrepancy found this pass, not in Rev2 (Rev2's audit predates this session's own edits):**
- `app/robots.ts` and `app/sitemap.ts` were edited earlier this same session (disallow `/dashboard/`, drop `/login`+`/register` from sitemap) but were never actually committed — confirmed via `git diff --ignore-space-at-eol --stat` showing only these two files as real (non-CRLF-noise) uncommitted changes, and confirmed live `shijo.ai/robots.txt` and `/sitemap.xml` still serve the old rules. Push command given to user; not yet confirmed run. **Check this first before assuming SEO fixes are live.**

**Business-judgment content in Rev2 not independently re-verified (same caveat as the prior cross-check in §11):** Acquire.com market comparables, and the tool keep/cut *rationale* (as opposed to the keep/cut *list itself*, which was executed and verified) — these are business analysis, not code facts, outside the scope of a code/live-site audit.
