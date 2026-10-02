# Maintaining the index

The index isn't just documentation — it's the map every one of these skills reads before it
does anything, and the page colleagues navigate by when Claude isn't involved at all. That
makes keeping it accurate part of the work rather than a chore afterwards. An index nobody
trusts is worse than none, because it gets consulted and then quietly disbelieved.

Nothing else owns this. `jd-placement`, `jd-numbering` and `jd-audit` all read the index;
none of them updates it. So whichever task you were doing, the index correction is yours to
make in the same turn.

It lives under `0-9 Getting started` as the `1 Index` tree:

| Page | ID |
|---|---|
| `1 Index - Efnisyfirlit` — landing page, area skeleton, the rules | `3baca54d24e381938a35ff25c95683dc` |
| `1.01 Index - Maul ehf.` | `3baca54d24e3810fa492fb7806444511` |
| `1.02 Index - Maul í Reykjavík` | `3baca54d24e38127adedde892ba38cec` |
| `1.03 Index - Tiffin ApS` | `3baca54d24e381bd9b4bd52beba82973` |
| `1.04 Cross-KB numbering` | `3baca54d24e3818f97b7fdb976528bd5` |
| `1.05 Decisions & Retired Numbers` | `3c0ca54d24e381b08146d40b77f2130f` |

## The shape, and why

Each KB page is one table per area, three columns: category, ID ranges in use, notes.

Categories are markdown links — `[44 Bókhaldsferli](url)` — not Notion `@` mentions. That
choice matters and is easy to get wrong when regenerating. A mention looks better in the
UI and follows renames automatically, but over the API it renders as a bare URL with the
title stripped, which makes the index unreadable to the skill that depends on it. Links
keep both the title and the ID in one cell, so the page is a map for people *and* a map
for the machine. The tradeoff — link text going stale when a category is renamed — is
handled at refresh time.

Ranges rather than every ID keeps it maintainable. Someone who needs the exact title
clicks into the category. Listing every `xx.yy` would go stale within weeks and buy
little, since the category page already shows them.

The notes column carries defects: duplicate numbers, misfiled IDs, empty categories,
things that look wrong but are deliberate. Keeping them here rather than in a private
report means the cleanup backlog is visible to everyone, and gets crossed off as things
are fixed.

Each page is stamped with the date it was compiled. That stamp is what makes staleness
visible; never update a page without re-stamping it.

## Updating as you go

Small, in-the-moment corrections belong in the same turn as the change that caused them:

- **Filed a new page that extends a range?** Update that category's range. `44.01-44.11`
  becoming `44.01-44.12` is a one-line `update_content` edit.
- **Created a new category?** Add its row, and check whether `1.04` needs a line — a new
  category is exactly when cross-KB parallelism is decided.
- **Resolved a defect?** Clear the note. A stale note is worse than a missing one; it
  sends someone to fix something that's already fixed.
- **Renamed a category?** The link text won't follow it — update the text as well as any
  note. This is the one thing markdown links cost, so it's worth remembering.

Use `update_content` with a targeted search-and-replace for these. `replace_content` on
the landing page would take the four child index pages with it unless you pass
`allow_deleting_content` — don't. `maul-notion-writes` has the rest of the tool mechanics
and the traps.

## Regenerating

When the stamp is months old, or after a restructure touched several categories, rebuild
rather than patch — see the procedure in `maul-map.md`. A hand-patched index drifts in
ways nobody can see, because the errors are in the rows nobody looked at.

Updating these pages is a write, but a write to pages the system owns, so it doesn't need
the approval a content move does. It still needs reporting: say which pages you updated
and what changed.

## What doesn't belong here

Resist letting the index grow into a second knowledge base. It answers one question —
where would this live, and what numbers are taken. Process descriptions, owner lists and
decision history all belong on their own pages; the index points at them.

The decisions log is `1.05 Decisions & Retired Numbers`
(`3c0ca54d24e381b08146d40b77f2130f`), added August 2026. It records settled calls ("26 is
empty on purpose", "23.01 sits last"), the numbers that are retired for good, and — kept
deliberately separate — the questions still open. Without it every audit re-raises the same
questions, which is the fastest way to make people stop reading audits.

Maintaining it is the same discipline as the rest of the index: add the row in the same
sitting as the decision, move an open question up rather than deleting it when it's answered,
and record a retirement here as well as in the `Athugasemd` column. The retirement convention
itself lives on `0.02` rather than here — this page holds decisions, not conventions.
