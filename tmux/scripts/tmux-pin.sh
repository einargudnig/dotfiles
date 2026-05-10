#!/usr/bin/env bash
# Manage the tmux session pin list.
#   tmux-pin.sh list                 show current pins
#   tmux-pin.sh add <name>           pin a session
#   tmux-pin.sh remove <name>        unpin a session
#   tmux-pin.sh toggle [<name>]      toggle pin (defaults to the current tmux session)

set -euo pipefail

source "$(dirname "$0")/config.sh"

usage() {
  sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-1}"
}

current_session() {
  [[ -n "${TMUX:-}" ]] || return 1
  tmux display-message -p '#S' 2>/dev/null
}

list_pins() {
  [[ -f "$TMUX_PRUNE_PIN_FILE" ]] || return 0
  grep -vE '^\s*(#|$)' "$TMUX_PRUNE_PIN_FILE" || true
}

is_pinned() {
  list_pins | grep -qxF "$1"
}

flash() {
  if [[ -n "${TMUX:-}" ]]; then
    tmux display-message "$1"
  else
    echo "$1"
  fi
}

cmd_list() {
  list_pins
}

cmd_add() {
  local name=$1
  if is_pinned "$name"; then
    flash "📌 already pinned: $name"
    return 0
  fi
  mkdir -p "$(dirname "$TMUX_PRUNE_PIN_FILE")"
  printf '%s\n' "$name" >> "$TMUX_PRUNE_PIN_FILE"
  flash "📌 pinned: $name"
}

cmd_remove() {
  local name=$1
  if ! is_pinned "$name"; then
    flash "📍 not pinned: $name"
    return 0
  fi
  local tmp
  tmp=$(mktemp)
  grep -vxF "$name" "$TMUX_PRUNE_PIN_FILE" > "$tmp" || true
  mv "$tmp" "$TMUX_PRUNE_PIN_FILE"
  flash "📍 unpinned: $name"
}

cmd_toggle() {
  local name=${1:-}
  if [[ -z "$name" ]]; then
    name=$(current_session) || { flash "no session name given and not in tmux"; return 1; }
  fi
  if is_pinned "$name"; then
    cmd_remove "$name"
  else
    cmd_add "$name"
  fi
}

case "${1:-list}" in
  list)            cmd_list ;;
  add)             [[ $# -ge 2 ]] || usage; cmd_add "$2" ;;
  remove|rm|del)   [[ $# -ge 2 ]] || usage; cmd_remove "$2" ;;
  toggle)          cmd_toggle "${2:-}" ;;
  -h|--help|help)  usage 0 ;;
  *)               usage ;;
esac
