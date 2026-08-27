#!/usr/bin/env bash
#
# bootstrap.sh -- bring a bare machine up to a working environment.
#
# On a fresh box, one command:
#
#     curl -fsSL https://raw.githubusercontent.com/einargudnig/dotfiles/master/bootstrap.sh | bash
#
# or, if the repo is already cloned:
#
#     cd ~/dotfiles && ./bootstrap.sh
#
# Idempotent -- safe to re-run any time. Every step checks before it acts, so a
# second run is mostly a no-op and a good way to repair a drifted machine.
#
# macOS and Linux. Homebrew runs on both, but casks and Mac App Store apps are
# macOS-only concepts, so those live in bootstrap/Brewfile.macos and are skipped
# entirely on Linux.

set -euo pipefail

REPO_URL_HTTPS="https://github.com/einargudnig/dotfiles.git"
REPO_URL_SSH="git@github.com:einargudnig/dotfiles.git"
DOTFILES="${DOTFILES:-$HOME/dotfiles}"

DO_CASKS=1 DO_LANGS=1 DO_STOW=1 DO_DEFAULTS=0 DO_ALL_NODE=0 DRY=0

usage() {
  sed -n '3,18p' "$0" | sed 's/^# \{0,1\}//'
  cat <<'EOF'

Options:
  --no-casks     skip GUI apps and Mac App Store (automatic on Linux)
  --no-langs     skip uv / cargo / go / bun / npm / node packages
  --no-stow      skip linking dotfiles into $HOME
  --minimal      shorthand for --no-casks --no-langs
  --defaults     also apply macOS system defaults (off by default)
  --all-node     install every recorded node version, not just the default
  -n, --dry-run  print what would happen, change nothing
  -h, --help     this text
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --no-casks) DO_CASKS=0 ;;
    --no-langs) DO_LANGS=0 ;;
    --no-stow)  DO_STOW=0 ;;
    --minimal)  DO_CASKS=0; DO_LANGS=0 ;;
    --defaults) DO_DEFAULTS=1 ;;
    --all-node) DO_ALL_NODE=1 ;;
    -n|--dry-run) DRY=1 ;;
    -h|--help)  usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

# --- output helpers ---------------------------------------------------------
if [ -t 1 ]; then B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m';
else B= G= Y= R= N=; fi

step() { printf '\n%s==>%s %s%s%s\n' "$G" "$N" "$B" "$*" "$N"; }
info() { printf '    %s\n' "$*"; }
warn() { printf '    %s!%s %s\n' "$Y" "$N" "$*"; }
die()  { printf '\n%serror:%s %s\n' "$R" "$N" "$*" >&2; exit 1; }
run()  { if [ "$DRY" = 1 ]; then printf '    would run: %s\n' "$*"; else "$@"; fi; }

SKIPPED=()
note_skip() { SKIPPED+=("$1"); warn "$1"; }

# `go install` needs an @latest suffix; wrap it so the generic loop stays simple.
# Defined up here because bash resolves functions at call time, not parse time.
go_install() { go install "$1@latest"; }

# --- 0. platform ------------------------------------------------------------
OS="$(uname -s)"
case "$OS" in
  Darwin) PLATFORM=macos ;;
  Linux)  PLATFORM=linux; DO_CASKS=0 ;;
  *) die "unsupported platform: $OS" ;;
esac
step "Platform: $PLATFORM ($(uname -m))"
[ "$PLATFORM" = linux ] && [ "$DO_CASKS" = 0 ] && info "casks and App Store apps skipped (macOS-only)"

# --- 1. prerequisites -------------------------------------------------------
step "Prerequisites"
if [ "$PLATFORM" = macos ]; then
  if xcode-select -p >/dev/null 2>&1; then
    info "Xcode command line tools present"
  else
    info "installing Xcode command line tools (a GUI dialog will open)"
    run xcode-select --install || true
    info "waiting for the install to finish..."
    until xcode-select -p >/dev/null 2>&1; do sleep 10; done
  fi
else
  # Homebrew on Linux needs a compiler and a few basics before it will run.
  if command -v apt-get >/dev/null; then
    run sudo apt-get update -qq
    run sudo apt-get install -y build-essential procps curl file git zsh
  elif command -v dnf >/dev/null; then
    run sudo dnf groupinstall -y 'Development Tools'
    run sudo dnf install -y procps-ng curl file git zsh
  elif command -v pacman >/dev/null; then
    run sudo pacman -Sy --needed --noconfirm base-devel procps-ng curl file git zsh
  else
    warn "unknown Linux package manager -- ensure a compiler, curl, git and zsh exist"
  fi
fi

# --- 2. the repo itself -----------------------------------------------------
# Supports being piped straight from curl, where the repo does not exist yet.
step "Dotfiles repo"
if [ -d "$DOTFILES/.git" ]; then
  info "already cloned at $DOTFILES"
else
  info "cloning into $DOTFILES"
  run git clone "$REPO_URL_HTTPS" "$DOTFILES"
  # Prefer SSH once keys are in place; harmless if they are not yet.
  run git -C "$DOTFILES" remote set-url origin "$REPO_URL_SSH" || true
fi
cd "$DOTFILES" 2>/dev/null || die "cannot enter $DOTFILES"

# --- 3. homebrew ------------------------------------------------------------
step "Homebrew"
if command -v brew >/dev/null; then
  info "already installed ($(brew --version | head -1))"
