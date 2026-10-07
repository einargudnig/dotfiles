#!/bin/bash
# Claude Code statusline: branch · context %
exec 2>/dev/null
IFS=$'\t' read -r used size cwd < <(jq -r '[
  ((.context_window.current_usage | (.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0))),
  (.context_window.context_window_size // 0),
  (.workspace.current_dir // .cwd // "")
] | @tsv')
pct=0
[ "${size:-0}" -gt 0 ] && pct=$(( used * 100 / size ))
color="\033[2m"
[ "$pct" -ge 70 ] && color="\033[33m"
[ "$pct" -ge 85 ] && color="\033[31m"
branch=$(git -C "$cwd" --no-optional-locks branch --show-current)
printf "\033[2m%s\033[0m %b%d%%\033[0m\n" "${branch:+$branch ·}" "$color" "$pct"
