# Restructuring

Renumbering is the most expensive operation in this system and the most tempting. A tidy
sequence is satisfying to produce and worth almost nothing to the people using it — they
navigate by remembered numbers and by Drive folders that mirror those numbers. Assume any
number you change is written down somewhere you can't see.

So the default answer to "should we renumber this?" is no. What follows is the set of
cases where something else is true.

Resolving a single duplicate is the everyday case and lives in the skill body. This file
covers the bigger moves: splitting, merging, retiring, and the rare renumber.

## Splitting a full category

A category holds 99 IDs, so "full" almost never means numerically full. It means
conceptually overloaded: Reykjavík's `41 Rúntar og útkeyrsla` has twenty IDs covering
driver roles, vehicles, parking, scheduling, and training. That's three topics wearing
one number.

Resist splitting anyway if the existing numbers are in use. The cheaper moves, in order:

1. **Headings inside the category.** Category 23 already does this — suppliers grouped
   under "current" and "retired". Zero cost, most of the benefit.
2. **A new category for new pages only.** Mint `49 Þjálfun bílstjóra`, put future
   training pages there, leave 41.09 and 41.17 where they are. The system tolerates this
   better than it tolerates a renumber; slight untidiness beats broken references.
3. **A full split with renumbering.** Only when the category is genuinely unusable and
   the user explicitly accepts the cost. Then do it properly: new numbers, redirect notes
   on every moved page, the old numbers left dead forever, and a heads-up to whoever
   maintains the Drive mirror.

## Merging overlapping categories

Reykjavík has `45 Gæðaferli` and `47 Reglugerðir og gæðamál`; Tiffin has `22 Packaging`
under Suppliers and `46 Packaging and instructions` under Operations. These overlaps are
real but they're also *cheap to live with*.

Before merging, establish that the overlap actually confuses someone. If pages are being
filed into the wrong one of the pair, it's a real problem. If the two just sound similar,
leave them — the cost of the merge is every reference to the retired category's numbers.

When a merge is right, the smaller and newer category folds into the older one, its pages
get new IDs in the surviving category, and the retired category page stays in place as a
stub pointing at the survivor. Don't delete it: a dead-end page that says "moved to 45"
is far kinder than a 404 in someone's memory.

## Retiring dead branches

Tiffin's kitchen operation closed in November 2024 and most of that tree is historical.
Empty shell categories (Maul ehf. 24, 73, 74, 80, 84) are a different kind of dead — they
were never filled.

- **Historical but real** — keep, and mark it. A line at the top of the area page saying
  what ended and when is worth more than any reorganisation.
- **Empty and unlikely to fill** — the category page can go, but the *number* stays
  retired. Don't reuse `73` for something else later.
- **Empty but structurally expected** — `80 Financial Analysis` being empty in Maul ehf.
  when Reykjavík's is populated is a gap in the content, not in the structure. Leave the
  shell; it tells you what's missing.

## Adding a new category

The two-digit level is the commitment. Before minting one:

- Check the sibling KBs — if Reykjavík calls it 47, use 47.
- Check the retired numbers in that area so you don't resurrect one.
- Say out loud that you're creating a new category and suggest the user confirm it with
  whoever reviews numbering. Maul's own guidance asks for this, and it's the one place
  where a quiet edit does lasting damage.

New *areas* are not on the table. The nine ranges are shared across all three entities;
changing them is a company decision, not a tidying task.

## Executing a multi-page change

Nothing in this file gets executed on your own initiative. Every move, renumber, merge
and deletion needs an explicit yes for that specific change — see the permission rules in
the `maul-notion-writes` skill, including the apply-all / one-by-one / skip-all pattern
for batches. Producing
the plan is the job; applying it is a separate decision that belongs to the user.

Once they've agreed to a set of changes:

- Work in dependency order — free up a number before assigning it to something else.
- Do the renames before the moves; a rename is reversible from the page history, a move
  is harder to trace.
- If the user chose one-by-one and then said stop, stop there. Don't finish "the easy
  remaining ones" — they said stop about the list, not about that item.
- Keep a running list of what succeeded and what didn't, and report both. A half-applied
  restructure that's reported as complete is the worst possible outcome, because the next
  person will trust the numbers.
- Re-crawl the affected branch afterwards and lint it. Verifying your own work here is
  cheap and the failure mode is silent.
- Close with the changes-applied / not-applied summary, including the list of numbers now
  retired.
