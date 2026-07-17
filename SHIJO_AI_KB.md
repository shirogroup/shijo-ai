# SHIJO.AI — Knowledge Base / Status Reference

**Last updated:** 2026-07-17 (Cowork session)
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

- Local folder and `origin/main` are in sync at commit `4b49d5b` ("Add Google Analytics, legal pages, favicon, fix sitemap and Stripe type").
- A prior handover doc (dated Jan 21, 2026) describing the project as "login broken, Stripe test mode, Resend not configured" is **21 commits stale** — a lot shipped after it was written that it doesn't know about. Do not trust that doc's status claims without cross-referencing this file or the live repo.

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
- ✅ CONFIRMED: local `.env.local` has `STRIPE_SECRET_KEY=sk_test_...` — **test mode**, which does not match the live price IDs in code. Test keys cannot reference live price IDs — checkout would fail with a Stripe API error if this is also what's deployed.
- ❓ UNKNOWN: what's actually set in Vercel's production environment variables for `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. This has not been checked — Vercel connector not yet authorized. **Do not assume production matches or doesn't match local `.env.local`.**

---

## 5. Email — Resend (⚠️ DISCREPANCY)

- ✅ CONFIRMED: `lib/email.ts` is fully built (welcome email, password reset via Resend API).
- ✅ CONFIRMED: `RESEND_API_KEY` and `FROM_EMAIL` are NOT present in local `.env.local`. If also missing in Vercel, the code path silently no-ops (`console.warn`, returns `false`) with no user-facing error — emails would just never send, with no visible failure.
- ❓ UNKNOWN: whether `RESEND_API_KEY` is set in Vercel. Not checked.

---

## 6. Legal pages, landing page, dashboard (✅ CONFIRMED present in current code)

- `/privacy`, `/terms`, `/cookies` pages exist again (previously removed for ESLint build errors, restored using the `.eslintrc.json` fix rather than manual escaping).
- `.eslintrc.json` has `react/no-unescaped-entities: off` — ✅ CONFIRMED present and committed.
- Dashboard has: overview, keywords, content, analytics, billing, settings, tools (24-tool listing + individual tool pages).
- Google Analytics wired in, ✅ CONFIRMED measurement ID hardcoded in `lib/analytics.ts`: `G-8SSXDRYL30`.
- "AI Tools engine" — 24 tools with tiered Haiku/Sonnet model routing (`lib/tools/registry.ts`, `lib/tools/prompts.ts`, `lib/tools/usage.ts`) — ✅ CONFIRMED exists in code. ❓ UNKNOWN how much of this is live-tested end-to-end vs. just scaffolded.

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

**Done (✅ CONFIRMED shipped in code on `origin/main`):**
- AuthProvider wrapper, duplicate heading fixes, SHIRO design system colors
- ESLint config fix (`react/no-unescaped-entities: off`)
- Login API returns 200, sets session cookie correctly
- Middleware Edge-runtime fix (redirect loop resolved, but see security caveat in §3)
- Legal pages restored
- Stripe Checkout integration (Pro/Enterprise) with live price IDs
- Resend email integration (code-complete)
- 24-tool AI engine scaffolding
- Dashboard billing/analytics/settings/tools pages
- Usage tracking, rate limiting, plan-based access control
- Google Analytics

**Outstanding / needs decision or verification (do not assume status — confirm before acting):**
1. Middleware JWT signature verification gap (§3) — fix on hold per explicit user instruction as of 2026-07-17.
2. Stripe live-vs-test key mismatch (§4) — needs Vercel env var check.
3. Resend API key presence in production (§5) — needs Vercel env var check.
4. Neon DB migration completeness vs. `schema.ts` (§7) — not verified.
5. Live site visual/functional verification (§8) — not done this session, blocked on Chrome extension or fetch timeout.
6. Vercel MCP connector — needs user to actually click Connect (not just share the URL).
7. Stray backup/cruft files in repo (`page.tsx.backup`, `LoginForm.tsx.backup-redirect`, etc. from earlier sessions) — cleaned up on `origin/main` already; confirm local matches after any future pull.

---

## 10. Ground rules carried over from the original handover (still apply unless user says otherwise)

- No localhost-only testing — verify against the live production site once reachable.
- No assumptions — if something isn't verified in this doc, say so and check before acting, don't state it as fact.
- Ask before making changes to auth/security-sensitive code (per explicit instruction on 2026-07-17: no fixes without sign-off).

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
