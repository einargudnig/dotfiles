#!/usr/bin/env bash
# dump.sh -- snapshot this machine's installed packages into bootstrap/ lists.
#
# Run after installing something you want on every machine:
#     make dump
#
# Then review `git diff bootstrap/` and commit. Everything here is regenerated
# wholesale, so hand edits are lost -- put exclusions in the filters below.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

note() { printf '  %-22s %s\n' "$1" "$2"; }

# --- Homebrew ---------------------------------------------------------------
# Split so that Linux can install formulae without choking on cask/mas lines,
# which are macOS-only concepts.
if command -v brew >/dev/null; then
  tmp=$(mktemp)
  brew bundle dump --file="$tmp" --force >/dev/null 2>&1

  {
    echo "# Cross-platform: taps + CLI formulae. Installed on macOS and Linux."
    echo "# Regenerate with 'make dump'. Do not hand-edit."
    echo
    grep '^tap '  "$tmp" || true
    echo
    grep '^brew ' "$tmp" | grep -vE '^brew "mas"$' || true
  } > Brewfile

  {
    echo "# macOS only: GUI casks, Mac App Store apps, and mac-only formulae."
    echo "# Homebrew on Linux has no cask support, so these live apart."
    echo "# Regenerate with 'make dump'. Do not hand-edit."
    echo
    grep -E '^brew "mas"$' "$tmp" || true
    echo
    grep '^cask ' "$tmp" || true
    echo
    grep '^mas '  "$tmp" || true
  } > Brewfile.macos

  grep '^vscode ' "$tmp" | sed 's/^vscode "//; s/"$//' > vscode-extensions.txt || true
  rm -f "$tmp"
  note "Brewfile" "$(grep -c '^brew ' Brewfile) formulae, $(grep -c '^tap ' Brewfile) taps"
  note "Brewfile.macos" "$(grep -c '^cask ' Brewfile.macos) casks, $(grep -c '^mas ' Brewfile.macos) app-store"
  note "vscode-extensions" "$(wc -l < vscode-extensions.txt | tr -d ' ') extensions"
fi

# --- uv (Python tools) ------------------------------------------------------
if command -v uv >/dev/null; then
  uv tool list 2>/dev/null | grep -E '^[a-zA-Z]' | awk '{print $1}' | sort -u > uv-tools.txt
  note "uv-tools" "$(wc -l < uv-tools.txt | tr -d ' ') tools"
fi

# --- cargo (Rust) -----------------------------------------------------------
# rustup's own shims are excluded -- they come with the toolchain, not `cargo install`.
if command -v cargo >/dev/null; then
  cargo install --list 2>/dev/null | grep -E '^[a-zA-Z]' | sed 's/ v.*//' | sort -u > cargo-crates.txt
  note "cargo-crates" "$(wc -l < cargo-crates.txt | tr -d ' ') crates"
fi

# --- go ---------------------------------------------------------------------
# Read the real module path out of each binary rather than guessing from its name.
if command -v go >/dev/null && [ -d "$HOME/go/bin" ]; then
  for b in "$HOME"/go/bin/*; do
    [ -x "$b" ] || continue
    go version -m "$b" 2>/dev/null | awk '/^\tpath/{print $2}'
  done | sort -u > go-packages.txt
  note "go-packages" "$(wc -l < go-packages.txt | tr -d ' ') modules"
fi

# --- bun globals ------------------------------------------------------------
if [ -f "$HOME/.bun/install/global/package.json" ]; then
  python3 -c "
import json
d = json.load(open('$HOME/.bun/install/global/package.json')).get('dependencies', {})
print('\n'.join(sorted(d)))
" > bun-global.txt
  note "bun-global" "$(wc -l < bun-global.txt | tr -d ' ') packages"
fi

# --- npm globals ------------------------------------------------------------
# Versions are stripped: pinning them makes a fresh machine fail on yanked
# releases. npm/corepack ship with node and are excluded.
if command -v npm >/dev/null; then
  npm ls -g --depth=0 2>/dev/null \
    | tail -n +2 \
    | sed 's/^[├└]── //; s/ deduped$//' \
    | grep -v '^$' \
    | sed 's/@[0-9][^@]*$//' \
    | grep -vE '^(npm|corepack)$' \
    | sort -u > npm-global.txt
  note "npm-global" "$(wc -l < npm-global.txt | tr -d ' ') packages"
fi

# --- node versions ----------------------------------------------------------
if command -v fnm >/dev/null; then
  fnm list 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sort -uV > node-versions.txt
  fnm current 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' > node-default.txt || true
  note "node-versions" "$(wc -l < node-versions.txt | tr -d ' ') versions, default $(cat node-default.txt 2>/dev/null)"
fi

echo "Done. Review with: git diff bootstrap/"
