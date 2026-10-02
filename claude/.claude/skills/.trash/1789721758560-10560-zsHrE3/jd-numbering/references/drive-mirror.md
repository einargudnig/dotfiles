# The Google Drive mirror

Maul's Drive folder tree uses the same numbers as Notion. That's why renumbering costs
more than it appears to: a number lives in two systems, and changing it in one leaves the
other lying. Before retiring or reassigning any number, look at the Drive side — it takes
one search and it's the difference between a clean change and a half-done one.

## How the tree is named

Drive names are **not** the Notion titles. They're lowercase, hyphenated, mostly English,
and carry an entity suffix:

| Notion | Drive |
|---|---|
| `20-29 Birgjar` (Reykjavík) | `20-29 suppliers-rvk` |
| `20-29 Suppliers` (Maul ehf.) | `20-29 suppliers-ehf` |
| `20-29 Suppliers` (Tiffin) | `20-29 suppliers-cph` |
| `40-49 Rekstur` | `40-49 operations-rvk` |
| `41 Rúntar og útkeyrsla` | `41 delivery-routes-rvk` |
| `41.02 Útkeyrsla - verkefni` | `41.02 útkeyrsla-rvk` |

So the number is the reliable part and the name is not — always search by number prefix,
never by title.

Known area roots:

- `40-49 operations-rvk` — `1MgEncq8gljK5ynwE-hZDjnalFSTHgJ-k`
- `40-49 operations-ehf` — `13qgWwMTq4tFhRsQHNAslVgida3qDM7bI`
- `40-49 operations-cph` — `1EdHp2OxCHXjZ6_EOoKURloHKA1BgEZIC`
- `20-29 suppliers-rvk` — `1jFOBxkt8taj1ZpToIm3-o6pmrKMMNjck`
- `20-29 suppliers-ehf` — `143gy9ZDCmf7Q1y5NT_abfkYc26gPtFsC`
- `20-29 suppliers-cph` — `1ooDphlqM3sZtIEZjysIFM27i6vUAX9g8`

## Legacy duplicate trees

Several area folders exist twice under different parents — there are two
`20-29 suppliers-ehf` and two `40-49 operations-ehf`, one of each modified in 2025 and
one untouched since 2022. The 2022 copies appear to be an abandoned reorganisation and
are mostly read-only (`canAddChildren: false`).

Practical consequence: **check `modifiedTime` and `canAddChildren` before concluding you
found "the" folder**, and when reporting, say which one you looked at. Don't try to
reconcile the duplicate trees as part of a numbering task — that's a separate decision
and a much bigger one.

## The mirror is partial, and sometimes wrong

Don't treat Drive as the authority. In category 22 (Reykjavík), only three of eleven IDs
have folders at all, and one of those — `22.06 Vytal` — disagrees outright with Notion,
where 22.06 is `Graf.is fyrir skapalón`. So a Drive folder is *evidence* that a number is
in real-world use, not proof of what it means.

That still makes it worth checking, because it's evidence from outside Notion and it can
legitimately change the answer: where two pages collide and only one has a Drive folder,
the folder is a strong argument for which page keeps the number, even against the usual
older-page-wins rule. Say when Drive is what tipped the recommendation, so the user can
overrule you with knowledge you don't have. And when Drive and Notion disagree about what
a number means, report it as its own finding rather than silently siding with one.

Adding a number needs no Drive change — nothing is being invalidated. It's still worth a
single search, because a folder at the number you're about to claim means someone already
used it outside Notion.

## Checking before a renumber

```
mcp__Google_Drive__search_files({
  query: "title contains '22.02' and mimeType = 'application/vnd.google-apps.folder'",
  excludeContentSnippets: true
})
```

Three outcomes, and they change the recommendation:

- **No folder** — Drive doesn't care. The renumber is Notion-only; say so, it makes the
  change cheaper and the user should know that.
- **A folder exists and has files** — the number is load-bearing in two systems. Report
  the folder, its file count and its URL alongside the proposed change, so the user is
  approving both halves. Renaming the Drive folder to match is part of the change, not a
  follow-up.
- **A folder exists but is empty** — low cost, but still rename it, or the next person
  finds a `22.02` folder that means nothing.

Search on the ID prefix, not the whole title, and remember the entity suffix — `22.02`
will match in all three trees, and only the one matching the KB you're working in is
yours to touch.

## Writing to Drive

Renaming or moving a Drive folder is a change like any other: it needs the same explicit
yes as the Notion side, and it belongs in the same approval question — "rename in both
Notion and Drive" is one decision, not two. If the Drive connector isn't available in the
session, don't guess: say the Drive side is unchecked and list the numbers the user
should verify themselves.

Include the Drive outcome in the closing summary:

```markdown
| Page | From | To | Notion | Drive |
|---|---|---|---|---|
| Vesture | 22.02 | 22.12 | renamed | folder `22.02 vesture-rvk` renamed (4 files) |
| Teya | 25.01 | 25.04 | renamed | no folder found — Notion only |
```
