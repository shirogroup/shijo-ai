# SHIJO.AI — paste this to start the next Cowork session

Continuing work on SHIJO.AI (repo `shirogroup/shijo-ai`, local path `apps/shijo-ai`, live at shijo.ai). Before doing anything else, read `SHIJO_AI_KB.md` in the project root — it's the durable status file, labeled CONFIRMED / UNKNOWN / DISCREPANCY. Don't assume project state from memory; verify against the KB and the actual repo.

**Git state as of 2026-07-18 (verify again, don't trust this blindly):** local HEAD and `origin/main` matched at commit `298f2c1` ("Rename /lp to /ai-marketing-tools, ad copy fixes") — that work is live. One thing was still uncommitted: `public/brand/` (three generated logo PNGs — square, landscape, transparent icon). If that hasn't been pushed yet, it needs `git add -A && git commit -m "Add brand logo PNG assets" && git push origin main` from your own Git Bash (the sandbox can't push).

**Top unresolved priority (§0 in the KB, unchanged):** Vercel flagged several env vars ("Needs Attention") tied to the April 2026 Vercel breach — `ANTHROPIC_API_KEY`, `JWT_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, DB credentials. Rotation is on hold per your explicit instruction ("let's not rotate anything until we test it ourselves") — don't act on this without a fresh go-ahead.

**Other still-open items (see KB §9 for full list):**
- Stripe test/live key mismatch — local `.env.local` is test-mode against live-mode price IDs; unverified whether Vercel production has the same mismatch. Needs you to check the Vercel dashboard directly.
- Resend API key presence in Vercel production — unverified, likely explains why password-reset/welcome emails may be silently failing.
- Live end-to-end testing never done: registration → terms acceptance email, account export/delete, contact form → ticket → admin panel → resolution email. All code-complete, none tested against the real live DB.
- Middleware JWT signature verification gap — on hold per your instruction, not fixed.

**Google Ads campaign setup, in progress this session:**
- Business name field → use **SHIJO.AI** (confirmed: product/payments/checkout all show SHIJO.AI; SHIRO Technologies LLC stays as the legal entity in Terms/Privacy/invoices only).
- Final URL should point to `shijo.ai/ai-marketing-tools` (the `/lp` slug still redirects there permanently, but update it directly where you can).
- 6 Sitelinks recommendations were delivered (Pricing, Start Free, Blog, 12 AI Tools, Contact Us, Security & Privacy) — not yet confirmed entered into the account.
- Logo assets for ad creative live in `public/brand/` in the repo: square, landscape, and transparent-icon PNGs, generated from the site's actual SVG logo.
- Still open: finish Callouts and Lead forms sections of the campaign if you want them (currently unchecked in the screenshot you shared).

Pick up wherever you left off — ask me what's next rather than assuming.
