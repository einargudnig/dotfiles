---
name: backfill-daily-notes
description: Create missing Obsidian periodic notes (daily, weekly, monthly) for all past dates and link them together — yesterday/tomorrow chain for dailies, day links in weeklies, week links in monthlies. Use when the user asks to backfill daily/weekly/monthly notes, fill gaps in the planner, or fix broken periodic-note links in the second-brain vault.
---

# Backfill Periodic Notes

Fills gaps in the daily, weekly, and monthly note chains in the second-brain vault (`~/personal/obsidian/second-brain/30 planner`).

## How it works

The bundled script (`backfill.ts`, in this skill's directory):

1. Reads the vault's own config — `.obsidian/daily-notes.json` for dailies, `.obsidian/plugins/periodic-notes/data.json` for weeklies/monthlies — to find each folder and Templater template. Stale template paths missing the `50 ` folder prefix are resolved automatically.
2. Scans each folder recursively for its naming pattern (`YYYY-MM-DD.md`, `YYYY-Wnn.md`, `YYYY-MM.md`; year subfolders included).
3. For every period from the earliest existing note to today with no file, renders the template — substituting `tp.file.creation_date(...)` / `tp.date.yesterday(...)` / `tp.date.tomorrow(...)` for the *target* period's anchor date (the day, the week's Monday, the month's 1st).
4. Placement follows the vault convention: year subfolder if it exists (archived years), otherwise the folder root (current year).
5. Linking per type:
   - **daily** — the template's `« [[Yesterday]] | [[Tomorrow]] »` line links the chain; neighbors resolve once the file exists.
   - **weekly** — inserts `[[YYYY-MM-DD]]` under each `## Monday`…`## Sunday` heading.
   - **monthly** — inserts `[[YYYY-Wnn]]` under each `## Week N` heading for every ISO week overlapping the month, adding `## Week 5`/`## Week 6` sections before `## Review` when the month outgrows the template's 4 headings (matches the manual convention in existing monthly notes).

## Usage

Always dry-run first, show the user the list, then write:

```bash
node ~/.claude/skills/backfill-daily-notes/backfill.ts           # dry run, all types
node ~/.claude/skills/backfill-daily-notes/backfill.ts --write   # create notes
```

Flags:
- `--type daily|weekly|monthly` — restrict to one note type (default: all)
- `--from YYYY-MM-DD` — only backfill periods starting on/after this date (default: earliest existing note per type)
- `--mark` — set `type: backfill` in daily-note frontmatter (off by default; weekly/monthly templates have no frontmatter)

## Notes

- The script is TypeScript run directly via Node's native type stripping — requires Node >= 23.6 (no build step, no dependencies).
- The script never overwrites: it writes with the `wx` flag and skips existing files.
- If a template gains a Templater expression the script doesn't know, it warns and leaves the raw placeholder in place — update `renderTemplate()` in `backfill.ts`.
- Backfilled daily notes use `00:00` as the creation time in the info callout.
- Yearly notes (`30 planner/years/`) are not handled — the year template is bespoke and a missing year is a deliberate signal, not a gap.
