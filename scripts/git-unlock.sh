#!/usr/bin/env bash
# ============================================================================
# SHIJO.AI — clear stale git lock files
#
#   bash scripts/git-unlock.sh          # check, report, remove if safe
#   bash scripts/git-unlock.sh --force  # remove even if a git process is up
#
# WHY THIS EXISTS: this repo repeatedly ends up with a stale
# .git/index.lock or .git/HEAD.lock, which makes every `git add` / `git commit`
# fail with "Another git process seems to be running". The Cowork sandbox can
# edit files but is not permitted to delete these, so clearing them has to
# happen on the Windows side. Rather than remembering the right `rm` each time
# (and `del` does NOT work in Git Bash — it is a cmd.exe builtin), run this.
#
# SAFETY: a lock file is only stale if no git process actually holds it.
# This script looks for running git processes first and refuses to delete
# while one is alive, unless you pass --force. That check matters: deleting a
# live lock can corrupt the index.
# ============================================================================
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
GITDIR="$(git rev-parse --git-dir 2>/dev/null || echo .git)"

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

# Locks git creates. refs/heads/*.lock appears on a failed branch update.
LOCKS=$(find "$GITDIR" -maxdepth 3 -name '*.lock' -type f 2>/dev/null)

if [ -z "$LOCKS" ]; then
  echo "No git lock files found — nothing to clear."
  exit 0
fi

echo "Found lock file(s):"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  # Age is the useful signal: a lock seconds old probably belongs to a live
  # command; one hours old is certainly abandoned.
  MOD=$(date -r "$f" +'%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'unknown')
  SIZE=$(wc -c <"$f" 2>/dev/null | tr -d ' ')
  echo "   $f   (modified $MOD, ${SIZE} bytes)"
done <<< "$LOCKS"

# ── Is a git process actually running? ──────────────────────────────────────
RUNNING=""
if command -v tasklist >/dev/null 2>&1; then
  # Windows / Git Bash
  RUNNING=$(tasklist //FI "IMAGENAME eq git.exe" 2>/dev/null | grep -i "git.exe" || true)
elif command -v pgrep >/dev/null 2>&1; then
  RUNNING=$(pgrep -x git 2>/dev/null || true)
fi

if [ -n "$RUNNING" ] && [ "$FORCE" -eq 0 ]; then
  echo
  echo "REFUSING to delete — a git process appears to be running:"
  echo "$RUNNING" | sed 's/^/   /'
  echo
  echo "Close any editor holding the repo (VS Code's git integration is the"
  echo "usual culprit), wait a moment, then re-run. If you are certain it is"
  echo "hung, re-run with --force, or kill it first:"
  echo "   taskkill //F //IM git.exe"
  exit 1
fi

echo
[ "$FORCE" -eq 1 ] && echo "--force given; removing regardless of running processes."
REMOVED=0
FAILED=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if rm -f "$f" 2>/dev/null; then
    echo "   removed  $f"
    REMOVED=$((REMOVED + 1))
  else
    echo "   FAILED   $f  (permission denied — is it open in another program?)"
    FAILED=$((FAILED + 1))
  fi
done <<< "$LOCKS"

echo
if [ "$FAILED" -gt 0 ]; then
  echo "$REMOVED removed, $FAILED could not be removed."
  exit 1
fi

echo "$REMOVED lock file(s) removed. Verifying git is usable..."
if git status --porcelain >/dev/null 2>&1; then
  echo "git is working again."
  exit 0
else
  echo "git still reports a problem — run 'git status' to see it."
  exit 1
fi
