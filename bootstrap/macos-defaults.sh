#!/usr/bin/env bash
#
# macos-defaults.sh -- reproduce the macOS system settings this setup relies on.
#
#     ./bootstrap.sh --defaults      # as part of a bootstrap
#     bash bootstrap/macos-defaults.sh
#
# Seeded from a live read of the machine on 2026-08-27, and deliberately narrow:
# it sets ONLY the settings that were found deviating from macOS stock. Anything
# left at Apple's default is not written here, so this file stays a record of
# real preferences rather than a pile of someone else's opinions.
#
# Verify a value before adding it:  defaults read <domain> <key>

set -euo pipefail
[ "$(uname -s)" = Darwin ] || { echo "macOS only"; exit 0; }

set_default() {  # set_default <domain> <key> <type> <value>
  printf '  %-28s %s\n' "$2" "$4"
  defaults write "$1" "$2" "$3" "$4"
}

echo "==> Keyboard"
# Fast key repeat matters more than usual here -- vim mode is on in every tool.
set_default NSGlobalDomain KeyRepeat -int 5
set_default NSGlobalDomain InitialKeyRepeat -int 15
# Hold-a-key must repeat the character, not open the accent picker. Without
# this, holding j/k in vim does nothing.
set_default NSGlobalDomain ApplePressAndHoldEnabled -bool false

echo "==> Appearance"
set_default NSGlobalDomain AppleInterfaceStyle -string Dark

echo "==> Dock"
set_default com.apple.dock autohide -bool true
set_default com.apple.dock orientation -string left
set_default com.apple.dock tilesize -int 48
set_default com.apple.dock show-recents -bool false

echo "==> Finder"
set_default com.apple.finder FXPreferredViewStyle -string Nlsv   # list view

echo "==> Screenshots"
set_default com.apple.screencapture location -string "${HOME}/Documents/"

echo "==> Restarting affected apps"
for app in Dock Finder SystemUIServer; do
  killall "$app" >/dev/null 2>&1 || true
done

cat <<'EOF'

  Done. Some settings only take effect after a logout.

  Not automated (no reliable `defaults` key, or account-specific):
    - Karabiner-Elements needs Input Monitoring permission
    - AeroSpace needs Accessibility permission
    - Full Disk Access for the terminal
EOF
