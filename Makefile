STOW   := stow
DIR    := $(CURDIR)
TARGET := $(HOME)
UNAME  := $(shell uname -s)

# Packages whose target paths exist on any Unix.
PACKAGES_COMMON := claude gh-dash ghostty ghui herdr herdr-app hunk linters nvim pi scripts \
                   spotify-player tmux wezterm yazi zsh

# macOS-only: aerospace and karabiner are mac apps; cursor and lazygit install
# under ~/Library/Application Support, which has no Linux equivalent.
PACKAGES_MACOS  := aerospace cursor emeraldian karabiner lazygit

# Headless Mac mini: shared configs + lazygit (its config lives under ~/Library)
PACKAGES_SERVER := $(PACKAGES_COMMON) lazygit

ifeq ($(UNAME),Darwin)
PACKAGES := $(PACKAGES_COMMON) $(PACKAGES_MACOS)
else
PACKAGES := $(PACKAGES_COMMON)
endif

# Folders an app writes its own files into. Created first so stow links file by
# file into them instead of folding the folder into one link to this repo.
REAL_DIRS := $(TARGET)/.config/herdr-app/themes

.PHONY: help bootstrap install restow delete check dump brew defaults list server real-dirs

help:
	@echo 'Fresh machine:'
	@echo '  make bootstrap   install everything, then link (see ./bootstrap.sh --help)'
	@echo '  make server      headless Mac mini: CLI brew, link, always-on settings'
	@echo
	@echo 'Day to day:'
	@echo '  make restow      re-link; fixes a config an installer clobbered'
	@echo '  make check       dry run -- print the plan, change nothing'
	@echo '  make dump        re-record installed packages into bootstrap/'
	@echo
	@echo 'Less often:'
	@echo '  make install     link every package into $$HOME'
	@echo '  make delete      remove every link this repo owns'
	@echo '  make brew        install Homebrew packages only'
	@echo '  make defaults    apply macOS system settings (macOS only)'
	@echo '  make list        print the packages for this platform'

## full setup on a new machine
bootstrap:
	./bootstrap.sh

## link every package into $HOME
install: real-dirs
	$(STOW) -v -d $(DIR) -t $(TARGET) $(PACKAGES)

## re-link, pruning links whose source moved (run after renames, or after an
## installer replace-writes a config and severs its symlink)
restow: real-dirs
	$(STOW) -Rv -d $(DIR) -t $(TARGET) $(PACKAGES)

## remove every link this repo owns, leaving $HOME clean
delete:
	$(STOW) -Dv -d $(DIR) -t $(TARGET) $(PACKAGES)

## dry run -- print what install would do, change nothing
check:
	$(STOW) -nv -d $(DIR) -t $(TARGET) $(PACKAGES)

## re-record this machine's installed packages into bootstrap/
dump:
	@bash bootstrap/dump.sh

## Homebrew packages only
brew:
	brew bundle install --file=bootstrap/Brewfile
ifeq ($(UNAME),Darwin)
	brew bundle install --file=bootstrap/Brewfile.macos
endif

## macOS system settings
defaults:
	@bash bootstrap/macos-defaults.sh

## headless Mac mini: CLI-only Brewfile, shared configs, always-on settings
server: real-dirs
	brew bundle install --file=bootstrap/Brewfile.server
	$(STOW) -v -d $(DIR) -t $(TARGET) $(PACKAGES_SERVER)
	@bash bootstrap/server-setup.sh

real-dirs:
	@mkdir -p $(REAL_DIRS)

list:
	@echo '$(UNAME): $(PACKAGES)'
