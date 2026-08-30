#!/usr/bin/env bash
# ============================================================================
# SHIJO.AI — GEO pass verification
# Created 2026-08-29.
#
# Checks everything the /geo build pass was supposed to do, and everything it
# was supposed to NOT do. Read-only: makes no edits, no network calls to paid
# APIs, no commits, no pushes.
#
# Run from the app root in Git Bash:
#   bash scripts/verify-geo-pass.sh
#
# Exit code 0 = all required checks passed. 1 = at least one FAIL.
# WARN lines are informational and do not fail the run.
# ============================================================================

cd "$(dirname "$0")/.." || exit 1

PASS=0; FAIL=0; WARN=0
ok()   { echo "  PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }
warn() { echo "  WARN  $1"; WARN=$((WARN+1)); }
hdr()  { echo; echo "=== $1 ==="; }

# ---------------------------------------------------------------------------
hdr "1. New files present (16 expected)"
NEW_FILES="
app/geo/page.tsx
app/geo/GeoChecker.tsx
app/api/geo/scan/route.ts
app/dashboard/tools/geo-visibility-checker/page.tsx
lib/geo/types.ts
lib/geo/prompts.ts
lib/geo/places.ts
lib/geo/scoring.ts
lib/geo/budget.ts
lib/geo/orchestrator.ts
lib/geo/engines/shared.ts
lib/geo/engines/claude.ts
lib/geo/engines/openai.ts
lib/geo/engines/gemini.ts
lib/geo/engines/perplexity.ts
lib/geo/engines/dataforseo.ts
"
MISSING=0
for f in $NEW_FILES; do
  [ -f "$f" ] || { echo "        missing: $f"; MISSING=$((MISSING+1)); }
done
[ $MISSING -eq 0 ] && ok "all 16 GEO source files present" \
                   || bad "$MISSING GEO source file(s) missing"

[ -f docs/manual-db-changes/2026-08-29-geo-checker-tables.sql ] \
  && ok "hand-written SQL migration present" \
  || bad "docs/manual-db-changes/2026-08-29-geo-checker-tables.sql missing"

# ---------------------------------------------------------------------------
hdr "2. ADS FREEZE audit (must be zero)"
FROZEN="app/layout.tsx
next.config.ts
app/register/page.tsx
app/ai-marketing-tools/page.tsx
components/lp/LandingPageContent.tsx
components/landing/Hero.tsx
components/landing/Pricing.tsx
components/landing/CTASection.tsx
components/landing/UseCases.tsx
app/contact/page.tsx
components/Footer.tsx
lib/seo-config.ts
lib/stripe.ts
lib/tools/registry.ts
middleware.ts"

# Compare against origin/main so this holds true before AND after committing.
CHANGED=$(git diff --name-only origin/main 2>/dev/null; git status --porcelain 2>/dev/null | awk '{print $2}')
VIOL=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  echo "$CHANGED" | grep -qx "$f" && { echo "        touched: $f"; VIOL=$((VIOL+1)); }
done <<< "$FROZEN"
for d in lib/stripe app/api/stripe app/api/billing app/api/webhooks/stripe; do
  echo "$CHANGED" | grep -q "^$d/" && { echo "        touched under: $d/"; VIOL=$((VIOL+1)); }
done
[ $VIOL -eq 0 ] && ok "zero frozen files modified" \
                || bad "$VIOL frozen path(s) modified — REVERT before pushing"

# ---------------------------------------------------------------------------
hdr "3. Invariants that public copy depends on"
TOOLS=$(grep -cE "^    id: '" lib/tools/registry.ts)
[ "$TOOLS" = "12" ] && ok "registry still has exactly 12 tools" \
                    || bad "registry has $TOOLS tools — every '12 tools' claim is now wrong (AUTO-001)"

grep -q "matcher: \['/dashboard/:path\*', '/admin/:path\*'\]" middleware.ts \
  && ok "middleware matcher unchanged — /geo is public" \
  || bad "middleware matcher changed — /geo may now require login"

grep -q "geo" app/dashboard/tools/geo-visibility-checker/page.tsx 2>/dev/null \
  && ok "dashboard shim present (static segment, does not touch [toolId])" \
  || warn "dashboard shim not found"

# ---------------------------------------------------------------------------
hdr "4. Sitemap"
grep -q 'baseUrl}/geo' app/sitemap.ts \
  && ok "/geo added to sitemap" || bad "/geo missing from sitemap"
if grep -qE 'baseUrl\}/(pricing|features)' app/sitemap.ts; then
  bad "sitemap contains /pricing or /features — both are 404s on production"
else
  ok "no fake /pricing or /features URLs in sitemap"
fi

# ---------------------------------------------------------------------------
hdr "5. Type-error fixes applied"
grep -q "Boolean(!cell || cell.error || cell.skipped)" app/geo/GeoChecker.tsx \
  && ok "GeoChecker disabled-prop fix applied" \
  || bad "GeoChecker Boolean() fix missing — TS2322 will return"

if grep -qE "\b(name|email|subject|message)\.trim\(\)" app/api/contact/route.ts; then
  bad "contact route still has bare .trim() on optional fields — TS18048 will return"
else
  ok "contact route: all call sites use safeName/safeEmail/safeSubject/safeMessage"
fi

# ---------------------------------------------------------------------------
hdr "6. Stale build cache"
if [ -d .next/types/app/api/keywords ]; then
  warn ".next/types references app/api/keywords which no longer exists — run: rm -rf .next"
else
  ok "no stale .next/types/app/api/keywords cache"
fi

# ---------------------------------------------------------------------------
hdr "7. Lint + typecheck (the real gate)"
if [ ! -x node_modules/.bin/next ] && [ ! -f node_modules/.bin/next ]; then
  warn "node_modules incomplete — run 'npm ci' first, then re-run this script"
else
  echo "  ... running next lint"
  if npm run lint >/tmp/geo_lint.log 2>&1; then
    if grep -qE "app/geo|lib/geo|app/api/geo" /tmp/geo_lint.log; then
      bad "lint reported issues in GEO files (see /tmp/geo_lint.log)"
    else
      ok "lint clean for GEO files"
    fi
  else
    bad "npm run lint failed (see /tmp/geo_lint.log)"
  fi

  echo "  ... running tsc --noEmit (slow)"
  if npx tsc --noEmit >/tmp/geo_tsc.log 2>&1; then
    ok "tsc --noEmit: zero errors"
  else
    N=$(grep -cE "error TS" /tmp/geo_tsc.log)
    bad "tsc --noEmit: $N error(s) — see /tmp/geo_tsc.log"
    grep -E "error TS" /tmp/geo_tsc.log | head -8 | sed 's/^/        /'
  fi
fi

# ---------------------------------------------------------------------------
hdr "8. Environment keys (names only — values are never read or printed)"
ENVF=""
[ -f .env.local ] && ENVF=".env.local"
[ -f .env ] && ENVF="$ENVF .env"
for v in ANTHROPIC_API_KEY OPENAI_API_KEY GEMINI_API_KEY PERPLEXITY_API_KEY \
         DATAFORSEO_LOGIN DATAFORSEO_PASSWORD GOOGLE_PLACES_API_KEY GEO_DAILY_BUDGET_USD; do
  if [ -n "$ENVF" ] && grep -qhE "^$v=" $ENVF 2>/dev/null; then
    echo "  present   $v"
  else
    echo "  MISSING   $v   (engine degrades to 'not checked')"
  fi
done
echo "  note: local .env is not what production uses — confirm these in Vercel too."

# ---------------------------------------------------------------------------
hdr "9. Git state"
git fetch origin --quiet 2>/dev/null
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
echo "  local is $AHEAD commit(s) ahead, $BEHIND behind origin/main"
[ "$BEHIND" = "0" ] && ok "not behind origin/main" || bad "behind origin/main by $BEHIND — pull before doing more work"
if [ "$AHEAD" != "0" ]; then
  warn "$AHEAD unpushed commit(s) — production is NOT running this code yet"
  git log --oneline origin/main..HEAD | sed 's/^/        /'
fi
UNCOMMITTED=$(git status --porcelain | grep -c .)
[ "$UNCOMMITTED" != "0" ] && warn "$UNCOMMITTED uncommitted path(s)" || ok "working tree clean"

# ---------------------------------------------------------------------------
hdr "10. Production reality check"
echo "  These describe LIVE https://www.shijo.ai, not your working copy."
for p in "" "geo" "ai-marketing-tools" "pricing"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://www.shijo.ai/$p" 2>/dev/null)
  case "$p:$CODE" in
    ":200")                  ok   "/ returns 200" ;;
    "geo:200")               ok   "/geo is LIVE (200)" ;;
    "geo:404")               warn "/geo returns 404 — not deployed yet (expected until you push)" ;;
    "ai-marketing-tools:200") ok  "/ai-marketing-tools returns 200 (ad landing page intact)" ;;
    "pricing:404")           ok   "/pricing still 404 (expected — it is an anchor, not a route)" ;;
    *)                       warn "/$p returned $CODE" ;;
  esac
