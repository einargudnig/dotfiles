# dotfiles

macOS and Linux configuration, managed with [GNU Stow](https://www.gnu.org/software/stow/).

Every directory at the top level is a **stow package** whose internal layout
mirrors the path of its files relative to `$HOME`. Stow then links them in:

```
zsh/.zshrc                                  ->  ~/.zshrc
nvim/.config/nvim/                          ->  ~/.config/nvim
claude/.claude/skills/                      ->  ~/.claude/skills
lazygit/Library/Application Support/…       ->  ~/Library/Application Support/lazygit
```

Because these are symlinks rather than copies, editing `~/.zshrc` *is* editing
the repo. Nothing needs to be synced back.

> `docs/index.html` is the same reference as a standalone page — open it in a
> browser, or serve `docs/` with GitHub Pages. It follows the system colour
> scheme.

## New machine

```bash
curl -fsSL https://raw.githubusercontent.com/einargudnig/dotfiles/master/bootstrap.sh | bash
```

Installs prerequisites, Homebrew, every recorded package, then links the
dotfiles. Idempotent — re-running it also repairs a machine that has drifted.

```
--minimal     skip GUI apps and language-manager packages
--no-casks    skip GUI apps (automatic on Linux)
--no-langs    skip uv / cargo / go / bun / npm / node packages
--no-stow     skip linking
--defaults    also apply macOS system settings
--all-node    install every recorded node version, not just the default
--dry-run     print what would happen, change nothing
```

## Day to day

```bash
make help      # all targets
make restow    # re-link -- the repair command
make check     # dry run, changes nothing
make dump      # re-record installed packages into bootstrap/
```

**`make restow` is the one you'll actually use.** Run it when you rename a file
in the repo, and when an installer replace-writes a config and severs its
symlink.

**`make dump` is the one that keeps this alive.** Run it after installing
something worth having on every machine, then review `git diff bootstrap/` and
commit. Without the habit, the package lists rot.

## Adding a new file

Whether a new file appears in `$HOME` immediately depends on how stow linked
that package — and stow folds a directory into a single link only when nothing
unmanaged already lives at the target.

**Folded** (whole directory is one symlink — new files appear instantly):

```
~/.config/nvim   ~/.config/ghostty   ~/.config/gh-dash   ~/.config/karabiner
~/.claude/skills ~/.claude/agents    ~/.claude/commands  ~/.claude/get-shit-done
```

**Per-file** (each file linked individually — a new file needs `make restow`):

```
~/.config/yazi   ~/.config/herdr     ~/.config/hunk      ~/.config/aerospace
~/.config/spotify-player             ~/.claude/hooks     ~/.local/bin
```

## Adding a package

Mirror the path the tool wants, relative to `$HOME`:

```bash
mkdir -p zellij/.config/zellij
mv ~/.config/zellij/config.kdl zellij/.config/zellij/
# add "zellij" to PACKAGES_COMMON in the Makefile
make install
```

Support files that live inside a package but must **not** be linked into `$HOME`
go in that package's `.stow-local-ignore`, one anchored regex per line:

```
^/helper\.sh$
```

> Creating a `.stow-local-ignore` **replaces** stow's built-in ignore list rather
> than extending it. Copy the defaults block from `zsh/.stow-local-ignore`.

## Packages

| Package | Links into | What it is |
|---|---|---|
| `aerospace` † | `~/.config/aerospace` | Tiling window manager |
| `claude` | `~/.claude` | Claude Code: instructions, settings, skills, agents, hooks |
| `cursor` † | `~/Library/Application Support/Cursor/User` | Cursor editor settings and keybindings |
| `gh-dash` | `~/.config/gh-dash` | GitHub PR/issue dashboard |
| `ghostty` | `~/.config/ghostty` | Terminal |
| `herdr` | `~/.config/herdr` | Terminal multiplexer for coding agents |
| `hunk` | `~/.config/hunk` | Terminal diff viewer |
| `karabiner` † | `~/.config/karabiner` | Keyboard remapping |
| `lazygit` † | `~/Library/Application Support/lazygit` | Git TUI |
| `linters` | `~/.markdownlint-cli2.jsonc`, `~/.prettierrc.yaml` | Global formatter/linter config |
| `nvim` | `~/.config/nvim` | Neovim |
| `scripts` | `~/.local/bin/papercut` | Friction log CLI |
| `spotify-player` | `~/.config/spotify-player` | Spotify TUI |
| `tmux` | `~/.tmux.conf`, `~/Library/LaunchAgents` | tmux + session-prune agent |
| `wezterm` | `~/.wezterm.lua` | Terminal (superseded by Ghostty) |
| `yazi` | `~/.config/yazi` | File manager |
| `zsh` | `~/.zshrc`, `~/.zshenv` | Shell |

† macOS only. The Makefile computes `PACKAGES` from `uname`, so these are
skipped on Linux.

Not stow packages: `bootstrap/` (package manifests) and `scripts/*.sh` other
than `papercut`, which are invoked by absolute path from `.zshrc`.

## What bootstrap installs

| Manifest | Contents |
|---|---|
| `bootstrap/Brewfile` | 47 taps, 153 formulae — macOS **and** Linux |
| `bootstrap/Brewfile.macos` | 19 casks, 15 Mac App Store apps — macOS only |
| `bootstrap/uv-tools.txt` | Python tools via `uv` |
| `bootstrap/cargo-crates.txt` | Rust crates |
| `bootstrap/go-packages.txt` | Go modules (paths read from the binaries) |
| `bootstrap/bun-global.txt` | Bun globals |
| `bootstrap/npm-global.txt` | npm globals |
| `bootstrap/vscode-extensions.txt` | Editor extensions |
| `bootstrap/node-versions.txt` | fnm node versions (`node-default.txt` is the one installed by default) |
| `bootstrap/macos-defaults.sh` | System settings that deviate from macOS stock |

Homebrew is split in two on purpose: it runs on Linux, but **casks and Mac App
Store apps do not exist there**, and a single Brewfile containing `cask` lines
hard-fails `brew bundle` on Linux.

`npm` and `bun` versions are stripped from the manifests deliberately. Pinning
them makes a fresh machine fail on a yanked release, and the lists exist to say
*have this tool*, not to reproduce an exact build.

## Notes

- The bootstrap is written for **bash 3.2** — what `/usr/bin/env bash` resolves
  to on a bare Mac. It has to run before Homebrew exists.
- `make restow` unlinks and relinks, so `~/.zshenv` is absent for a split
  second. A shell that starts in that window comes up with no `PATH`. Harmless
  and self-healing, but use absolute paths in anything scripted around it.
- On Linux, `cursor` and `lazygit` want `~/.config/…` rather than
  `~/Library/Application Support/…`. Not yet handled — they're simply skipped.
- `papercuts.md` is a log of environment friction, appended by the `papercut`
  CLI. Not configuration.
