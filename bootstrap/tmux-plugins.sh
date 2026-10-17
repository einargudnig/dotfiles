#!/usr/bin/env bash
#
# tmux-plugins.sh -- install TPM and every plugin declared in .tmux.conf.
#
# ~/.tmux lives outside the stow repo, so `make install` leaves the
# `run '~/.tmux/plugins/tpm/tpm'` line at the bottom of .tmux.conf pointing at
# nothing: no catppuccin theme, no resurrect, no vim-tmux-navigator. This step
# closes that gap. Idempotent -- safe to re-run.

set -euo pipefail

if ! command -v tmux >/dev/null; then
  echo "    tmux not installed -- skipping"
  exit 0
fi
if ! command -v git >/dev/null; then
  echo "    git not installed -- skipping"
  exit 0
fi

TPM_DIR="$HOME/.tmux/plugins/tpm"
PLUGINS_DIR="$HOME/.tmux/plugins/"

if [ -d "$TPM_DIR" ]; then
  echo "    tpm already present"
else
  echo "    cloning tpm"
  git clone --depth 1 https://github.com/tmux-plugins/tpm "$TPM_DIR"
fi

# install_plugins reads TMUX_PLUGIN_MANAGER_PATH from the server's global
# environment, which the `run '~/.tmux/plugins/tpm/tpm'` line normally sets --
# i.e. it needs TPM to already be sourced. Set it directly so this works on the
# very first run, before .tmux.conf has ever seen a tpm install.
tmux start-server 2>/dev/null || true
tmux set-environment -g TMUX_PLUGIN_MANAGER_PATH "$PLUGINS_DIR"

if ! "$TPM_DIR/bin/install_plugins" | sed 's/^/    /'; then
  echo "    ! one or more plugins failed -- re-run to retry"
fi

# Load the plugins into a live server; no-op when nothing is attached yet.
tmux source-file "$HOME/.tmux.conf" >/dev/null 2>&1 || true
