#!/usr/bin/env bash
# SessionEnd hook: keep the qmd 'second-brain' index fresh.
#
# The whole knowledge base is searchable only because qmd indexes it; if the
# index goes stale, concierge/recall miss recent notes (it had drifted 64 days
# before this hook existed). Both steps are incremental — cheap when little
# changed — and run fully detached so they never block session exit.

QMD="$(command -v qmd 2>/dev/null)"
[ -n "$QMD" ] || exit 0

nohup sh -c "\"$QMD\" update && \"$QMD\" embed" >/dev/null 2>&1 &
exit 0
