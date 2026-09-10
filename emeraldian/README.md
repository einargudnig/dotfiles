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
notes created in the TUI start blank. To work around that, three helper scripts
live in `~/.local/bin` and use the vault's own template files:

- `emeraldian-daily` — open today's daily note, creating it from
  `50 resources/templates/daily notes.md` if it doesn't exist yet.
- `emeraldian-new "Note Title"` — create a new note from
  `50 resources/templates/template1.md` and open it.
- `emeraldian-template` — lower-level command; supports `--vault`, custom
  `--template` names and `--folder`.

Supported placeholders:

- `{{title}}`, `{{date}}`, `{{yesterday}}`, `{{tomorrow}}`
- Templater-style dates from the existing vault templates:
  `<% tp.date.yesterday("YYYY-MM-DD") %>`,
  `<% tp.date.tomorrow("YYYY-MM-DD") %>`, etc.

This machine's vault uses:

- Vault: `~/personal/obsidian/second-brain`
- Templates folder: `50 resources/templates`
- Obsidian templates config: `.obsidian/templates.json`

If emeraldian adds native template support later, configure it here and retire
the helpers.

## Runtime files (ignored by stow)

- `state.json` — per-vault UI state
- `auth.json` — API keys (mode `0600`)
- `themes/*.toml` — custom themes
