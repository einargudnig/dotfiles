#!/usr/bin/env bash
# SessionEnd hook: commit & push the private Claude memory repo when it changes.
#
# Memory lives in a separate PRIVATE repo (not the public dotfiles repo) because
# it holds work/project internals. Identity is set in that repo's local git
# config, so nothing sensitive lives here. Push runs detached so a slow network
# never blocks session exit; if a push is missed, the next run catches up
# because it pushes whenever the local repo is ahead of origin.

MEM="$HOME/.claude/projects/-Users-einargudjonsson/memory"
[ -d "$MEM/.git" ] || exit 0
cd "$MEM" || exit 0

# Commit if the working tree has changes.
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "memory: auto-update $(date +%Y-%m-%dT%H:%M)" >/dev/null 2>&1 || true
fi

# Push if local is ahead of upstream (covers a fresh commit AND a previously
# failed/missed push). No-op if there's no upstream or nothing to send.
if [ -n "$(git rev-list '@{u}..' 2>/dev/null)" ]; then
  nohup git push -q origin HEAD >/dev/null 2>&1 &
fi

exit 0
