#!/usr/bin/env bash
# ============================================================================
# GEO checker test suite runner.
#
#   bash scripts/geo-tests/run.sh
#
# Bundles the real lib/geo modules out of the source tree with esbuild, then
# runs five suites against them. fetch is intercepted inside each suite, so no
# paid API is ever called and no network access is required at run time.
#
# Exit 0 = every suite passed.
# ============================================================================
set -uo pipefail

# ── Git Bash / MSYS2 path mangling ─────────────────────────────────────────
# MSYS rewrites any argument that looks like a Unix path into a Windows one.
# That turns esbuild's `--alias:@/db=...` into `--alias:@C:/Program Files/Git/db=...`,
# so the alias never matches, esbuild falls through to the REAL db/index.ts,
# and the build dies on `drizzle-orm/neon-serverless`. Disabling conversion for
# this script is the fix; it is a no-op on Linux and macOS.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
BUILD="$HERE/.build"
mkdir -p "$BUILD"

# ── Pick an esbuild that runs on THIS platform ──────────────────────────────
# The repo's copy is whatever platform `npm ci` last ran on, which is often not
# the platform you are testing from. Verify it executes before trusting it.
ESBUILD=""
if [ -x "$ROOT/node_modules/.bin/esbuild" ] && "$ROOT/node_modules/.bin/esbuild" --version >/dev/null 2>&1; then
  ESBUILD="$ROOT/node_modules/.bin/esbuild"
elif [ -x "$BUILD/node_modules/.bin/esbuild" ] && "$BUILD/node_modules/.bin/esbuild" --version >/dev/null 2>&1; then
  ESBUILD="$BUILD/node_modules/.bin/esbuild"
else
  echo "Installing a platform-matched esbuild into scripts/geo-tests/.build ..."
  ( cd "$BUILD" && npm install esbuild --no-save --silent >/dev/null 2>&1 )
  if [ -x "$BUILD/node_modules/.bin/esbuild" ]; then
    ESBUILD="$BUILD/node_modules/.bin/esbuild"
  else
    echo "ERROR: could not obtain a working esbuild. Run 'npm ci' in the app root first."
    exit 1
  fi
fi
# "$ESBUILD" must stay quoted — the repo path contains a space ("AI Agent"),
# and unquoted it split into `/c/Users/AI` + `Agent/...`.
echo "esbuild: $("$ESBUILD" --version)"

# Every path handed to esbuild is RELATIVE to the app root, and we cd there
# first. Absolute paths cannot be used portably here: MSYS2_ARG_CONV_EXCL='*'
# above stops Git Bash rewriting `@/db`, but it also stops it rewriting
# `/c/Users/...` into `C:/Users/...`, which a Windows esbuild.exe needs.
# Relative paths sidestep both problems and behave identically on Linux/macOS.
# esbuild resolves alias targets against the current working directory, which
# is exactly why the cd matters.
REL="scripts/geo-tests"

bundle() {          # bundle <entry-name> <db-stub-filename>
  ( cd "$ROOT" && "$ESBUILD" "$REL/entries/$1.ts" \
      --bundle --format=esm --platform=node \
      --outfile="$REL/.build/$1.mjs" \
      --alias:@/db="./$REL/stubs/$2" \
      --alias:@/db/schema="./$REL/stubs/schema.js" \
      --alias:drizzle-orm="./$REL/stubs/drizzle.js" \
      --alias:@=. \
      --log-level=error ) || { echo "ERROR: bundling $1 failed"; exit 1; }
}

echo "Bundling real lib/geo sources ..."
bundle pure   db.js
bundle scan   db.js
bundle budget db-controllable.js

FAILED=0
for suite in "$HERE"/suites/[0-9]*.mjs; do
  name="$(basename "$suite")"
  echo
  echo "############################################################"
  echo "# $name"
  echo "############################################################"
  # Suites log expected server-side errors via console.error; keep them out of
  # the way but never hide an actual assertion failure.
  if node "$suite" 2>&1 | grep -vE "^\s+at |^\[geo\] "; then :; fi
  if [ "${PIPESTATUS[0]}" != "0" ]; then
    FAILED=$((FAILED + 1))
    echo "  >>> $name FAILED"
  fi
done

echo
echo "============================================================"
if [ "$FAILED" -eq 0 ]; then
  echo "All suites passed."
  exit 0
else
  echo "$FAILED suite(s) failed."
  exit 1
fi
