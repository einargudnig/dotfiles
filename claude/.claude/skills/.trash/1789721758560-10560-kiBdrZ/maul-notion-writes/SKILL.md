---
name: maul-notion-writes
description: "Safely change things in Maul's Notion workspace — the approval pattern, the tool mechanics, and the closing summary. Use before creating, renaming, moving, merging or deleting any Notion page at Maul, and whenever a task will touch more than one page — bulk edits, reorganising, applying an audit's fixes, updating a database. The canonical home for this workspace's Notion API traps: alias blocks that read as empty, moves that don't update the parent's link list, `replace_content` deleting child pages, mentions that lose their titles, database versus data-source IDs. Other Maul skills point here rather than restating them. Read it before the first write, not after."
---

# Changing things in Notion

Notion has no undo across pages. A wrong bulk edit is discovered days later by someone
who can't tell what it used to look like, and the page history only helps if you know
which pages to check. That asymmetry — cheap to ask, expensive to be wrong — drives
everything here.

This is also the canonical trap list for this workspace. The other Maul skills carry a
one-line warning and a pointer here; when one of them disagrees with this file, this file
wins for mechanics and the other skill needs updating.

## If another skill sent you here

Three things, and they hold even if you read nothing else:

1. **An explicit yes for each specific change.** "Clean this up" approves a proposal, not an
   edit.
2. **Re-fetch afterwards.** Notion writes partially succeed, silently.
3. **Close with what actually changed**, built from the re-fetch rather than from intent.

## Never move anything unasked

Moving is the one operation that changes where something lives while leaving nothing
behind. Someone who knew where a page was now doesn't.

**Never move, renumber, merge or delete without an explicit yes for that specific
change.** "Clean this up" is approval to *propose*, not to act.

| Operation | Approval |
|---|---|
| Read, search, audit, draft a report | none — just do it |
| Create one page the user asked for | do it, then say where it went |
| Rename / retitle | ask, unless the user named the exact change |
| Update a page the system owns (an index page it maintains) | do it, then report it |
| **Move, renumber, merge, delete — always** | **explicit yes per change** |

If you're unsure whether something counts as bulk, it does.

## Asking well

Use `AskUserQuestion` so the answer is a click, not a typed reply. Name the page, where it
is now, and where it would go, so the question can be judged without scrolling back.

**Single change:** Yes / No — plus a third option when there's a real alternative ("Move
to 22.12" versus "Retire the page instead").

**A batch:** don't fire twelve questions. Show the changes as a table *first*, so the
question refers to something visible:

| # | Page | Now | Proposed |
|---|---|---|---|
| 1 | Vesture er birgi fyrir hitagel | 22.02 (collides with Fastus) | 22.12 |
| 2 | Teya | 25.01 (collides with Abaki) | 25.04 |

Then one question covering the set:

- **Apply all** — do every change in the list
- **Decide one by one** — step through them individually
- **Skip all** — change nothing

If they choose one-by-one, walk the list with Yes / No / **Stop here** for each, and
honour "stop here" immediately. Don't finish off the easy remaining ones — they said stop
about the list, not that item.

Group things that are genuinely one decision (four trailing-whitespace fixes) into one
question. Keep genuinely distinct decisions separate.

## Executing

- Work in dependency order — free a number before assigning it to something else.
- Renames before moves: a rename is recoverable from page history, a move is harder to
  trace.
- Leave a trail. When something moves, add a line at the top of the moved page (`Áður
  22.02, breytt 2026-08-12`) and comment on pages that pointed at the old location. A
  silent move looks like a deletion.
- Re-fetch the affected parents afterwards. Notion writes can partially succeed, and
  "renamed 8 pages" when 2 silently failed is the worst possible report.

## Always close with a summary

Every session that changed anything ends with what actually happened, built from the
re-fetch rather than from intent:

