# Shared config for tmux session management scripts.
# Sourced by tmux-sessions.sh, tmux-prune.sh, tmux-kill.sh, tmux-pin.sh.
# Each value is overridable via env var.

# Idle duration before a session is considered stale (and eligible for pruning).
TMUX_PRUNE_THRESHOLD_SECS="${TMUX_PRUNE_THRESHOLD_SECS:-$((7 * 86400))}"

# Path to the pin list. One session name per line; '#' starts a comment.
TMUX_PRUNE_PIN_FILE="${TMUX_PRUNE_PIN_FILE:-$HOME/dotfiles/tmux/scripts/pinned-sessions.txt}"

# Where the prune script logs its actions.
TMUX_PRUNE_LOG="${TMUX_PRUNE_LOG:-$HOME/.cache/tmux-prune.log}"

# If non-empty, send a macOS notification after a non-dry-run prune that killed >0 sessions.
TMUX_PRUNE_NOTIFY="${TMUX_PRUNE_NOTIFY:-}"

export TMUX_PRUNE_THRESHOLD_SECS TMUX_PRUNE_PIN_FILE TMUX_PRUNE_LOG TMUX_PRUNE_NOTIFY
