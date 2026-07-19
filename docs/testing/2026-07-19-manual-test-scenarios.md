# Manual Test Scenarios — 2026-07-19

Test account: `srikanth@shiroapps.com` (Free plan). Captured so these exact
inputs can be reused for regression testing later, or repurposed as
outreach/example content (see also `docs/marketing/SHIJO-AI-One-Pager.docx`,
which already uses two of the outputs below).

## Free tools — happy path

**Post Caption Generator**
| Field | Value |
|---|---|
| Topic or Product | Launch of a new AI-powered SEO tool for small businesses |
| Platform | LinkedIn |
| Brand Voice | Professional, confident |
| Goal | Awareness |

Result: 5 LinkedIn caption variations, hook + body + CTA + hashtags. Used in the one-pager.

| Field | Value |
|---|---|
| Topic or Product | Free trial promo for a project management app |
| Platform | Twitter/X |
| Brand Voice | Witty, casual |
| Goal | Sales |

Result: 5 witty Twitter/X captions, all under character limits, with hashtags.

**SEO Meta Generator**
| Field | Value |
|---|---|
| Page Topic | Best CRM software for small businesses in 2026 |
| Target Keyword | best crm for small business |
| Page Type | Blog Post |
| Brand Name | Shijo.ai |

Result: 5 title tag + meta description variations, each labeled by strategy (value, urgency, etc.), correct character counts. Used in the one-pager.

## Edge cases / regression checks

1. **Optional fields left blank** (Platform, Brand Voice, Goal on Post Caption Generator; Page Type, Brand Name on SEO Meta Generator) — only the one field marked `required: true` in the registry (Topic/Page Topic) should be enforced. Confirms the fix for the force-required-fields bug (fixed 2026-07-19, commit `8144d3b`).
2. **Daily quota exhaustion** — run 3 generations on a Free account back to back, then attempt a 4th. Expect: clean "Daily limit reached — Upgrade to Pro ($29/mo) for 200 generations/month across all 12 tools" message, no crash, no bypass.
3. **Locked-tool direct access** — navigate straight to `/dashboard/tools/keyword-research` (or any Pro-only tool) as a Free-plan user. Expect: "Pro Tool" locked placeholder with a "View Plans" link, not the input form. Confirms `checkToolAccess` gating can't be bypassed via URL.
4. **Stripe checkout** — click "Upgrade to Pro" from `/dashboard/billing`. Expect: redirect to `checkout.stripe.com/c/pay/cs_live_...` (the `cs_live_` prefix confirms live-mode Stripe). Cancel before entering payment info to avoid a real charge; confirms the checkout-session creation path (including the stale-customer-ID self-heal fix, commit `7f91700`) works without needing an actual purchase.
5. **Data export** — Settings → "Export my data". Expect: `GET /api/account/export` returns 200 (not 500) and downloads a JSON file. This surfaced the `keyword_clusters.name` schema-drift bug (fixed via DB migration `docs/manual-db-changes/2026-07-19-keyword-clusters-name-column.sql`, no code change needed) — worth re-running after any future schema change as a canary, since it touches nearly every user-owned table in one request.

## Known state as of this test run
All of the above passed after the fixes landed (commits `7f91700`, `b139bcc`, `8144d3b`, plus the `keyword_clusters` DB migration). Full narrative writeup with root causes lives in `SHIJO_AI_KB.md` §§21-25.
