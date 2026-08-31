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

---
---

# Second review — the Admin GEO/QA build prompt

*Same day, later. Reviewing the CONTEXT / SCOPE / BLOCKED RULE / DESTRUCTIVE-ACTION RULE /
INSPECT THEN BUILD / VERIFY / OUTPUT prompt that produced the admin GEO/QA section.*

## Verdict

Materially better than the first one, and it did something rare: **it prevented a production
bug before a line of code existed.** Three lines in particular carried that weight.

### The best line in the prompt

> *"First list every existing file under app/admin and how auth is enforced. If you cannot reuse
> that gate, STOP."*

This is the strongest instruction across both prompts. It forces inspection to complete before
building starts, and it names a specific stop condition rather than a vague "be careful". The
result was a documented finding — that `middleware.ts` gates `/admin/*` on session only, and the
real `isAdmin` check lives inline in all seven API routes — which then determined how the new
routes were written. Without that line the natural move would have been to invent a
`requireAdmin()` helper and end up with two competing auth patterns.

Generalise it: **"list what exists and how it works before adding to it; stop if you can't reuse
it."**

### The line that caught a real hazard

> *"Use that chrome, auth, and nav. Do not create a second admin."*

Naming the anti-goal ("a second admin") is more effective than describing the goal. It is the same
technique as the earlier exclusion list, applied to architecture rather than scope.

### The line that needs one word changed

> *"add column only if you can do it additively in `db/schema.ts` without generate"*

This test is **subtly wrong, and it matters.** Adding a column to `db/schema.ts` *is* additive in
code — it passes the stated test. But the live `geo_scans` table would not have that column, so
Drizzle would insert against a column that does not exist, and the **public `/geo` persistence
path would break silently**: visitors would still get results, nothing would save, and no error
would surface because persistence is wrapped in a best-effort try/catch.

The stated test measures the wrong thing. The right test is not "is the code change additive" but
**"does this require any change to the live database"**.

Suggested rewrite:

> Add the column only if it requires **no change to the live database**. If the live table would
> need an ALTER, do not add it to `db/schema.ts` at all in this pass — show me the SQL and stop.
> Assume any code that declares a column the table lacks will break writes on the public path.

The follow-up message resolved this correctly ("Do not generate or apply SQL... If nothing safe
exists, omit source and tag admin rows only in the UI"), but the first version would have passed
its own test while shipping the hazard.

### Also strong

- **"Treat Maya Yoga as a QA fixture, not a customer."** Prevented the obvious-but-wrong marker
  (prefixing `business_name`), which would have corrupted the case-study rows and broken the
  fixture lookup that matches on name.
- **"Do not add VPN tools, scraping, or a public 'unlimited scan' toggle."** Naming the tempting
  wrong answers is worth more than any amount of positive guidance.
- **"Pings = one tiny request per vendor."** A cost constraint stated as a design constraint.
- **VERIFY as a separate section.** Listing invariants to re-check after building — middleware,
  registry count, frozen files, public cap path — turns "did you break anything" into a
  checkable list rather than a judgement call.

## What still caused friction

**1. Two placement decisions with no tiebreak.**
*"Page /admin/geo-health (or /admin/geo if that fits siblings)"* and *"(same page or
/admin/geo/qa)"*. Flexibility is fine, but with no criterion the choice is arbitrary and you
cannot predict the result. Either decide, or give the rule: *"match whatever pattern the existing
siblings use."*

**2. No size checkpoint.**
The build came to eight new paths and roughly 1,400 lines in one pass. The BLOCKED RULE provided a
checkpoint at the *start*; there was none in the middle. For a build this size, worth adding:
*"If this will exceed ~6 files, list the file plan and wait before writing."*

**3. Nothing about post-build verification limits.**
The prompt asked for a build, and the build could not then be exercised — the pages need an admin
session and Vercel-only keys, and the dev server does not compile in this environment. That only
surfaced in the UNPROVEN section at the end. Adding *"state upfront what you will and will not be
able to verify yourself"* would surface it before the work, not after.

## The pattern across both reviews

Both prompts improved most where they **named the failure mode rather than the task**. The
strongest lines in each:

