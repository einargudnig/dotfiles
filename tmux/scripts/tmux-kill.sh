#!/usr/bin/env bash
# Multi-select kill picker for tmux sessions.
# Filters out attached, pinned, and the current session — those can't be killed from here.
# Tab/Shift-Tab to mark, Enter to kill, Esc to cancel.

set -euo pipefail

source "$(dirname "$0")/config.sh"

if ! tmux info >/dev/null 2>&1; then
  echo "no tmux server running"
  exit 0
fi

is_pinned() {
  local name=$1
  [[ -f "$TMUX_PRUNE_PIN_FILE" ]] || return 1
  grep -vE '^\s*(#|$)' "$TMUX_PRUNE_PIN_FILE" | grep -qxF "$name"
}

current_session=""
[[ -n "${TMUX:-}" ]] && current_session=$(tmux display-message -p '#S' 2>/dev/null || echo "")

now=$(date +%s)

# Build candidate list. Tab-separated so session names with spaces survive.
candidates=$(
  tmux list-sessions -F '#{session_name}	#{session_attached}	#{session_activity}' \
    | while IFS=$'\t' read -r name attached activity; do
        [[ "$attached" -gt 0 ]] && continue
        [[ "$name" == "$current_session" ]] && continue
        is_pinned "$name" && continue
        echo -e "${name}\t${activity}"
      done \
    | sort -t$'\t' -k2,2n
)

if [[ -z "$candidates" ]]; then
  echo "no killable sessions (everything is attached, pinned, or you)"
  echo
  read -rsn1 -p "(any key to close)"
  exit 0
fi

# Format for display: name padded + age + tab-delimited so fzf {1} = full name.
display=$(
  echo "$candidates" \
    | awk -F'\t' -v now="$now" '{
        secs = now - $2
        if      (secs < 60)         age = secs "s"
        else if (secs < 3600)       age = int(secs/60) "m"
        else if (secs < 86400)      age = int(secs/3600) "h"
        else if (secs < 30*86400)   age = int(secs/86400) "d"
        else                        age = int(secs/604800) "w"
        printf "%s\t%-32s  idle %s\n", $1, $1, age
      }'
)

selected=$(
  echo "$display" \
    | fzf --multi \
          --no-sort \
          --delimiter='\t' \
          --with-nth=2 \
          --header 'tab/shift-tab to mark · enter to kill · esc to cancel' \
          --preview 'tmux capture-pane -ep -t {1}: | tail -40' \
          --preview-window 'right,55%,wrap' \
    | awk -F'\t' '{print $1}'
)

if [[ -z "$selected" ]]; then
  echo "nothing selected"
  exit 0
fi

count=$(echo "$selected" | wc -l | tr -d ' ')
echo
echo "About to kill $count session(s):"
echo "$selected" | sed 's/^/  /'
echo
read -rn1 -p "Confirm? [y/N] " confirm
echo
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "cancelled"
  exit 0
fi

while IFS= read -r name; do
  if tmux kill-session -t "$name" 2>/dev/null; then
    echo "  killed '$name'"
  else
    echo "  failed '$name'"
  fi
done <<<"$selected"

echo
read -rsn1 -p "(any key to close)"
