#!/bin/sh
# Update the pi coding agent.
#
# --prefix is the whole point: a plain `npm install -g` would drop pi back inside
# whichever fnm node version happens to be active, which is what caused the
# recurring "wrong version of pi" breakage. Keep it in its own prefix so
# `fnm use` / `--use-on-cd` can't reach it. See ~/.local/bin/pi for the launcher.

set -eu

PREFIX="$HOME/.local/pi"
SHIM="$HOME/.local/bin/pi"
PKG=@earendil-works/pi-coding-agent

[ -x "$SHIM" ] || { echo "pi-update: launcher missing at $SHIM" >&2; exit 1; }

before=$("$SHIM" --version 2>/dev/null || echo "not installed")

npm install -g --ignore-scripts --prefix "$PREFIX" "$PKG"

after=$("$SHIM" --version 2>/dev/null || echo "FAILED")

if [ "$after" = "FAILED" ]; then
  echo "pi-update: install finished but the launcher does not run — check $SHIM" >&2
  exit 1
fi

if [ "$before" = "$after" ]; then
  echo "pi-update: already current ($after)"
else
  echo "pi-update: $before -> $after"
fi

# The failure mode this whole setup exists to prevent: something (usually a bare
# `npm i -g`) puts a second pi in an fnm node tree, which sits ahead of ~/.local/bin
# on PATH and shadows the shim. Report the shim's version above, then flag it.
active=$(command -v pi 2>/dev/null || true)
if [ -n "$active" ] && [ "$active" != "$SHIM" ]; then
  echo >&2
  echo "pi-update: WARNING — 'pi' on PATH is NOT the launcher." >&2
  echo "  resolves to: $active" >&2
  echo "  expected:    $SHIM" >&2
  echo "  fix: npm uninstall -g $PKG    # removes the shadowing copy" >&2
  exit 1
fi