| Prompt | Line | What it prevented |
|---|---|---|
| First | "Change code only if a test cannot run without a one-line fix" | Verification silently becoming development |
| Second | "If you cannot reuse that gate, STOP" | A second, divergent auth pattern |
| Second | "Do not create a second admin" | Architectural duplication |
| Second | "Treat Maya Yoga as a QA fixture, not a customer" | Corrupting case-study data |

Every one of these is phrased as a prohibition with a specific consequence. That is the form worth
repeating.

## One habit to add

Both prompts asked for evidence but not for **counter-evidence**. Consider adding:

> For each PASS, state what you actually observed. If you did not observe it directly, say so and
> label it inferred.

The distinction between "I ran this and saw it" and "I read the code and believe it" is where
over-claiming creeps in, and a prompt can close that gap cheaply.

---
---

# Third review — the four-fix prompt, and its verification pair

*Reviewing the FIXES prompt (Perplexity ping / DataForSEO location / Gemini timeout /
maxDuration) together with the CHECKS prompt that followed it.*

## Verdict

The strongest pair of prompts in this project. The FIXES prompt did something none of the earlier
ones did: **it supplied the diagnosis, not just the symptom**, and it was right.

## What made it work

### 1. You separated the failure classes yourself

> *"Perplexity ping 400 (not 401)... so the Perplexity KEY is fine."*
> *"DataForSEO cells status 40501 = invalid field, not auth (40100). Ping 200 so credentials are fine."*

This is the highest-value thing a prompt can contain: **evidence already reasoned about**. You did
not say "Perplexity is broken, fix it" — you said which failure class it was, which excluded the
whole space of credential fixes before I started. Both diagnoses were confirmed exactly.

Result: the fixes took one pass with no wrong turns.

### 2. You forbade the specific wrong answer

> *"Do not guess a second invalid string."*

This is the line I'd single out. The obvious move was to swap `"Austin,United States"` for
`"Austin,Texas,United States"` — plausible, and the prompt even offered it. But it would still have
been unverified, and a wrong guess costs a full scan and $0.28 to discover.

That one sentence made `location_code: 2840` the correct choice: a documented numeric identifier
that cannot be malformed, versus a string I could not confirm. The result — 40501 gone, DataForSEO
answering — vindicated it.

**Generalise:** when you know a fix has a tempting-but-unverifiable form, forbid it by name.

### 3. You gave a source and required confirmation against it

> *"Confirm against https://docs.dataforseo.com/v3/appendix-errors/ and their locations list."*

