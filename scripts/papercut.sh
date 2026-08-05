#!/usr/bin/env bash
# papercut — log small friction hit while working, so it can be fixed later.
#
#   papercut "fd -t f AGENTS.md found nothing; fd skips symlinks" -t tool -f "pass -L"
#   papercut list [-n 20]    # recent curated entries
#   papercut inbox [-n 20]   # raw tool failures auto-captured by the hook
#   papercut push            # mirror the log to a secret gist
#   papercut mirror          # refresh the Obsidian copy after hand-editing the log
#   papercut sync-docs       # rewrite the protocol block in CLAUDE.md / AGENTS.md
#   papercut path            # print the log path
#
# Source of truth is ~/dotfiles/papercuts.md, mirrored into the Obsidian vault on
# every write. No network on the write path: logging must never fail or stall the
# task it interrupted — the gist is a manual `push` away.

set -euo pipefail

DOTFILES="${PAPERCUT_DOTFILES:-$HOME/dotfiles}"
LOG="${PAPERCUT_LOG:-$DOTFILES/papercuts.md}"
INBOX="${PAPERCUT_INBOX:-$HOME/.claude/papercut-inbox.jsonl}"
VAULT="${PAPERCUT_VAULT:-$HOME/personal/obsidian/second-brain/papercuts.md}"
PROTOCOL="$DOTFILES/claude/papercuts-protocol.md"
GIST_ID_FILE="$DOTFILES/claude/.papercut-gist-id"
SYNC_TARGETS=("$DOTFILES/claude/CLAUDE.md" "$HOME/AGENTS.md" "$HOME/.codex/AGENTS.md")
MARK_START='<!-- papercut:start -->'
MARK_END='<!-- papercut:end -->'

die() { printf 'papercut: %s\n' "$1" >&2; exit 1; }

# --- context capture ---------------------------------------------------------

# Which agent is driving. Env sniffing; falls back to unknown rather than lying.
detect_agent() {
  [[ -n "${PAPERCUT_AGENT:-}" ]]  && { printf '%s' "$PAPERCUT_AGENT"; return; }
  [[ -n "${CLAUDECODE:-}" ]]      && { printf 'claude-code'; return; }
  [[ -n "${CLAUDE_CODE_SSE_PORT:-}${CLAUDE_CODE_ENTRYPOINT:-}" ]] && { printf 'claude-code'; return; }
  [[ -n "${CODEX_SANDBOX:-}${CODEX_HOME:-}" ]] && { printf 'codex'; return; }
  [[ -n "${CURSOR_AGENT:-}${CURSOR_TRACE_ID:-}" ]] && { printf 'cursor'; return; }
  printf 'unknown'
}

# The model actually running, read from the live Claude Code transcript rather
# than trusted from the caller — agents routinely misreport their own model id.
detect_model() {
  [[ -n "${PAPERCUT_MODEL:-}" ]] && { printf '%s' "$PAPERCUT_MODEL"; return; }

  local projects="$HOME/.claude/projects" slug transcript
  [[ -d "$projects" ]] || { printf 'unknown'; return; }

  # Prefer this cwd's own project dir; else the transcript written to most
  # recently, which is this session when a session is what's calling us.
  slug="$(printf '%s' "$PWD" | sed 's/[^a-zA-Z0-9]/-/g')"
  transcript="$(ls -t "$projects/$slug"/*.jsonl 2>/dev/null | head -1 || true)"
  [[ -n "$transcript" ]] || \
    transcript="$(find "$projects" -name '*.jsonl' -mmin -10 -print0 2>/dev/null \
      | xargs -0 ls -t 2>/dev/null | head -1 || true)"
  [[ -n "$transcript" ]] || { printf 'unknown'; return; }

  local model
  model="$(tail -400 "$transcript" 2>/dev/null | jq -rs '
    [.[] | select(type == "object") | .message?.model? // empty] | last // empty
  ' 2>/dev/null || true)"
  [[ -n "$model" ]] || \
    model="$(tail -400 "$transcript" 2>/dev/null | grep -oE '"model":"[^"]+"' | tail -1 | cut -d'"' -f4 || true)"
  printf '%s' "${model:-unknown}"
}

# Repo + branch if we're in one, otherwise just the directory name.
detect_where() {
  local root branch
  if root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
    printf '%s@%s' "$(basename "$root")" "$branch"
  else
    printf '%s' "$(basename "$PWD")"
  fi
}

# --- outputs -----------------------------------------------------------------

# Mirror the log into the Obsidian vault as a real file, not a symlink: the vault
# is git-synced and read on mobile, where a symlink out of the vault is dead.
mirror_vault() {
  [[ -n "$VAULT" && -d "$(dirname "$VAULT")" ]] || return 0
  {
    printf -- '---\ntags: [papercuts, agents]\nupdated: %s\n---\n\n' "$(date '+%Y-%m-%d %H:%M')"
    tail -n +3 "$LOG"   # drop the H1 and its blank line; Obsidian titles from the filename
  } > "$VAULT" 2>/dev/null || true
}

# --- commands ----------------------------------------------------------------

cmd_add() {
  local what="" tag="other" fix=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -t|--tag) tag="${2:-}"; shift 2 ;;
      -f|--fix) fix="${2:-}"; shift 2 ;;
      -m|--model) PAPERCUT_MODEL="${2:-}"; shift 2 ;;
      -*) die "unknown flag: $1" ;;
      *) what="${what:+$what }$1"; shift ;;
    esac
  done
  [[ -n "$what" ]] || die 'nothing to log — pass a one-line description'

  mkdir -p "$(dirname "$LOG")"
  [[ -f "$LOG" ]] || printf '# Papercuts\n\nSmall friction hit while working, newest last. Written by `papercut`.\n' > "$LOG"

  {
    printf '\n## %s · %s · %s · %s · %s\n' \
      "$(date '+%Y-%m-%d %H:%M %z')" "$tag" "$(detect_model)" "$(detect_where)" "$(detect_agent)"
    printf '%s\n' "$what"
    [[ -n "$fix" ]] && printf '**Worked instead:** %s\n' "$fix"
  } >> "$LOG"

  mirror_vault
  printf 'papercut logged (%s)\n' "$tag"
}

