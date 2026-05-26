---
name: memento-defrag
description: Archive stale session breadcrumbs in the second-brain vault. Moves old, orphaned, superseded breadcrumbs to an _archive/ subfolder. No merging, no deletion. Run periodically to keep claude-breadcrumbs/ tight.
---

# Breadcrumb defrag — vault maintenance

Move stale session breadcrumbs to `claude-breadcrumbs/_archive/` to keep the
active capture folder focused. No merging, no deletion — git history preserves
everything.

Breadcrumbs folder:
`/Users/einargudjonsson/personal/obsidian/second-brain/claude-breadcrumbs/`

> Repointed 2026-05-26. Previously operated on the retired `~/memento` atomic-note
> vault. Now it prunes the flat `/done` + `/memento` breadcrumbs.

## When to use

- Periodically (monthly, or when the breadcrumb count feels high)
- User invokes `/memento-defrag`

## Process

1. **List breadcrumbs.** Glob `claude-breadcrumbs/*.md` (skip `_archive/` and
   the `les/` migrated subfolder). Parse frontmatter for `date`, `project`,
   `tags`, and read the Summary + Follow-ups sections.

2. **Identify archive candidates.** A breadcrumb is a candidate if ANY hold:
   - Older than 90 days AND has no open follow-ups (`- [ ]`) remaining
   - Orphaned: not referenced by any other note in the vault AND contains no
     outbound `[[wikilinks]]` of its own AND older than 60 days (a dead leaf)
   - Superseded: a later breadcrumb for the same project/branch covers the same
     ground and is at least 14 days newer

   A breadcrumb is NEVER a candidate if:
   - It has **open follow-ups** (`- [ ]`) — those are live threads
   - It is referenced by a weekly-review or any slip-box / reference note
   - It was created in the last 30 days

3. **Show the candidate list** before moving anything:

   ```
   Archive candidates (X breadcrumbs):

   - 2026-01-04_feat-x.md — 142 days old, no open follow-ups
   - 2026-02-11_debug-y.md — orphaned dead leaf, 104 days old
   ...

   Staying active: Y
   ```

   Wait for confirmation. The user can exclude specific files.

4. **Move confirmed candidates** to `claude-breadcrumbs/_archive/`. Create the
   directory if needed.

5. **Fix inbound links.** In any active note that links to an archived
   breadcrumb, keep the link but add an `(archived)` suffix.

6. **Report** what was archived and what stayed. The daily vault backup commits
   the move; no manual commit needed.

## Rules

- Never delete breadcrumbs. Move to `_archive/` only.
- Never merge breadcrumbs. Each stays as its own session record.
- Never archive without user confirmation.
- Never touch a breadcrumb with open follow-ups.
- Leave the `les/` migrated subfolder alone.
