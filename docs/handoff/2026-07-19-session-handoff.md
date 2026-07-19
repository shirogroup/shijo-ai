# SHIJO.AI — Session Handoff (2026-07-19)

**Purpose of this file:** you're picking this project up in a new session. Read this first, then `SHIJO_AI_KB.md` in the repo root (the technical source of truth), then the three documents listed in Section 4. Do not assume anything about what Sri wants that isn't written down somewhere in these documents — ask him directly if it's a judgment call, a pricing/policy decision, or a naming/positioning choice. This session made several decisions by asking rather than guessing (see Section 2), and that pattern should continue.

---

## 1. What this project is

SHIJO.AI (repo `shirogroup/shijo-ai`, local path `apps/shijo-ai`, live at shijo.ai) is a suite of 12 AI marketing tools across 4 categories (Social, SEO, Ads & Copy, Email), sold on a Free / Pro ($29/mo) / Enterprise ($99/mo) tiered model. Next.js/TypeScript/Drizzle-Postgres(Neon)/Stripe/Resend/Claude API. Real Google Ads traffic has been driven to this site, which is why the last several sessions have been unusually testing-heavy — bugs here are bugs a paying customer or ad visitor can actually hit.

Sri (srikanth@shiroapps.com) is non-technical-leaning-technical: he reads code-level explanations fine, catches real product/business issues himself (e.g. he's the one who spotted the Enterprise "unlimited" cost-exposure problem this session, not me), and increasingly wants terse, copy-paste-ready answers rather than long prose — especially for git commands. Match that register once you've been in the conversation a few turns.

## 2. How this session actually operated — carry this forward

- **KB-first, always.** `SHIJO_AI_KB.md` at the repo root is the running source of truth, labeled CONFIRMED / UNKNOWN / DISCREPANCY. Read it before assuming anything is built, live, or broken. Update it at the end of any session with real findings, in the same labeling style — it currently runs through §27 (full test sweep) plus this session's later, un-numbered additions (Enterprise fair-use fix, header restoration).
- **Never say "done" without proof.** A local edit is not shipped. A local commit is not deployed. This session repeatedly distinguished "edited locally" vs. "committed locally, not pushed" vs. "pushed and confirmed live via a real Chrome check" — and got caught out once mid-session when files that looked unpushed turned out to already be locally committed by Sri. Always run `git log`/`git status` yourself rather than trusting your own memory of what you last did.
- **Git workflow limitation, every time:** this sandbox can edit files but cannot push to GitHub, and reliably leaves a stale `.git/index.lock` it can't delete (`rm` fails with "Operation not permitted"). Every handoff to Sri needs: `rm .git/index.lock`, then `git add <specific files>`, `git commit`, `git push origin main` — as a copy-paste block, no narration, per his explicit preference this session.
- **Never `git add -A`.** The sandbox's mounted git working tree has a persistent CRLF/LF normalization quirk that makes ~40 unrelated files show as "modified" with 100% line churn even though the content is byte-identical. Always check `git diff --stat --ignore-all-space -- <file>` before adding anything, and only stage files with real, non-whitespace diffs.
- **Doc-per-finding pattern.** Nearly everything substantive this session produced a saved file, not just a chat answer: `docs/testing/` for test-pass reports, `docs/product/` for business/feature/pricing review docs, `docs/marketing/` for outreach material, `docs/manual-db-changes/` for SQL Sri has to run himself in Neon's SQL Editor (this sandbox has no direct DB connection), `docs/research/` for market research briefs. Keep using this pattern — Sri references these back explicitly ("update thgis featur epricing doucment with this as well").
- **Ask, don't assume, on business/policy calls.** When the Enterprise "unlimited generations" cost-exposure issue came up, the fix required a real business decision (what fair-use ceiling, whether to change marketing copy) — that used `AskUserQuestion` rather than picking a number myself. Use it again for anything with real cost/legal/positioning consequences.
- **Verify live after every push.** After Sri says "deployed," don't just take his word for it either — this session used the Chrome DevTools MCP (`navigate` + `javascript_tool` reading computed styles / page text, plus `read_console_messages`) to independently confirm the actual change (black header, promo strip, CTA count) was really live and threw no console errors, before declaring it done.

### Standing hard constraints (do not relax these regardless of what's asked)

- Never test, enter, or even deliberately fail the login endpoint — no password value, real or fake, gets typed anywhere by you. This extends to not live-testing anything that would require authenticating as if you were the user.
- Never complete a real financial transaction (a live Stripe purchase) without Sri's fresh, explicit confirmation in that exact moment — a prior offer to pay doesn't carry forward.
- Never perform destructive/irreversible actions (account deletion) on the only test account without explicit, current permission.
- Never fabricate features, stats, trust badges, or customer counts. This project has been burned by exactly this before (a fake 4.8/500 rating in structured data, a marketed-but-unbuilt "AI visibility tracking" feature). If something is unverified, say so and check the code/DB before treating it as fact — this is also why the GEO research doc (Section 4 below) presents market-size estimates as a range across firms instead of picking one number.
- Never name the underlying AI vendor (Claude/Anthropic) in customer-facing copy or product UI — only in Privacy Policy sub-processor list, `/security`, `/ai-compliance`.
- SHIJO.AI is the public brand name; SHIRO Technologies LLC is the legal entity — it belongs only in Terms/Privacy/invoices, never in customer-facing copy.
- No changes to authentication, session handling, or credential rotation without explicit sign-off first.

## 3. Where things stand technically, right now

Confirmed live via direct Chrome checks as of the end of this session:

- Black header restored sitewide (`components/Header.tsx`) across all 12 pages that share it (homepage, blog, contact, legal pages, auth pages) — was a white header before this session, root-caused to an orphaned second Header component that never got swapped back in.
- `/ai-marketing-tools` (the actual Google Ads landing page — renamed from `/lp`, kept indexed on purpose for organic + paid) got a sticky header with a real Sign Up CTA (was Sign In only), a promo strip, and a dismissible sticky mobile CTA bar.
- Daily free-tier quota reset label fixed from a flat "Resets at midnight" (which was silently UTC-anchored, misleading for anyone outside UTC — Sri is IST) to a live "Resets in Xh Ym" countdown.
- ~19 API routes now return a short reference code (e.g. `GEN-8F2K`) on unexpected 500s instead of a bare "Internal server error," logged server-side too, so a bug report can be traced to its exact log line.
- Dashboard bell icon, previously fully decorative (permanent fake "unread" dot, no click handler), now opens a real panel: quick tips + a "Request a feature" box that lands in the same admin ticket queue as the Contact form.
- Enterprise's "Unlimited generations" now has a hidden fair-use ceiling (3,000/month) enforced server-side — chosen specifically because 9 of 12 tools run on Sonnet ($3/$15 per M tokens) and the old code had zero enforcement, meaning a single heavy/scripted account had no cost floor at all. Marketing copy updated in 3 places to "(fair use)" plus a Billing FAQ entry. Deliberately not shown as a visible counter, so it doesn't contradict "Unlimited" or become probeable.
- Full 43-case positive/negative test sweep run directly against production (not staging) — 40 clean, 3 low-risk findings in the registration endpoint (no server-side password-confirmation match check, no server-side email-format validation) — reported, not yet fixed, awaiting Sri's call.
- Full 32-table/298-column schema-drift audit — clean, no code/DB mismatches outside one already-fixed issue.

All of the above is committed locally and confirmed pushed + live as of this session ending — verify with `git log` and a live Chrome check anyway, don't just trust this document either.

## 4. Read these three documents next, in this order

1. `docs/product/2026-07-19-SHIJO-AI-Feature-Pricing-Review.docx` — what's built, how pricing/gating actually works, every upgrade CTA on the site, and the Enterprise cost-fix addendum.
2. `docs/product/2026-07-19-Feature-Brief-CodeCheck.docx` — Sri uploaded a business brief (`Shijo_AI_Business_Feature_Brief.docx`, based on Acquire.com market comps of comparable SaaS businesses) proposing 6 new feature directions: white-label/reseller packaging, local SEO/GBP tools, AI visibility/brand-mention tracking, marketing reporting/client dashboards, competitor/ad intelligence, and review/reputation management. This doc cross-checks each one against the actual codebase. **The headline finding:** two of these aren't clean-slate builds — `ai_visibility`/`ai_simulations` tables already exist in the DB with exactly the fields an AI-visibility-tracking feature would need (plus quota columns already provisioned to gate it by plan), and `rank_snapshots`/`seo_strategies`/`seo_tasks` give partial scaffolding for local-rank-tracking and client reporting respectively. All of it is currently dormant — never wired to any API route or UI. White-label, by contrast, has zero existing scaffolding — it's the biggest lift of the six despite having the strongest market comps.
3. `docs/research/2026-07-19-GEO-research-brief.docx` — Sri asked what "GEO" (Generative Engine Optimization) means, since the feature brief's own market comps used that term. Full research brief, no assumptions: what it is, the retrieve-then-synthesize mechanics of how LLMs actually select citations, market-size estimates from multiple firms (they disagree by 2-3x, reported honestly rather than picking one), real adoption numbers (ChatGPT ~900M weekly users, AI Overviews in ~60% of US Google queries, zero-click search over 58%), the real counter-argument (AI referral traffic is still ~1% of total, but converts 2-4.4x better), genuine unsolved problems (broken attribution, hallucination, negative-sentiment risk on Google AI Overviews specifically), and future outlook (agentic AI as the next inflection point, 2027-2028).

**My synthesis carried into this handoff, for whoever picks this up:** SHIJO.AI's "AI Overview Optimizer" tool already sits in exactly the category this market research describes, but it currently does a one-time optimization pass, not ongoing tracking — while the DB schema already has the tables for ongoing tracking, dormant and unused. That combination (real market pull + cheap-to-build data layer already in place) is the strongest opportunity found across the whole feature brief, arguably stronger than the brief's own #1-ranked recommendation (white-label), which has better revenue comps but a from-scratch data model. Renaming/repositioning the tool toward "AI visibility" or "GEO" language should happen *with* that tracking feature shipping, not before — marketing an ongoing-monitoring capability that doesn't exist yet would repeat the exact fabricated-capability mistake this project has been burned by before.

## 5. Open items — not yet decided or not yet done

- Registration endpoint: missing server-side password-confirmation match and email-format validation — reported, Sri hasn't said whether to fix.
- Which of the 6 catchy upgrade-CTA lines (cost-anchor / ROI / urgency framings, in the pricing-review doc) to actually roll out — none implemented yet, all proposed for review.
- Burst/rate-limit abuse protection: the Enterprise fair-use cap only catches sustained monthly abuse, not a fast burst — there's an unused `rate_limits` table already in the schema that would be the natural place to build this, not started.
- Admin panel has never been tested with real data — needs Sri to flip `is_admin = true` on a test account in Neon's SQL Editor, which he hasn't done yet.
- Post-midnight quota-reset behavior — the countdown fix was verified by reading the code and computing the current UTC/IST time gap, but nobody has watched it actually tick over to 0 used in real time yet.
- The feature-brief prioritization itself (Section 4, item 2) — which feature to scope first is Sri's call, not made yet.
- Whether/when to rename "AI Overview Optimizer" toward GEO/AI-visibility language (Section 4 synthesis) — tied to whichever feature gets built first.
