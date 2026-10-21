#!/usr/bin/env bash
# doctor.sh — does this machine match what the config promises?
#
# The failure this exists for: ~/.claude/CLAUDE.md and the skills describe tools,
# checkouts and a vault that may not be installed. Missing ones fail silently
# (hooks that no-op, skills that "succeed" without doing anything), so you only
# notice weeks later. Required gaps exit non-zero; optional gaps only warn.
#
#   ~/dotfiles/scripts/doctor.sh          # check
#   ~/dotfiles/scripts/doctor.sh --quiet  # only problems
set -uo pipefail

QUIET=0
[ "${1:-}" = "--quiet" ] && QUIET=1
fail=0
missing_req=0
missing_opt=0

say() { [ "$QUIET" = 1 ] || printf '%s\n' "$*"; }
ok()  { [ "$QUIET" = 1 ] || printf '  \033[32mok\033[0m    %s\n' "$*"; }
req() { printf '  \033[31mMISS\033[0m  %s (%s)\n' "$2" "$1"; missing_req=$((missing_req + 1)); fail=1; }
opt() { printf '  \033[33mwarn\033[0m  %s (%s)\n' "$2" "$1"; missing_opt=$((missing_opt + 1)); }

have_cmd() { command -v "$1" >/dev/null 2>&1; }
have_dir() { [ -d "$1" ]; }

say "== required =="
for c in git gh bun node rg fd; do
  if have_cmd "$c"; then ok "$c"; else req "command: $c" "$c"; fi
done
if have_cmd gh; then
  if gh auth status >/dev/null 2>&1; then ok "gh auth"; else req "gh auth status" "gh not authenticated"; fi
fi

say "== degraded if missing =="
check_opt_cmd() { # cmd, what breaks
  if have_cmd "$1"; then ok "$1"; else opt "$1" "$2"; fi
}
check_opt_cmd sg      "ast-grep edits; 'sg' in CLAUDE.md"
check_opt_cmd tree    "'tree' in CLAUDE.md shell rules"
check_opt_cmd wrangler "Cloudflare deploys"
check_opt_cmd task    "/todo — no Taskwarrior data on this host"
check_opt_cmd tw      "/todo — Things sync"
check_opt_cmd spark   "/mail-* and /use-spark"
check_opt_cmd cf      "Maul Cloudflare CLI"
check_opt_cmd qmd     "slip-box recall; hooks degrade gracefully"

check_opt_dir() { # path, what breaks
  if have_dir "$1"; then ok "$1"; else opt "$1" "$2"; fi
}
check_opt_dir "$HOME/work/Maul" "/maul-* skills — empty on the mini"
check_opt_dir "$HOME/personal/obsidian/second-brain" "/done, /memento, /weekly-review, recall"
check_opt_dir "$HOME/.claude/projects/-$(printf '%s' "${HOME#/}" | tr '/' '-')/memory" "cross-session memory"

# Hook commands must point at files that exist, or every session pays for it.
say "== hooks =="
python3 - "$HOME/.claude/settings.json" <<'PY'
import json, os, re, sys
path = sys.argv[1]
if not os.path.exists(path):
    print("  \033[33mwarn\033[0m  no settings.json"); raise SystemExit(0)
bad = []
for event, entries in json.load(open(path)).get("hooks", {}).items():
    for entry in entries:
        for hook in entry.get("hooks", []):
            for m in re.findall(r"(?:\$HOME|~)/[^\s\"']+", hook.get("command", "")):
                if not os.path.exists(os.path.expandvars(os.path.expanduser(m))):
                    bad.append(f"{event}: {m}")
if bad:
    for b in bad:
        print(f"  \033[31mMISS\033[0m  hook target {b}")
    raise SystemExit(1)
if not os.environ.get("QUIET"):
    print("  \033[32mok\033[0m    all hook targets exist")
PY
[ $? -ne 0 ] && fail=1

printf '\n'
if [ "$fail" = 1 ]; then
  printf 'required missing: %d · degraded: %d\n' "$missing_req" "$missing_opt"
  exit 1
fi
printf 'required ok · degraded: %d\n' "$missing_opt"
