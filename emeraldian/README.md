# emeraldian

Terminal UI for Obsidian vaults: <https://github.com/iamrohithrnair/emeraldian>

## Config

`Library/Application Support/emeraldian/config.toml` is the macOS config path
(`~/.config/emeraldian/config.toml` on Linux).

Current choices:

- Theme: `catppuccin-macchiato`
- Vim mode: on
- Auto-save: on
- Reading mode by default: on

## Templates

Emeraldian does **not** read Obsidian's Templates plugin configuration. New
notes created in the TUI start blank. Templates are still managed inside the
vault by Obsidian.

This machine's vault uses:

- Vault: `~/personal/obsidian/second-brain`
- Templates folder: `50 resources/templates`
- Obsidian templates config: `.obsidian/templates.json`

If emeraldian adds template support later, configure it here.

## Runtime files (ignored by stow)

- `state.json` — per-vault UI state
- `auth.json` — API keys (mode `0600`)
- `themes/*.toml` — custom themes
