#!/usr/bin/env bash
# link.sh — symlink this dotfiles' Claude config into ~/.claude.
#
# Idempotent: safe to run repeatedly. If a target already points at the right
# source it's left alone; if a real file/dir is in the way it's backed up to
# <name>.bak-<timestamp> before linking. Never deletes your data.
#
#   ~/.claude/skills                     -> dotfiles/claude/skills        (dir)
#   ~/.claude/settings.json              -> dotfiles/claude/settings.json (file)
#   ~/.claude/hooks/<each>.py|.sh        -> dotfiles/claude/hooks/<each>  (files)
#
# Individual hook files are linked one by one (not the whole hooks/ dir),
# because ~/.claude/hooks also holds machine-local hooks that aren't tracked.

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # dotfiles/claude
DEST_DIR="$HOME/.claude"
STAMP="$(date +%Y%m%d-%H%M%S)"
DRY_RUN=false
[[ "${1:-}" == "-n" || "${1:-}" == "--dry-run" ]] && DRY_RUN=true

link_one() {
  local src="$1" dest="$2"
  if [[ ! -e "$src" ]]; then
    printf '  skip   %s (source missing)\n' "${dest/#$HOME/~}"
    return
  fi
  # Already correctly linked?
  if [[ -L "$dest" && "$(readlink "$dest")" == "$src" ]]; then
    printf '  ok     %s\n' "${dest/#$HOME/~}"
    return
  fi
  $DRY_RUN && { printf '  WOULD  %s -> %s\n' "${dest/#$HOME/~}" "${src/#$HOME/~}"; return; }
  mkdir -p "$(dirname "$dest")"
  # Back up anything real (or a wrong symlink) that's in the way.
  if [[ -e "$dest" || -L "$dest" ]]; then
    if [[ -L "$dest" ]]; then
      rm -f "$dest"                                   # stale/wrong symlink: just drop it
    else
      mv "$dest" "${dest}.bak-${STAMP}"
      printf '  backup %s -> %s\n' "${dest/#$HOME/~}" "${dest/#$HOME/~}.bak-${STAMP}"
    fi
  fi
  ln -s "$src" "$dest"
  printf '  link   %s -> %s\n' "${dest/#$HOME/~}" "${src/#$HOME/~}"
}

echo "Linking Claude config from ${SRC_DIR/#$HOME/~} into ${DEST_DIR/#$HOME/~}"
$DRY_RUN && echo "(dry run — no changes)"

# Directory + single-file links
link_one "$SRC_DIR/skills"        "$DEST_DIR/skills"
link_one "$SRC_DIR/settings.json" "$DEST_DIR/settings.json"

# Every tracked hook becomes its own link (new hooks are picked up automatically)
if [[ -d "$SRC_DIR/hooks" ]]; then
  for hook in "$SRC_DIR"/hooks/*; do
    [[ -e "$hook" ]] || continue            # empty dir guard
    link_one "$hook" "$DEST_DIR/hooks/$(basename "$hook")"
  done
fi

echo "Done."