else
  info "installing"
  run /bin/bash -c \
    "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
# Put brew on PATH for the rest of this script regardless of shell config.
for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
  [ -x "$candidate" ] && eval "$("$candidate" shellenv)" && break
done
command -v brew >/dev/null || die "brew not on PATH after install"

# --- 4. brew packages -------------------------------------------------------
step "Homebrew packages"
if [ "$PLATFORM" = macos ]; then
  # brew bundle aborts on the first failure, which is what we want on the
  # platform the Brewfile was captured from.
  run brew bundle install --file=bootstrap/Brewfile || \
    warn "some formulae failed; re-run to retry"
else
  # On Linux a chunk of the Brewfile will legitimately not exist. Install one
  # at a time so a single macOS-only formula cannot abort the whole run.
  info "installing formulae individually (Linux: some are macOS-only)"
  while read -r _ pkg; do
    pkg="${pkg%\"}"; pkg="${pkg#\"}"
    [ -n "$pkg" ] || continue
    brew list "$pkg" >/dev/null 2>&1 && continue
    if [ "$DRY" = 1 ]; then printf '    would install: %s\n' "$pkg"; continue; fi
    brew install "$pkg" >/dev/null 2>&1 || note_skip "brew: $pkg"
  done < <(grep '^brew ' bootstrap/Brewfile)
fi

if [ "$DO_CASKS" = 1 ] && [ -f bootstrap/Brewfile.macos ]; then
  step "GUI apps and Mac App Store"
  info "note: 'mas' requires being signed in to the App Store"
  run brew bundle install --file=bootstrap/Brewfile.macos || \
    warn "some casks or App Store apps failed; re-run to retry"
fi

# --- 5. language-manager packages -------------------------------------------
if [ "$DO_LANGS" = 1 ]; then
  step "Language-manager packages"

  each() {  # each <file> <label> <command...>
    local file="$1" label="$2"; shift 2
    [ -f "$file" ] || return 0
    local n=0
    while read -r item; do
      case "$item" in ''|'#'*) continue ;; esac
      n=$((n+1))
      if [ "$DRY" = 1 ]; then printf '    would install: %s %s\n' "$label" "$item"; continue; fi
      "$@" "$item" >/dev/null 2>&1 || note_skip "$label: $item"
    done < "$file"
    info "$label: $n from $(basename "$file")"
  }

  command -v uv    >/dev/null && each bootstrap/uv-tools.txt     "uv"    uv tool install
  command -v cargo >/dev/null && each bootstrap/cargo-crates.txt "cargo" cargo install
  command -v go    >/dev/null && each bootstrap/go-packages.txt  "go"    go_install
  command -v bun   >/dev/null && each bootstrap/bun-global.txt   "bun"   bun add -g
  command -v npm   >/dev/null && each bootstrap/npm-global.txt   "npm"   npm install -g

  # node versions via fnm
  if command -v fnm >/dev/null && [ -f bootstrap/node-default.txt ]; then
    default_node="$(cat bootstrap/node-default.txt)"
    if [ "$DO_ALL_NODE" = 1 ] && [ -f bootstrap/node-versions.txt ]; then
      while read -r v; do [ -n "$v" ] && run fnm install "$v" || true; done < bootstrap/node-versions.txt
    else
      info "node: installing default $default_node only (--all-node for the rest)"
      run fnm install "$default_node" || warn "fnm install $default_node failed"
    fi
    run fnm default "$default_node" || true
  fi

  # VS Code / Cursor extensions
  for editor in code cursor; do
    if command -v "$editor" >/dev/null && [ -f bootstrap/vscode-extensions.txt ]; then
      info "$editor: installing extensions"
      while read -r ext; do
        [ -n "$ext" ] || continue
        if [ "$DRY" = 1 ]; then printf '    would install: %s %s\n' "$editor" "$ext"; continue; fi
        "$editor" --install-extension "$ext" --force >/dev/null 2>&1 || note_skip "$editor: $ext"
      done < bootstrap/vscode-extensions.txt
    fi
  done
fi

# --- 6. link the dotfiles ---------------------------------------------------
if [ "$DO_STOW" = 1 ]; then
  step "Linking dotfiles"
  command -v stow >/dev/null || die "stow missing -- the Brewfile step must have failed"
  run make install
fi

# --- 7. macOS system defaults ----------------------------------------------
if [ "$DO_DEFAULTS" = 1 ]; then
  if [ "$PLATFORM" = macos ]; then
    step "macOS defaults"
    run bash bootstrap/macos-defaults.sh
  else
    warn "--defaults ignored on Linux"
  fi
fi

# --- done -------------------------------------------------------------------
step "Done"
if [ ${#SKIPPED[@]} -gt 0 ]; then
  warn "${#SKIPPED[@]} package(s) did not install:"
  printf '      %s\n' "${SKIPPED[@]}"
  info "re-run to retry, or drop them from the bootstrap/ lists"
fi
cat <<EOF

    Next, by hand:
      - sign in to the App Store, then re-run for 'mas' apps
      - generate an SSH key and add it to GitHub:
            ssh-keygen -t ed25519 -C "\$USER@\$(hostname)"
      - set zsh as the login shell:  chsh -s \$(command -v zsh)
      - restart the terminal
EOF
