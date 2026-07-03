---
name: backfill-daily-notes
description: Create missing Obsidian daily notes for all past dates and link them into the yesterday/tomorrow chain. Use when the user asks to backfill daily notes, fill gaps in the planner, or fix broken yesterday/tomorrow links in the second-brain vault.
---

# Backfill Daily Notes

Fills gaps in the daily-note chain in the second-brain vault (`~/personal/obsidian/second-brain/30 planner`).

## How it works

The bundled script (`backfill.ts`, in this skill's directory):

1. Reads the vault's `.obsidian/daily-notes.json` to find the planner folder and the Templater template (`50 resources/templates/daily notes.md`).
2. Scans the planner recursively for `YYYY-MM-DD.md` files (year subfolders included, `weeks/` ignored).
3. For every date from the earliest note to today with no file, renders the template — substituting the `tp.file.creation_date(...)` / `tp.date.yesterday(...)` / `tp.date.tomorrow(...)` placeholders for the *target* date, not today.
4. Writes the note into the same folder as its nearest earlier neighbor, so it follows the vault's year-subfolder archiving convention.
5. Backfilled notes are identical to template-created ones. Pass `--mark` to set `type: backfill` in frontmatter if the user wants them distinguishable (Dataview: `where type = "backfill"`).

Linking needs no extra work: the template's `« [[Yesterday]] | [[Tomorrow]] »` line means each created note links both ways, and the neighbors' existing links resolve once the missing file exists.

## Usage

Always dry-run first, show the user the list, then write:

```bash
node ~/.claude/skills/backfill-daily-notes/backfill.ts           # dry run
node ~/.claude/skills/backfill-daily-notes/backfill.ts --write   # create notes
```

Flags:
- `--from YYYY-MM-DD` — only backfill from this date (default: earliest existing note)
- `--mark` — set `type: backfill` on created notes (off by default)

## Notes

- The script is TypeScript run directly via Node's native type stripping — requires Node >= 23.6 (no build step, no dependencies).
- The script never overwrites: it writes with the `wx` flag and skips existing files.
- If the template gains a Templater expression the script doesn't know, it warns and leaves the raw placeholder in place — update `renderTemplate()` in `backfill.ts`.
- Backfilled notes use `00:00` as the creation time in the info callout.
