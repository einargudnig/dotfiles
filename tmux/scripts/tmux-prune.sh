#!/usr/bin/env bash
# Kill tmux sessions idle longer than $THRESHOLD_SECS, with safety rails:
#   - never kill an attached session
#   - never kill the session this script is running in
#   - never kill a session matched by is_pinned()
#
# Flags:
#   --dry-run   show what would be killed, don't kill anything
#
# Driven by tmux's session_activity format (epoch of last activity in any pane).

set -euo pipefail

source "$(dirname "$0")/config.sh"

dry_run=false
[[ "${1:-}" == "--dry-run" ]] && dry_run=true

mkdir -p "$(dirname "$TMUX_PRUNE_LOG")"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$TMUX_PRUNE_LOG"
}

if ! tmux info >/dev/null 2>&1; then
  log "no tmux server running, nothing to prune"
  exit 0
fi

is_pinned() {
  local name=$1
  [[ -f "$TMUX_PRUNE_PIN_FILE" ]] || return 1
  grep -vE '^\s*(#|$)' "$TMUX_PRUNE_PIN_FILE" | grep -qxF "$name"
}

notify() {
  [[ -n "$TMUX_PRUNE_NOTIFY" ]] || return 0
  command -v osascript >/dev/null 2>&1 || return 0
  local title=$1 body=$2
  osascript -e "display notification \"${body//\"/\\\"}\" with title \"${title//\"/\\\"}\"" >/dev/null 2>&1 || true
}

current_session=""
if [[ -n "${TMUX:-}" ]]; then
  current_session=$(tmux display-message -p '#S' 2>/dev/null || echo "")
fi

now=$(date +%s)
killed=0
skipped=0
killed_names=()

while IFS=$'\t' read -r name attached activity; do
  reason=""
  if [[ "$attached" -gt 0 ]]; then
    reason="attached"
  elif [[ "$name" == "$current_session" ]]; then
    reason="current session"
  elif is_pinned "$name"; then
    reason="pinned"
  else
    age=$((now - activity))
    if (( age <= TMUX_PRUNE_THRESHOLD_SECS )); then
      reason="fresh ($((age / 86400))d)"
    fi
  fi

  if [[ -n "$reason" ]]; then
    log "skip   '$name' — $reason"
    skipped=$((skipped + 1))
    continue
  fi

  age_days=$(( (now - activity) / 86400 ))
  if $dry_run; then
    log "would kill '$name' — idle ${age_days}d"
  else
    log "kill   '$name' — idle ${age_days}d"
    tmux kill-session -t "$name"
    killed_names+=("$name")
  fi
  killed=$((killed + 1))
done < <(tmux list-sessions -F '#{session_name}	#{session_attached}	#{session_activity}')

verb=$($dry_run && echo "would kill" || echo "killed")
log "summary: $verb $killed, skipped $skipped"

if ! $dry_run && (( ${#killed_names[@]} > 0 )); then
  joined=$(IFS=', '; echo "${killed_names[*]}")
  notify "tmux prune" "Killed $killed session(s): $joined"
fi
