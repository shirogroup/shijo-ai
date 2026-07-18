# Live site click-through test — 2026-07-18

Tested by actually clicking every link on the deployed site via the Claude in
Chrome extension (not just reading code), per user request after they
reported hitting a 404.

## Confirmed bugs, fixed this pass

1. **`/ai-usage` 404 — this was almost certainly the 404 the user hit.**
   `components/landing/Footer.tsx` linked "AI Usage" in the site footer to
   `/ai-usage`, which has no matching route anywhere in `app/`. Confirmed by
   actually clicking it live — hard 404. Fixed to point at `/privacy#4`
   (the AI Data Processing section) until/unless a dedicated page is built.

2. **"New tools added monthly" stale claim** — removed from
   `components/landing/Features.tsx` per user request (was already flagged
   as inconsistent messaging for a 12-tool, not-actively-expanding lineup).

3. **Stale "24 AI tools" copy missed in the earlier sweep** —
   `components/landing/CTASection.tsx` still said "24 AI tools. One
   subscription..." in the bottom-of-page CTA subheading. Fixed to 12.

4. **Fabricated feature claims in "Built for Modern Enterprises" section**
   (`components/landing/UseCases.tsx`) — same category of problem as the
   trust badges removed in Phase 2, missed that pass because it's a
   different file. Claimed "200+ tracked keywords" and "AI visibility
   tracking" (implies rank-tracking / AI-mention-monitoring — both
   confirmed unbuilt per Product Handoff Rev2 Section 6, "New Features to
   Build"), and "Unlimited clients" / "White-label reports" (implies
   agency/client-management features that don't exist). Rewrote all four
   use-case cards to describe only what the 12 shipped tools actually do.

## Confirmed working

- Homepage loads clean, no console errors, correct 12-tool copy throughout.
- `/register`, `/login`, `/forgot-password` all load correctly.
- The new Terms/Privacy acceptance checkbox is live on `/register` — button
  correctly disabled until checked.
- `/terms`, `/privacy`, `/cookies` all load with July 17 2026 content
  (cookies page is dated March 24 2026 — wasn't touched this session,
  expected).
- Route protection confirmed live: `/dashboard`, `/dashboard/tools`, and the
  new `/admin/terms` all correctly redirect unauthenticated visitors to
  `/login?redirect=...` — the middleware update from the terms-tracking
  commit deployed correctly.
- Pricing section shows correct 12-tool, 2-free-tool, $29/$99 copy with
  working annual toggle math ($278/yr, $950/yr).

## Known, not re-tested this pass (already logged elsewhere)

- `/about` and `/pricing` and `/features` as bare routes still 404 — by
  design, these are anchors (`/#about` etc.) on the homepage, not real
  pages. The "About" anchor specifically points at a section that doesn't
  exist (no `id="about"` anywhere) — clicking it is a silent no-op, not a
  crash. Low priority; either build real About content or remove the nav
  item.
- Actual tool generation (the 12 AI tools producing real output) still not
  live-tested — blocked on the test account email, see SHIJO_AI_KB.md §13.
