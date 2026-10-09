#!/usr/bin/env bash
#
# server-setup.sh -- turn a Mac mini into a headless, always-on box.
#
#     make server                        # brew + stow + this script
#     SERVER_HOSTNAME=mini make server   # pick a different hostname
#
# Idempotent: safe to re-run. Needs sudo. Run it once with a screen attached;
# everything after that happens over SSH.

set -euo pipefail
[ "$(uname -s)" = Darwin ] || { echo "macOS only"; exit 0; }

NAME="${SERVER_HOSTNAME:-macmini}"

echo "==> Hostname: $NAME"
sudo scutil --set ComputerName  "$NAME"
sudo scutil --set HostName      "$NAME"
sudo scutil --set LocalHostName "$NAME"

echo "==> Power: never sleep, restart after power loss, wake on network"
sudo pmset -a sleep 0 disksleep 0 displaysleep 1 autorestart 1 womp 1 powernap 0

echo "==> Software Update: download automatically, never install on its own"
# A surprise macOS update reboot is the most common way a headless Mac goes dark.
sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticDownload -bool true
sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticallyInstallMacOSUpdates -bool false

echo "==> SSH (Remote Login)"
if sudo systemsetup -setremotelogin on >/dev/null 2>&1; then
  echo "  on"
else
  echo "  !! could not enable from the terminal (needs Full Disk Access)."
  echo "     Turn on: System Settings > General > Sharing > Remote Login"
fi

echo "==> Tailscale daemon (system-wide, starts at boot)"
if ! sudo launchctl print system/com.tailscale.tailscaled >/dev/null 2>&1; then
  sudo "$(brew --prefix)/bin/tailscaled" install-system-daemon
fi
tailscale status >/dev/null 2>&1 || echo "  run once: tailscale up"

echo
echo "==> Status"
pmset -g | grep -E ' (sleep|autorestart|womp) '
echo "  FileVault: $(fdesetup status)"

cat <<'EOF'

Manual steps (one time, with the screen attached):
  1. System Settings > General > Sharing > Screen Sharing: on (fallback only)
  2. System Settings > Users & Groups > Automatically log in as: you
       Needs FileVault OFF. Without it, OrbStack/agents won't start after a reboot.
  3. Open OrbStack once > Settings > Start at login: on
  4. tailscale up            (sign in, then: ssh <you>@macmini from anywhere)

Then test: pull the power cable, plug it back in, and SSH in from your laptop.
EOF