```markdown
## Changes applied
| Page | From | To | Result |
|---|---|---|---|
| Vesture er birgi fyrir hitagel | 22.02 | 22.12 | renamed, redirect note added |
| Teya | 25.01 | 25.04 | renamed, redirect note added |

## Not applied
| Page | Why |
|---|---|
| 26 Hönnunarhús | you chose to keep it and fill it later |

Retired and not to be reused: 22.02, 25.01.
```

That last line is what people come back for. If nothing changed, say so plainly rather
than letting a long report imply otherwise. Retirements also need recording where the
system keeps them — `1.05` and the index `Athugasemd` column, per `jd-numbering`.

## Tools

Load schemas with `ToolSearch({query: "select:mcp__Notion__notion-fetch", …})` — they're
deferred.

| Task | Tool |
|---|---|
| Read a page (accepts a bare 32-char id) | `notion-fetch` |
| Confirm which workspace you're in | `notion-fetch` with `id: "self"` |
| Find a page | `notion-search` |
| Create under a parent | `notion-create-pages`, `parent: {type:"page_id", page_id:…}` |
| Rename | `notion-update-page`, `update_properties`, `properties: {title: "…"}` |
| Add a note at the top | `notion-update-page`, `insert_content`, `position: {type:"start"}` |
| Targeted edit | `notion-update-page`, `update_content` with old_str/new_str pairs |
| Move to another parent | `notion-move-pages` (≤100 ids per call) |
| Flag a decision to a person | `notion-create-comment` |
| Read database rows | fetch the database → get its `collection://` data source → `notion-query-data-sources` |

For anything beyond plain paragraphs, read the syntax spec first: `notion-fetch` with
`id: "notion://docs/enhanced-markdown-spec"`. Guessing produces silently mangled pages.

## Traps specific to this workspace

**Alias blocks read as empty.** Synced and linked blocks return as `unknown`, and fetching
the target often says "this page is blank". They cluster — whole categories are built from
them. A page that looks empty over the API may be full in the UI: never delete or "fix" on
API evidence alone, and report such a branch as not auditable rather than empty.

**Fetches can be silently truncated.** Check for `truncated: true`.

**Moving doesn't update the parent's link list.** In Maul í Reykjavík the root links to
its nine areas through a *column block*, and the areas aren't direct children of the root
at all — the ancestor path runs through two untitled intermediate pages. Where a parent
lists children as inline links, `notion-move-pages` won't touch that list. Re-fetch both
parents after a move and fix them by hand.

**`/link` creates a subpage; `@` doesn't.** Maul's own documented rule, and the main
source of accidental hierarchy. Reference pages with an `@` mention or an inline link on
selected text.

**`replace_content` can delete child pages.** It refuses by default and needs
`allow_deleting_content: true`. Never set that on a page whose children matter — a
category page's children are its IDs.

**A `<page>` tag in content is a subpage, not a link.** Including one with an existing
page's URL *moves* that page; removing one *removes* the child. Use `<mention-page>` to
reference.

**Mentions lose their titles over the API.** `<mention-page url=…/>` renders as a bare URL
when fetched, with the title stripped. Fine for prose a human reads; wrong for a table
another agent has to parse — use markdown links there. This is why the index pages use
links rather than mentions.

**Database IDs versus data source IDs.** Fetching a database returns one or more
`collection://…` data sources; queries and row creation need the data source ID. Several
things that look like ordinary pages here are databases — `13 Roles`, `51.01 Brand Assets`,
`45.16 Tékklistinn`, `72.07`, `80.10` among them. Check rather than assume; the list grows.

**Search ranks semantically, not numerically.** Searching `22.02` won't reliably return
both pages claiming it. To find collisions, fetch the category and read its children.

**Page IDs are stable; titles are not.** Anchor everything to the 32-char ID.

## Scheduled and unattended runs

The rules don't relax because a schedule fired instead of a person asking. An unattended
run may update index pages it maintains, and must report everything else rather than
acting on it. **When there's nobody to answer a question, the answer is no** — and since
every other Maul skill defers its writes to this file, that line has to travel with them:
they each restate it in one sentence, and this is where it's explained.