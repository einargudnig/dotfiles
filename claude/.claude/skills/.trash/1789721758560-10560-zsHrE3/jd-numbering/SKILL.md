---
name: jd-numbering
description: Assign, retire and repair Johnny Decimal numbers in Maul's Notion workspace and the mirrored Google Drive tree. Use when the question is which number something gets — "what number should this be", "what's the next free ID", "is 44.12 taken", "two pages both say 22.02", "can we renumber this", "should we split this category", "can I reuse a deleted number" — and whenever a duplicate, a misfiled ID or a category that has outgrown itself needs resolving. Covers the never-reuse rule, next-free lookup, duplicate resolution, title format, cross-KB parallelism, the cost of renumbering, and the `jd_lint.py` checker. Assumes the area and category are already settled; if the open question is *where* something belongs, use `jd-placement` instead.
---

# Numbering

A Johnny Decimal number is an address, and addresses are only useful if they stay put.
People memorise them, quote them in Slack, name Drive folders after them, and write them
into role descriptions. So the whole discipline reduces to one asymmetry: **adding a
number is free, changing one is expensive.** Everything below follows from that.

This skill assumes you already know which area and category the thing belongs in. If
that's still open, `jd-placement` settles it first.

## Assigning a new number

**First, check it doesn't already have one.** Search the topic — in both languages if it
could go either way — before assigning anything. With ~500 numbered pages, the answer is
often "someone made a stub for this eighteen months ago", and filling that page beats
minting a second number for the same process. Two pages for one process is the exact
failure numbering exists to prevent.

Also check whether `13 Roles` or `14 Responsibilities` (Maul ehf.) already reference the
topic by number — those databases point at process pages, and a duplicate process splits
the reference. Their rows are numbered `14.<category>`, pointing at the area the work
belongs to (`14.40` is a restaurant-facing process, `14.10` is people ops), so the row
number itself is evidence about where a process is considered to live.

**Then take the highest second pair in the category and add one.**

**Never fill a gap.** A gap means something was deleted or moved, and the old number may
still live in Drive, in Slack, or in someone's head. Reykjavík's `23` runs 23.01–23.21
then jumps to 23.29; the next supplier there is **23.40**, not 23.22. Gaps are free.
Collisions cost hours.

**Check the dead list before claiming any number.** `1.05 Decisions & Retired Numbers`
(`3c0ca54d24e381b08146d40b77f2130f`), in the `1 Index` tree, carries the numbers that are
retired for good and the calls that have already been settled. It is the only place a
retirement is recorded deliberately rather than as an absence, so a number missing from a
category *and* listed there is dead, not free. Its open table also tells you which numbering
questions are still unsettled — including one that matters here: `93.10` is currently in use
twice in the asset database, so the never-reuse rule is already broken once.

**Check the number isn't already in use elsewhere.** This workspace has several IDs filed
outside their category. Search the number across the KB before claiming it.

**Title it number-first:** `46.03 Thermoboxes`. Search, sort and scan all depend on the
number leading. Match the KB's language — Icelandic in Reykjavík, English in Maul ehf.
and Tiffin — and don't translate an existing title while you're in there; that breaks
people's recall of it.

## New category numbers are a bigger deal

The two-digit level is a commitment. Before minting one:

- **Check the sibling KBs.** If Reykjavík calls it `47`, Maul ehf. should use 47 too.
  Reusing the sibling's number is almost always better than picking a free one — the
  parallelism table on index page `1.04` is what makes three trees navigable as one.
- **Check the retired numbers** in that area so you don't resurrect one.
- **Say out loud that you're creating a category**, and suggest the user confirm it with
  whoever reviews numbering. Maul's own guidance asks for this. It's the one place a
  quiet edit does lasting damage.

New *areas* are not on the table.

## Resolving a duplicate

Two pages share a number; one must move. Decide which by asking who is referencing them:

1. **Which is older?** More time at that number means more references in the world.
2. **Which is linked to?** Search the number and the title across the workspace.
3. **Which exists in Drive?** A folder named `22.02 Fastus` settles it — and this is
   evidence from outside Notion, so it can legitimately overrule the older-page rule. See
   `references/drive-mirror.md`.
4. **Which is still live?** A supplier you stopped using in 2024 can move even if it's
   older.

The loser gets the next free number in the category — highest + 1, not the gap. Add a
line at the top of the moved page (`Áður 22.02, breytt 2026-08-12`) and comment on
anything that pointed at the old number.

Say which piece of evidence decided it, especially when it overrides the usual rule. That
lets the user overrule you with knowledge you don't have.

## What breaks when a number changes

Three kinds of reference, three behaviours:

- **`@` mentions follow the page.** They're by page ID; renames and renumbers don't
  touch them. Nothing to do.
- **Plain text and markdown links don't.** `see 30.06` as text, or `[45.13 Verkferli](/id)`,
  says the old number forever. Search the old number across the workspace and fix what
  you find.
- **Drive folders don't.** Check before, rename after — `references/drive-mirror.md`.

The references most easily orphaned are in `13 Roles`
(`e60e2f4b16f34169b88362d713383893`) and `14 Responsibilities`
(`c08a68a6f557462cb301775128df7393`). Rows there are named by number and link to the
process page from their body, so a renumbered process can leave a responsibility pointing
at a number that no longer exists. An unowned process is a worse outcome than an untidy
one.

## Retiring a number

`0.02 Retirement Convention` (`3c0ca54d24e381ab86dcce2099c4ec05`) is the house rule, and the
short version is that retiring is not deleting. The page keeps its number and stays where it
is; it gets marked in three places — a retired heading on the parent with current items first,
the `(Úrelt)` / `(Retired)` tag at the end of its title, and a dated footer line giving the
reason — and the Drive folder gets the same tag with its number unchanged.

The numbering half is yours: **record the number on `1.05` and in the index's `Athugasemd`
column, in the same sitting.** A gap nobody wrote down is how the never-reuse rule fails, and
it fails silently, years later. The next page in that category then takes highest + 1 as
usual, never the gap.

Two things that look like retirement and aren't. A **rename** — the supplier still exists
under a new name — keeps its number and gets no tag. A **member of a churny population**, a
restaurant or a workplace, was never numbered in the first place; it moves between the active
and inactive list pages.

## Splitting, merging, retiring

`references/restructuring.md` covers these properly. The short version: a category with
twenty IDs is usually overloaded rather than full, and the cheap fixes — headings inside
the category, or a new category for *new* pages only — beat a renumber almost every time.
Slight untidiness is cheaper than broken references.

## Linting

`scripts/jd_lint.py` takes a plain list of `ID Title` lines grouped by `# category`
headers and reports duplicates, out-of-range IDs, unnumbered entries, malformed titles,
gaps, and the next free number per category. Use it rather than eyeballing — a category
with forty entries is exactly where the eye slides past a repeated number.

```bash
python3 scripts/jd_lint.py inventory.txt
python3 scripts/jd_lint.py inventory.txt --json
```

Format:

```
## AREA 20-29 Birgjar
# 22 Umbúðir birgjar
22.01 Garri
22.02 Fastus
22.02 Vesture
```

Gaps are reported as informational, never as something to fill — the tool knows the rule.

## Before you change anything

Renumbering, moving and merging need an explicit yes for each specific change; proposing
is not the same as being told to act. The approval pattern, the batch options and the
closing change summary live in `maul-notion-writes`. Producing the plan is this skill's
job; applying it is a separate decision that belongs to the user.
