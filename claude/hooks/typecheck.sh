#!/usr/bin/env bash
# Stop hook: typecheck the repo once per turn.
# Replaces the old PostToolUse(Edit) hook that ran `npx tsc` after every .ts edit.
#   - local binary instead of npx  (~0.8s saved per run)
#   - once per turn instead of per edit
#   - real exit code, so failures actually surface

input=$(cat)

# Already inside a stop-hook continuation -> don't block again (loop guard).
case "$input" in *'"stop_hook_active": true'*|*'"stop_hook_active":true'*) exit 0 ;; esac

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/tsconfig.json" ] || exit 0
cd "$root" || exit 0

if [ -x ./node_modules/.bin/tsc ]; then
  tsc=./node_modules/.bin/tsc
elif command -v tsc >/dev/null 2>&1; then
  tsc=$(command -v tsc)
else
  exit 0
fi

if ! out=$("$tsc" --noEmit 2>&1); then
  {
    echo "TypeScript errors in ${root##*/} — fix before finishing:"
    printf '%s\n' "$out" | head -30
  } >&2
  exit 2
fi
exit 0
