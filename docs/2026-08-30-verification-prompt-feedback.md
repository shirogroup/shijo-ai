# Feedback on the verification prompt

*2026-08-30 · Reviewing the "No assumptions / thorough code review" prompt used for the GEO verification pass*

---

## The prompt being reviewed

> \# Like I said before. No assumptions and we need a thorough code review as I see there are many coding issues you have missed and we find out when we build it.
> \# Do not start pricing, Stripe, registry-13, or Perplexity Agent API.
> I believe lint/tsc and Vercel env vars are already done. Verify that. Then test. Change code only if a test cannot run without a one-line fix; if you fix anything, list the file.
> 1) Repo health … 2) Local /geo smoke … 3) Ads freeze … 4) Deployed …
> Reply as a checklist only: …
> \# Give me the complete details I can review once you are done

---

## Verdict

This was a **strong prompt** — well above average for directing an agent through a verification pass. It produced a genuinely useful result. Four things in it did real work, and five things caused avoidable friction.

The single most valuable line was:

> *"Change code only if a test cannot run without a one-line fix; if you fix anything, list the file."*

That is the sentence that kept a verification pass from silently becoming a development pass. Keep it in every future review prompt, verbatim.

---

## What worked, and why

### 1. An explicit exclusion list

> *"Do not start pricing, Stripe, registry-13, or Perplexity Agent API."*

Naming forbidden work is more effective than describing allowed work, because it removes judgement calls at exactly the moments where drift starts. "Registry-13" is a good example: it names a *specific tempting change* rather than a category.

### 2. Stating your belief, then asking for verification

> *"I believe lint/tsc and Vercel env vars are already done. Verify that."*

This is better than "check lint/tsc" because it makes the expected answer explicit, so a mismatch is visible rather than buried. It also stops the agent re-litigating settled ground.

Worth knowing: this framing carries a mild risk of confirmation bias — an agent may be inclined to agree with a stated belief. It did not happen here (env vars came back partially contradicting the belief), but pairing it with *"tell me if I'm wrong"* makes that explicit.

### 3. A fixed output schema

> *"Reply as a checklist only: - lint: pass/fail + first error - tsc: … - migration file path - …"*

Naming the exact fields makes the reply *checkable*. You can see at a glance whether a field was answered or dodged. `"pass/fail + first error"` is particularly good — it bounds output length while preserving the diagnostic detail that matters.

### 4. Security instinct on secrets

> *"Confirm these env names exist (boolean only, never print values)"*

Correct and worth keeping as a standing rule. There is no case where a verification report needs a key's value.

---

## What caused friction

### 1. Two instructions about drizzle that contradicted each other

> *"If generate was not run, run `npx drizzle-kit generate` only. Do not apply a destructive migrate to production unless I already use the project's normal migrate path — then use that same path."*

The first clause says run it. The second says the project's existing path takes precedence — and in this repo those two point in opposite directions, because the drizzle snapshot is seven months stale.

Running `generate` would have written a 122-line migration containing 7 `CREATE TABLE` (5 for tables that already exist) and 13 `ALTER TABLE` (8 adding columns to `users` that already exist). Applying it would fail partway through.

Resolving this required running `generate` in a throwaway copy to see what it produced before deciding. That was the right call, but the prompt did not ask for it — it was inferred.

**Better:**

> If a migration appears to be missing, do not run `generate` against the repo. Run it in a scratch copy, show me the statement counts and any ALTER/DROP against existing tables, and wait for my decision.

### 2. A step that assumed the local environment could run

> *"2) Local /geo smoke — Start or use the existing next dev server."*

This was not possible, for two independent reasons neither of us had established: seven of the eight API keys exist only in Vercel Production, and `next dev` does not finish compiling in the sandbox's mounted filesystem.

The prompt had no fallback, so the choice was between reporting BLOCKED or silently substituting a production test. (I reported BLOCKED and tested production separately, flagged as such.)

**Better:**

> If a step cannot run, report BLOCKED with the specific reason and do not substitute a different test without labelling it. If local cannot run, say so and test production instead, marked clearly.

### 3. An ambiguous scope on "env names exist"

> *"Confirm these env names exist"*

Exist *where*? Local `.env`, or Vercel? These differ, and the difference mattered — all eight are in Vercel, only one is local. I checked both, but a narrower reading would have produced a misleading "missing" verdict.

**Better:** *"Confirm these names exist in Vercel Production, and separately in local .env. Report the two lists apart."*

### 4. Two directly opposed formatting instructions

> *"Reply as a checklist only"* … *"Give me the complete details I can review once you are done"*

These cannot both be satisfied. A checklist-only reply is not complete details; complete details are not a checklist.

**Better:** *"Lead with the checklist. Then a Details section below it, with evidence for anything that is not a plain PASS."*

### 5. "Confirm X is unchanged" without stating the baseline

> *"Frozen files from the GEO brief must be unmodified vs the GEO commit."*

Unmodified compared to what — the commit that introduced GEO, or the state before it? I checked both (`b88b5c0` and `cc68617`, both clean), but the ambiguity meant guessing at intent.

**Better:** name the baseline commit explicitly, or say "compare against both the pre-feature and post-feature commits and report each."

---

## The pattern worth adopting

Across the whole session, the prompts that produced the best results shared one property: **they made the failure mode explicit.**

Compare:

| Weaker | Stronger |
|---|---|
| "Check the ads pages" | "Confirm they still say 12 tools and $29 / $199 where they did before" |
| "Test /geo" | "Confirm a second submit from the same IP is capped without calling engines" |
| "Review the code" | "Change code only if a test cannot run without a one-line fix" |

The stronger version in each row names *what wrong would look like*. That is what makes a check falsifiable rather than decorative.

---

## A revised template

```
CONTEXT
  Repo: <path>. Branch: <branch>. Baseline commit for "unchanged": <sha>.
  I believe <X, Y> are already done — verify, and tell me if I am wrong.

SCOPE
  Do not start: <explicit list>.
  Change code only if a check cannot run without a one-line fix.
  If you change anything, list every file.
  Do not commit or push unless I say so.

BLOCKED RULE
  If a step cannot run, report BLOCKED with the specific reason.
  Do not substitute a different test without labelling it as a substitute.

DESTRUCTIVE-ACTION RULE
  For anything that writes to production or generates a migration:
  show me what it WOULD do first, then wait.

CHECKS
  1. <check>   expect: <specific expected value>
  2. <check>   expect: <specific expected value>

OUTPUT
  Lead with a checklist using exactly these fields: <fields>.
  Then a Details section with evidence for anything not a plain PASS.
  End with: what remains UNPROVEN and what would prove it.
```

The last line is the one I would most encourage adding. "What remains unproven" is where the real risk lives, and without a field for it, an agent's natural pull is toward a clean summary that overstates certainty.

---

## Applied to where things actually stand

Using that final field on this pass:

**Proven:** lint, tsc, 151 automated assertions, ads-page invariants, frozen-file audit, registry count, the IP cap short-circuiting before any paid call, and that `geo_scans` is live and queryable in production.

**Unproven:** that the five engine API keys in Vercel actually work. Every scan so far predates them. The one stored row (`identity_resolved = f`, `band = 'absent'`, `score = 0`) was written at 16:54 UTC, eighteen minutes *before* the identity gate shipped at 17:12 UTC — so it is a record of the old bug, not a test of the fix. Both the identity gate and the non-answer detection are deployed and have never been exercised by a real scan.

**What would prove it:** one scan after 00:00 UTC from an IP that has not scanned that day.