Turning a claim into a checkable one. The error page confirmed 40501 verbatim ("invalid field: one
of the fields in the POST request is invalid"). The locations list I could **not** reach — their
AI Mode page is marketing copy with no spec — and that gap is exactly what made the "don't guess"
rule bite. Both halves of your instruction did work: one confirmed, one revealed a hole.

### 4. The CHECKS prompt gated on deployment

> *"1. Confirm production is on the commit that contains those four diffs (print SHA)."*

Making check 1 a gate rather than a formality meant the whole run stopped correctly when the fixes
were still uncommitted, rather than spending $0.28 measuring stale code. A test that runs against
the wrong build is worse than no test — it produces numbers that look like evidence.

## What I got wrong, and what the prompt could have caught

I reported "health.ts fix NOT deployed" from a grep for `max_tokens: 1`, which **also matches the
Claude ping** — a block I had deliberately left alone. The fix was deployed; my check was wrong.

The prompt could not reasonably have anticipated that, but a habit would have:

> When a check fails, show the matching line before concluding.

Had I printed the match, the Claude context would have been obvious immediately. Cheap rule,
prevents a whole class of false alarms.

## What the results say about the fixes themselves

| Fix | Outcome |
|---|---|
| Perplexity ping | **Confirmed.** 400 → 200. |
| DataForSEO location | **Confirmed at the API level.** 40501 gone, 4 of 8 cells now return content — up from 0 of 8. |
| Gemini timeout 25s → 45s | **Insufficient.** Still 5 of 8 timeouts. The ceiling was not the binding constraint. |
| maxDuration 120 → 240 | **Necessary, and closer than expected.** The scan took 172s. At the old 120s it would have died. |

The two "partial" outcomes are the interesting ones, and neither is a failure of the prompt — they
are what happens when a fix reveals the next constraint. Raising Gemini's ceiling proved the
timeouts are not about patience. Fixing DataForSEO made it do real work, which pushed the total
duration to within 68s of the new ceiling.

## The pattern, restated

Across three reviews the prompts have improved by moving up a ladder:

1. **Name the task** — weakest.
2. **Name the failure mode** — "change code only if a test cannot run".
3. **Name the wrong answer** — "do not guess a second invalid string".
4. **Supply the diagnosis and require confirmation against a source** — this prompt.

Level 4 is where a prompt stops being instructions and starts being collaboration. It is also the
only level that reliably produces one-pass fixes, because the expensive part — deciding what is
actually broken — is already settled before any code is touched.

---
---

# Fourth review — Phase A results, and the multi-phase prompts

*2026-08-31, after deploying `3926970` (entitlements, Plus plan, scan quality fixes).*

## The results, first

| Fix | Before | After | Verdict |
|---|---|---|---|
| DataForSEO detector exemption | 4/8 scorable, 4 false "clarifying question" | **8/8, zero errors** | **Worked completely** |
| Gemini sampling 4/8 | 3/8 scorable, 5 timeouts | 4 asked (1 ok, 3 timeout), 4 correctly "not asked" | **Mechanism works, problem doesn't** |
| Scan duration | 172s | **146s** | Improved, still high |
| Perplexity | 7 mentions | 7 mentions | Stable, best engine |

**The DataForSEO fix is the clean win.** Exempting the engine rather than tightening patterns was
the right call: zero errors across 8 cells, real AI Overview prose about Austin restaurants coming
through as scorable answers.

**Gemini is the honest failure.** The sampling mechanism worked exactly as designed — 4 prompts
asked, 4 recorded as "Not asked", clearly distinguishable from failures. But of the 4 actually
asked, **3 still timed out at exactly 45.00s**. Success rate went from 3/8 to 1/4. Sampling
reduced the *cost* of Gemini being broken without fixing Gemini being broken.

That is worth stating plainly rather than filing as a win. The fix did what it was designed to do
and the underlying problem is untouched.

## What the prompts got right

**The measured-evidence pattern held.** Both fixes came from reading stored production data — cell
snippets for the detector, per-cell latency for Gemini — not from guessing. The DataForSEO fix
worked *because* the evidence identified the mechanism (editorial prose tripping a chat heuristic,
with no domain to trigger the escape hatch).

**"Do not raise maxDuration above 240"** was a good constraint. It forced sampling rather than
another timeout increase, and sampling was the better answer even though it did not solve Gemini.
A timeout raise would have hidden the problem behind a longer wait.

**Phasing with explicit gates** worked. Phase A shipped and got verified before Phase B built on
it. The alternative — one large commit — would have made this Gemini result impossible to
attribute.

## What the multi-phase prompts cost

The A/B/C phase prompts each asked for more than fitted in one pass, and the >8-file rule kept
firing. That rule is good, but it means a prompt that plans four phases will reliably stop in
phase two. Two options, both fine, but worth choosing deliberately:

- **Scope each prompt to one phase** and accept more round trips.
- **Keep the multi-phase plan** as context but ask for only the next phase's work.

The second is probably better: the plan is genuinely useful context even when only part of it gets
built.

## The environment-split mistake, which was mine

I proposed a Production/Preview split for Stripe price ids without first checking whether a test
Stripe key existed. It does not — `STRIPE_SECRET_KEY` is scoped All Environments and is the live
key. So Preview is not a test environment, test-mode ids would fail everywhere, and the split I
recommended could never have worked. That cost a round trip and some confusion.

**The rule I should have applied:** before recommending a configuration split, verify the thing
being split actually differs across the two sides. A prompt cannot reasonably catch this; it is
the assistant's job.

## Still open

- **Gemini**: 3 of 4 asked prompts time out at 45s. Not a patience problem. Needs investigation of
  the request itself, or dropping Gemini to 2 prompts, or accepting it as a partial engine.
- **Duration 146s** against a 240s ceiling. Better than 172s but not comfortable.
- `/pricing` and `/features` still 404; Plus is not purchasable.