cmd_list() {
  local n=10
  [[ "${1:-}" == "-n" ]] && n="${2:-10}"
  [[ -f "$LOG" ]] || die "no log yet at $LOG"
  awk -v n="$n" '
    /^## / { block++ }
    { lines[NR] = $0; blk[NR] = block }
    END {
      start = (block > n) ? block - n + 1 : 1
      for (i = 1; i <= NR; i++) if (blk[i] >= start) print lines[i]
    }
  ' "$LOG"
}

# Raw failures captured by the PostToolUseFailure hook — everything the agent
# didn't turn into a curated entry. Mine this when the log looks too thin.
cmd_inbox() {
  local n=20
  case "${1:-}" in
    --clear) : > "$INBOX"; printf 'inbox cleared\n'; return ;;
    -n) n="${2:-20}" ;;
  esac
  [[ -s "$INBOX" ]] || { printf 'inbox empty\n'; return; }
  tail -n "$n" "$INBOX" | jq -r '
    "\(.at) · \(.tool) · \(.model) · \(.repo // "-")\n  \(.cmd)\n  → \((.error // .stderr // "")[0:160])"
  '
}

cmd_push() {
  command -v gh >/dev/null || die 'gh not installed'
  [[ -f "$LOG" ]] || die "no log yet at $LOG"
  mirror_vault
  local id
  if [[ -f "$GIST_ID_FILE" ]]; then
    id="$(cat "$GIST_ID_FILE")"
    gh gist edit "$id" -f papercuts.md "$LOG" >/dev/null
  else
    # gh has no --secret: gists are secret unless --public is passed.
    id="$(gh gist create "$LOG" --desc 'Agent papercuts — friction log' | sed 's#.*/##')"
    printf '%s\n' "$id" > "$GIST_ID_FILE"
  fi
  printf 'pushed → https://gist.github.com/%s\n' "$id"
}

cmd_open() {
  [[ -f "$GIST_ID_FILE" ]] || die 'no gist yet — run `papercut push` first'
  open "https://gist.github.com/$(cat "$GIST_ID_FILE")"
}

# Rewrite the always-on instruction block in every config that carries it, from
# the one canonical copy, so editing the protocol never means editing 3 files.
cmd_sync_docs() {
  [[ -f "$PROTOCOL" ]] || die "missing canonical protocol at $PROTOCOL"
  local body target tmp
  body="$(cat "$PROTOCOL")"
  for target in "${SYNC_TARGETS[@]}"; do
    mkdir -p "$(dirname "$target")"
    [[ -f "$target" ]] || : > "$target"
    tmp="$(mktemp)"
    if grep -qF "$MARK_START" "$target"; then
      awk -v s="$MARK_START" -v e="$MARK_END" -v f="$PROTOCOL" '
        index($0, s) { print; while ((getline line < f) > 0) print line; skip = 1; next }
        index($0, e) { skip = 0 }
        !skip { print }
      ' "$target" > "$tmp"
    else
      { cat "$target"; printf '\n%s\n%s\n%s\n' "$MARK_START" "$body" "$MARK_END"; } > "$tmp"
    fi
    mv "$tmp" "$target"
    printf '  synced %s\n' "${target/#$HOME/~}"
  done
}

case "${1:-}" in
  ''|-h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//' ;;
  list)      shift; cmd_list "$@" ;;
  inbox)     shift; cmd_inbox "$@" ;;
  push)      cmd_push ;;
  open)      cmd_open ;;
  sync-docs) cmd_sync_docs ;;
  mirror)    mirror_vault; printf 'mirrored → %s\n' "${VAULT/#$HOME/~}" ;;
  path)      printf '%s\n' "$LOG" ;;
  *)         cmd_add "$@" ;;
esac
