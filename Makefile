STOW    := stow
DIR     := $(CURDIR)
TARGET  := $(HOME)
PACKAGES := aerospace claude cursor gh-dash ghostty herdr hunk karabiner lazygit \
            linters nvim scripts spotify-player tmux wezterm yazi zsh

.PHONY: install restow delete check list

## link every package into $HOME
install:
	$(STOW) -v -d $(DIR) -t $(TARGET) $(PACKAGES)

## re-link everything, pruning links whose source moved (run after renames,
## or after an installer replace-writes a file and severs its symlink)
restow:
	$(STOW) -Rv -d $(DIR) -t $(TARGET) $(PACKAGES)

## remove every link this repo owns, leaving $HOME clean
delete:
	$(STOW) -Dv -d $(DIR) -t $(TARGET) $(PACKAGES)

## dry run -- print what install would do, change nothing
check:
	$(STOW) -nv -d $(DIR) -t $(TARGET) $(PACKAGES)

list:
	@printf '%s\n' $(PACKAGES)
