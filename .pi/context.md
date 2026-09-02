# Dotfiles Repo

This is a macOS/Linux configuration repo managed with **GNU Stow**.
Every top-level directory is a stow package — its internal layout mirrors
the file path relative to `$HOME`.

## Key rules

- **Never edit `~/.zshrc` directly.** Edit `zsh/.zshrc` in the repo. Files
  are symlinked, so editing the symlink target edits the repo.
- **`make restow`** is the daily fix-it command. Run it after renames,
  after installers clobber configs, or whenever a symlink breaks.
- **`make dump`** records currently installed packages into `bootstrap/`.
  Run it after installing something new, review `git diff bootstrap/`, commit.
- **`make check`** is a dry run — use before touching stow links.

## Stow packages

Top-level dirs are packages. The Makefile lists them per platform:

```
PACKAGES_COMMON := claude gh-dash ghostty ghui herdr hunk linters nvim scripts
                   spotify-player tmux wezterm yazi zsh
PACKAGES_MACOS  := aerospace cursor karabiner lazygit
```

### Folded vs per-file

**Folded** (whole dir is one symlink — new files appear instantly):
`~/.config/nvim`, `~/.config/ghostty`, `~/.claude/skills`

**Per-file** (each file linked individually — new file needs `make restow`):
`~/.config/yazi`, `~/.config/herdr`, `~/.local/bin`

### .stow-local-ignore

Files that live inside a package but must NOT be linked go in
`.stow-local-ignore`. One anchored regex per line:

```
^/helper\.sh$
```

Creating a `.stow-local-ignore` **replaces** stow's built-in ignore list.

## Bootstrap

`bootstrap.sh` installs prerequisites, Homebrew, every recorded package,
then links the dotfiles. Idempotent — re-running also repairs drift.

Key manifests in `bootstrap/`:
- `Brewfile` — formulae (macOS + Linux)
- `Brewfile.macos` — casks + Mac App Store (macOS only)
- `uv-tools.txt`, `cargo-crates.txt`, `go-packages.txt`, `bun-global.txt`,
  `npm-global.txt` — language-specific tools
- `node-versions.txt` — fnm versions
- `macos-defaults.sh` — system settings

## Scripts

`scripts/papercut` is a friction-logging CLI. Other scripts in `scripts/`
are invoked by absolute path from `.zshrc`.

## Gotchas

- `make restow` unlinks `~/.zshenv` briefly. A shell started in that
  window has no PATH. Harmless and self-healing.
- On Linux, `cursor` and `lazygit` configs use different paths — they're
  simply skipped.
- `papercuts.md` is a log, not configuration. Don't edit it manually
  unless you know what you're doing.
