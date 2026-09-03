# Next session prompt — written 2026-09-03

**State in one line:** commit `7753d91` is on `origin/main` and deployed; it fixes upgrade-purchase
tracking, but **it has never fired in production**, so it is not proven. Everything else waits on that.

Read first: `SHIJO_AI_KB.md` §68, and `docs/handoff/2026-09-03-ads-purchase-tracking-handoff.md`.

---

## Paste this to start the session

> Continue the SHIJO.AI Google Ads work. Read `SHIJO_AI_KB.md` §68 and
> `docs/handoff/2026-09-03-ads-purchase-tracking-handoff.md` first — they are current as of 3 Sep
> and verified.
>
> **Scope: Google Ads and conversion tracking. No SEO work, no Stripe config changes, no new features.**
>
> Standing constraints, unchanged:
> - Ads freeze on `/ai-marketing-tools` and `/lp`. $29 and $199 and the Hero stay.
> - Registry stays 12 tools.
> - Do not touch Stripe config, `app/layout.tsx`, `next.config.ts`, `app/register`, `middleware.ts`, `db/`.
> - Both Ahrefs installs stay — deliberate, do not "fix".
> - Ask before any auth/session/credential change.
> - Show me anything that changes the live Ads account **before** saving it.
> - No fabricated claims. If something is unverified, say UNVERIFIED.
> - Never say "done" without checking local HEAD vs `origin/main`.
> - SHIJO.AI is the public brand; SHIRO Technologies LLC is legal-only. Do not name the AI vendor in
>   public copy.
>
> Do these in order and stop at the first one that blocks:
>
> 1. **Verify the upgrade-purchase fix works.** I will make a real upgrade payment. Then confirm in
>    Google Ads that the Purchase conversion recorded **exactly once**, with the real dollar value,
>    `currency = USD`, and a populated `transaction_id` starting `in_`. If it did not fire, debug
>    `/api/billing/verify-upgrade` and `/dashboard/billing` — commit `7753d91`, live but never proven.
> 2. **Only after Purchase records:** configure Enhanced Conversions on the Purchase action (currently
>    Not configured), and verify the Purchase conversion label ownership for type ID `7688514951`.
> 3. **Add an audience signal to PMax.** The 48-hour learning window from the 2 Sep budget change is
>    now open. The asset group reads "No audience signals provided". Build a custom segment from
>    Cluster A terms: `meta description generator`, `ai seo tools`, `keyword research tool`. Show me
>    before saving.
> 4. **Turn AI Max Final URL expansion OFF** on the Search campaign (24185975752). 22 clicks, $6.13,
>    0 conversions. The last two sessions this was blocked by the settings panel hanging on "Loading
>    name / Loading summary" — I will disable ad blockers for `ads.google.com` first. If it still
>    hangs after 3 tries, stop and tell me.
> 5. **Check coupon pace.** Report qualifying spend to date against the $500 / 16 Sep target and tell
>    me plainly whether the current $42/day cap gets there. If not, tell me exactly what to raise.
> 6. **Rename the asset `CamShijo AI Landing Page`** — typo, appears in every export.
> 7. **AEO/GEO keyword research using free sources only.** I am on the free Ahrefs plan — Keywords
>    Explorer is paid, do not plan around it. Use Google Ads Keyword Planner, the existing 833-term
>    search terms report, and `docs/marketing/2026-08-23-keyword-clusters.csv`. Give me a proposed
>    ad-group structure with actual bid estimates, not a keyword dump.
>
> Not in scope this session unless I say so: the $39 one-off report route, GCLID capture, public tool
> landing pages, deleting the lead form asset (I need to export the leads CSV first).
>
> End the session by updating `SHIJO_AI_KB.md` and `docs/handoff/` with what actually changed.

---

## Things Sri owes before or during the session

| Item | Why it blocks |
|---|---|
| **One real upgrade payment** | Nothing else can be trusted until Purchase fires once. |
| **Disable ad blockers for `ads.google.com`** | The campaign settings panel has hung ~15 times over two days; the page itself says "Turn off ad blockers". Blocks the AI Max change. |
| **Export the leads CSV** | Deleting the lead form asset is the only way to stop the `Submit lead form` "Misconfigured" badge regenerating — and deleting loses the leads. |
| **Complete "Confirm it's you" re-auth** | Fires on every asset-group save. The session cannot do it. |
| **AI-generated labels on both videos** | Both confirmed AI-made; Google requires the label. |
| **6 videos + 9 images** | Listed in the handoff. Agreed 2 Sep, not delivered. |

## Hard "do nots"

- **Do not make another Google Ads payment.** Account is at **$112.23 credit** with "No upcoming
  payments". The coupon counts *spend*, not payments.
- **Do not build a landing page for the $39 one-off report.** It has `cta: null` and no route — it
  cannot be bought. Paid clicks would hit a dead end (§68.5).
- **Do not trust Google's auto-generated ad assets.** It generated four false headlines on 2 Sep that
  went live before being caught (§68.8).