done

# ---------------------------------------------------------------------------
hdr "11. GEO unit + integration suites"
if [ -f scripts/geo-tests/run.sh ]; then
  if bash scripts/geo-tests/run.sh >/tmp/geo_suites.log 2>&1; then
    N=$(grep -oE "[0-9]+ passed" /tmp/geo_suites.log | awk '{s+=$1} END {print s}')
    ok "all GEO suites passed ($N assertions)"
  else
    bad "GEO suites failed — see /tmp/geo_suites.log"
    grep -E "FAIL|suite\(s\) failed" /tmp/geo_suites.log | head -10 | sed 's/^/        /'
  fi
else
  warn "scripts/geo-tests/run.sh not found"
fi

# ---------------------------------------------------------------------------
hdr "12. LIVE key health (opt-in: pass --live-scan)"
# Why opt-in: this runs a REAL scan against production. It costs real API spend
# and consumes the one-scan-per-IP-per-UTC-day allowance for whatever IP you
# run it from. It is the only way to prove the keys in Vercel actually work —
# presence in the dashboard proves nothing about validity.
if [ "${1:-}" = "--live-scan" ]; then
  echo "  running one real scan against production ..."
  RESP=$(curl -s -X POST https://www.shijo.ai/api/geo/scan \
    -H "Content-Type: application/json" \
    -d '{"businessName":"Rosewood Mansion on Turtle Creek","websiteUrl":"rosewoodhotels.com","city":"Dallas"}' \
    --max-time 180)

  if echo "$RESP" | grep -q '"success":true'; then
    ok "scan completed"
    # An engine with a bad/expired key lands in `degraded` or errors every cell.
    DEG=$(printf '%s' "$RESP" | grep -o '"degraded":\[[^]]*\]')
    if printf '%s' "$DEG" | grep -q '"engine"'; then
      bad "some engines were unavailable — key missing, invalid or expired:"
      printf '%s' "$DEG" | grep -oE '"label":"[^"]+"' | sed 's/"label":/        /' | tr -d '"'
    else
      ok "all 5 engines configured and reachable (degraded list empty)"
    fi
    printf '%s' "$RESP" | grep -q '"identityResolved":true\|"resolved":true' \
      && ok "GOOGLE_PLACES_API_KEY works (identity resolved)" \
      || bad "Places did NOT resolve — check GOOGLE_PLACES_API_KEY"
    BAND=$(printf '%s' "$RESP" | grep -oE '"band":"[a-z]+"' | tail -1 | cut -d'"' -f4)
    echo "        band: ${BAND:-unknown}"
    [ "$BAND" = "unverified" ] && bad "band=unverified — identity gate tripped, prompts were generic"
  elif echo "$RESP" | grep -q '"reason":"ip_cap"'; then
    warn "daily scan already used from this IP — cannot verify keys live today"
  else
    bad "scan did not succeed: $(printf '%s' "$RESP" | head -c 200)"
  fi
else
  echo "  skipped. Re-run as:  bash scripts/verify-geo-pass.sh --live-scan"
  echo "  (costs one scan against your daily cap; the ONLY way to prove keys are valid)"
fi

# ---------------------------------------------------------------------------
hdr "SUMMARY"
echo "  PASS: $PASS   FAIL: $FAIL   WARN: $WARN"
echo
if [ $FAIL -eq 0 ]; then
  echo "  All required checks passed."
  echo "  Remaining before /geo works in production:"
  echo "    1. run docs/manual-db-changes/2026-08-29-geo-checker-tables.sql in Neon"
  echo "    2. add the MISSING keys above in Vercel"
  echo "    3. commit and push"
  exit 0
else
  echo "  $FAIL check(s) failed — see FAIL lines above."
  exit 1
fi
