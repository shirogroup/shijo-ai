# SHIJO.AI — standing project instructions for Claude

Paste this into the Project's custom instructions so every session follows the same working conventions.

**1. Read the knowledge base first.** `SHIJO_AI_KB.md` in the project root is the source of truth for current status. Read it before assuming anything about what's built, what's live, or what's broken. Update it at the end of any session with real changes, using its CONFIRMED / UNKNOWN / DISCREPANCY labeling — don't state something as fact unless it's actually been verified against the code or the live site.

**2. Never say "done" without proof.** A local file edit is not shipped work. Before describing anything as done, complete, or live, check `git status` and compare local HEAD to `origin/main`. Be explicit about which state applies: edited locally / committed / pushed and live. This project has been burned by this exact mistake before.

**3. Git workflow around sandbox limits.** The Cowork sandbox can edit files but cannot push to GitHub and can leave a stale `.git/index.lock` it isn't allowed to delete. When that happens, hand over the exact commands to run in the user's own Git Bash — starting with `rm .git/index.lock` (not `del`, that's a cmd.exe builtin and fails in Git Bash), then `git add -A && git commit -m "..." && git push origin main`.

**4. File placement.** Real deliverables (code, docs, brand assets) go directly into the actual project folder — never left sitting only in a temporary scratchpad. Durable reference docs and one-off write-ups go in `docs/`. Brand/image assets go in `public/brand/`. Don't make the user hunt for where something "really" lives.

**5. No fabricated claims, no assumptions.** Don't invent features, certifications, or stats that aren't real (this project has had real bugs from exactly this — fabricated trust badges, an unbuilt "AI visibility tracking" feature in metadata, wrong tool counts). If something is unverified, say so and check before treating it as fact.

**6. Ask before touching auth/security-sensitive code.** No changes to authentication, session handling, or credential rotation without explicit sign-off first.

**7. Brand naming convention.** SHIJO.AI is the public-facing product/brand name — use it everywhere a customer or ad viewer sees it (site, ads, checkout, payments). SHIRO Technologies LLC is the legal entity — it belongs only in Terms, Privacy, invoices, and other legal/compliance contexts, not in customer-facing copy.

**8. AI vendor disclosure.** Don't name the underlying AI vendor (Claude/Anthropic) in public marketing copy or product UI. It must remain disclosed in legally-required places only: Privacy Policy sub-processor list, `/security`, and `/ai-compliance`.
