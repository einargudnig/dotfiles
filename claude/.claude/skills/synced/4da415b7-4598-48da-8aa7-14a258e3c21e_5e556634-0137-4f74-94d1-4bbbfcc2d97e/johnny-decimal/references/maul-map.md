# Anchors, and where the live map lives

This file holds only the parts of the workspace that don't change: the workspace and
root page IDs, the nine-area skeleton, and how to reach the live map.

**The map itself is in Notion, not here.** It's the `1 Index` tree, which lists every
category with its current ID ranges. That was a deliberate choice: a map baked into a
skill file freezes on the day it's packaged and can only be corrected by repackaging,
while a map in Notion can be corrected by anyone, is visible to colleagues who don't use
Claude at all, and is the same artefact they navigate by. Read it at the start of any
filing or audit task.

These IDs are shared. `jd-placement` and `jd-audit` both point here for them rather than
keeping their own copies, so a page ID corrected in this file is corrected everywhere.

## Live index pages

| Page | Covers | ID |
|---|---|---|
| `1 Index - Efnisyfirlit` | Landing page, area skeleton, the rules | `3baca54d24e381938a35ff25c95683dc` |
| `1.01 Index - Maul ehf.` | Categories and ID ranges | `3baca54d24e3810fa492fb7806444511` |
| `1.02 Index - Maul í Reykjavík` | Categories and ID ranges | `3baca54d24e38127adedde892ba38cec` |
| `1.03 Index - Tiffin ApS` | Categories and ID ranges | `3baca54d24e381bd9b4bd52beba82973` |
| `1.04 Cross-KB numbering` | Numbers shared across the three trees | `3baca54d24e3818f97b7fdb976528bd5` |
| `1.05 Decisions & Retired Numbers` | Settled calls, dead numbers, open questions | `3c0ca54d24e381b08146d40b77f2130f` |

Fetching an index page gives you more than a reading list: every category is a markdown
link carrying its title and page ID. One fetch of `1.02` replaces a crawl of the whole
Reykjavík tree, and the titles are whatever they were at the last refresh rather than
whatever they were when this skill was packaged.

The Notes column on each index page carries the known defects — duplicate numbers,
misfiled IDs, empty categories. Treat it as the current defect register.

Each index page is stamped with the date it was compiled. If that stamp is old and the
task turns on precise numbers, say so and offer to refresh it.

## What to do when the index is wrong or missing

The index is a convenience, not an oracle. Two rules keep it from becoming a trap:

**Always confirm the specific number against the category page itself.** Before claiming
`44.12` is free, fetch `44` and look. The index gives you the right category in one hop;
the category page gives you the truth about its contents. This is the whole safeguard
against a stale index, and it costs one call.

**If the index and reality disagree, reality wins — and say so.** A category on the index
that no longer exists, or a category in Notion missing from the index, is itself a
finding worth reporting. Then offer to update the index page, which is a page the system
owns and therefore cheap to correct.

If the index pages have been deleted or moved, fall back to crawling from the roots below
and offer to rebuild them — `index.md` has the structure.

## Stable anchors

Workspace **Maul** — `8ab3a3b8-bb05-40ec-8b1a-15a65ad08763`, teamspace **General**.
Confirm with `notion-fetch` on `self` if there's any doubt about which workspace you're
connected to.

| KB | Language | Scope | Root |
|---|---|---|---|
| Maul ehf. | English | Parent company: software, IT, product, investors | `b06e5d52627c4471b9e23e133e7850a5` |
| Maul í Reykjavík | Icelandic | Reykjavík operation: drivers, restaurants, customers | `6fff90254e6249818467e65a80fb31f5` |
| Tiffin ApS | English | Copenhagen — largely historical since Nov 2024 | `cb20ff518da54087bae6237728d8746d` |

`0-9 Getting started` — `22e415cc7ed849afaa80f4766bac6bec` — sits above all three and
holds the conventions, including `0 Númerakerfið - Johnny Decimal`
(`12fb24f7700445c1a451d3950f09e5b0`) and the `1 Index` tree.

The two house standards live under `0 Númerakerfið`:

| Page | Covers | ID |
|---|---|---|
| `0.01 Page Template & Writing Standard` | How a page is written — skeleton, metadata, six rules | `3bbca54d24e3819581add9d817d0dc7e` |
| `0.02 Retirement Convention` | How something is marked no longer in use | `3c0ca54d24e381ab86dcce2099c4ec05` |

