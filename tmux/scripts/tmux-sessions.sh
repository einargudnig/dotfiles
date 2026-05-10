#!/usr/bin/env bash
# 1-line-per-session overview of all tmux sessions, sorted by most recent activity.
# Columns: attached marker | name | age since last activity | window count | active pane command | active pane cwd

set -euo pipefail

if ! tmux info >/dev/null 2>&1; then
  echo "no tmux server running"
  exit 0
fi

now=$(date +%s)
stale_threshold=$((7 * 86400))
pin_file="${TMUX_PRUNE_PIN_FILE:-$HOME/dotfiles/tmux/scripts/pinned-sessions.txt}"

is_pinned() {
  local name=$1
  [[ -f "$pin_file" ]] || return 1
  grep -vE '^\s*(#|$)' "$pin_file" | grep -qxF "$name"
}

format_age() {
  local secs=$1
  if   (( secs < 60 ));         then echo "${secs}s"
  elif (( secs < 3600 ));       then echo "$((secs / 60))m"
  elif (( secs < 86400 ));      then echo "$((secs / 3600))h"
  elif (( secs < 30 * 86400 )); then echo "$((secs / 86400))d"
  else                               echo "$((secs / 604800))w"
  fi
}

# colors (skip if not a tty)
if [[ -t 1 ]]; then
  bold=$'\033[1m'; dim=$'\033[2m'; red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; reset=$'\033[0m'
else
  bold=''; dim=''; red=''; green=''; yellow=''; reset=''
fi

printf "${bold}%1s %-32s %5s %4s  %-14s %s${reset}\n" " " "SESSION" "AGE" "WIN" "COMMAND" "PATH"

# Sort by session_activity desc so freshest sessions surface first.
tmux list-sessions -F '#{session_attached}	#{session_name}	#{session_windows}	#{session_activity}' \
  | sort -t$'\t' -k4,4nr \
  | while IFS=$'\t' read -r attached name windows activity; do
      age_secs=$((now - activity))
      age=$(format_age "$age_secs")

      info=$(tmux display-message -p -t "${name}:" -F '#{pane_current_command}	#{pane_current_path}' 2>/dev/null || echo "?	?")
      cmd="${info%%	*}"
      cwd="${info#*	}"
      cwd="${cwd/#$HOME/~}"

      marker=" "; row_color=""
      pinned=false
      is_pinned "$name" && pinned=true

      if [[ "$attached" -gt 0 ]]; then
        marker="${green}*${reset}"
      elif $pinned; then
        marker="${yellow}📌${reset}"
        row_color="$yellow"
      elif (( age_secs > stale_threshold )); then
        row_color="$red"
      else
        row_color="$dim"
      fi

      printf "%b %-32s %5s %4s  %-14s %s${reset}\n" "$marker" "${row_color}${name}" "$age" "$windows" "$cmd" "$cwd"
    done
