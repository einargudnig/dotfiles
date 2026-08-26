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

# Prefer the project's own typecheck script. Plain tsc cannot resolve .astro,
# .vue or .svelte imports — those need their framework's checker (astro check,
# vue-tsc, svelte-check), which is what the script points at. Without this the
# hook reports TS2307 on every single-file-component import, forever.
if [ -f package.json ] && rg -q '^[[:space:]]*"typecheck"[[:space:]]*:' package.json 2>/dev/null; then
  if command -v bun >/dev/null 2>&1; then
    runner=bun
  elif command -v npm >/dev/null 2>&1; then
    runner=npm
  else
    runner=""
  fi

  if [ -n "$runner" ]; then
    if ! out=$("$runner" run typecheck 2>&1); then
      # Strip ANSI so the report is readable when piped. Checkers differ on
      # ordering — tsc leads with errors, astro check trails them with hints and
      # a summary — so pull the error lines out rather than head/tail'ing blind.
      plain=$(printf '%s\n' "$out" | sed $'s/\033\\[[0-9;]*m//g')
      errs=$(printf '%s\n' "$plain" | rg -i -A 2 'error' | head -40)
      {
        echo "Typecheck failed in ${root##*/} (${runner} run typecheck) — fix before finishing:"
        if [ -n "$errs" ]; then printf '%s\n' "$errs"; else printf '%s\n' "$plain" | tail -30; fi
      } >&2
      exit 2
    fi
    exit 0
  fi
fi

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