`0.01` is applied by `maul-page-writing`; `0.02` by `jd-numbering` and `jd-audit`.

### The nine areas

Fixed across all three entities. New areas are a company decision, not a tidying task.

| Range | Maul ehf. | Maul í Reykjavík | Tiffin ApS |
|---|---|---|---|
| 10-19 | Culture `00d1d76cf2994f59a634fa8b2f3b0f1e` | Stemming `ebd762aab47b4e0fbfc288ed005b366d` | Culture `22858322496645b7a275fdb78ad7b543` |
| 20-29 | Suppliers `6a9a9428f3834e9e9dc58900b05e40dd` | Birgjar `4486ea8f65c949229be6795dc819059c` | Suppliers `eccfeee8b4ed4af5b2d30c7d2de73cce` |
| 30-39 | Customers `95d97680aae74ff2947d0a429afc2511` | Viðskiptavinir `97a02b3839324b5f9022001c25ff2964` | Workplaces `c721d894fa0248d6a0e4f0f210dc8e38` |
| 40-49 | IT Operations `7f3f5d1bc73441eb9e4963888b96e223` | Rekstur `e4d826b637074d21b46431e457894f46` | Operations `a19a7cfbbeb941ad844f1d4670fcef36` |
| 50-59 | Creativity `2ab9715e560b46799796f57d203ccfa4` | Sköpun `687adf75b34a4d28a9c2e711f9fd071b` | Creativity `028ce26ff64a45dba30dcd0693c57b58` |
| 60-69 | Governance `1f6ead246eec473cb7eb531a5f685d0f` | Stjórnun `784eed0619814d80a059c6d9075b26e7` | Governance `f36bfb61316b40ceb566e6bd95d60da9` |
| 70-79 | Growth `65eeb4540fa3486f87e8f3ec63d04d70` | Vöxtur `127e9e67729041ac8e66c3b2ed427f43` | Growth `4de458fd9ba147c3959f066d218ac633` |
| 80-89 | Financials `1a25bfcac6e24796b8fa99a9707b59ce` | Fjármál `12d6ea47d4c74e0a8ecd2230afa245db` | Financials `d00748fabbf34dd186e48954518b441e` |
| 90-99 | Legal `9cdf490c0bc5412ea8fc00c91e5c78d7` | Lög og reglur `1926adfd986242c8a89caf44ca573ccc` | Legal `c07ce4859d9c4d8c93b132d82fe3338d` |

Two structural quirks worth knowing before you go looking:

- In **Maul í Reykjavík** the areas are not direct children of the root. The root links to
  them through a column block, and the ancestor path runs through two untitled
  intermediate pages. So moving a page into an area does not make it appear on the root.
- **Tiffin** has an unnumbered `LEARNINGS🧠` page (`135ca54d24e3803bb0c1f479b131dfec`) at
  area level.

### Also outside the numbering

Maul ehf.'s `13 Roles` (`e60e2f4b16f34169b88362d713383893`) and `14 Responsibilities`
(`c08a68a6f557462cb301775128df7393`) are databases that name processes by number and link
to the process pages. They're the references most easily orphaned by a renumber — check
them before proposing one.

## Rebuilding the index

When the stamp is old, or after a restructure, regenerate rather than hand-patch — the
whole thing takes one pass and a hand-patched index drifts in ways nobody can see.

1. Fetch `self` to confirm the workspace, then the three roots.
2. Fetch every area page, then every category page under it. That's roughly 130 fetches
   across all three KBs — split it across parallel subagents, one per knowledge base, each
   returning areas → categories → IDs plus an anomaly list, preserving titles exactly
   including Icelandic characters.
3. Run `jd_lint.py` (in the `jd-numbering` skill) over the resulting inventory so the Notes
   column is generated rather than remembered.
4. Update each index page with `notion-update-page`. Use `update_content` for targeted
   edits, or `replace_content` for a full regeneration — but never with
   `allow_deleting_content: true`, which would take the child index pages with it.
5. Re-stamp the compiled date on each page.
6. Report what changed since the previous stamp: new categories especially, since those
   should have been checked against the sibling KBs when they were created.

Updating these index pages is a change to pages the system owns, so it doesn't need the
same approval as moving someone's content — but it's still a write, so report it.
