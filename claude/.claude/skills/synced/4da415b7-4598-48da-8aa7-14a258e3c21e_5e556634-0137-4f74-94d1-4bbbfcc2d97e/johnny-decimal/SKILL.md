---
name: johnny-decimal
description: Explain, teach and navigate Maul's Johnny Decimal system — what the numbers mean, why the company organises knowledge this way, how the three knowledge bases relate, and where to find things. Use when someone wants to understand or learn the system rather than change it — "explain our numbering system", "what does 41.17 mean", "onboard a colleague onto Notion", "write onboarding material for the knowledge base", "how does our Notion work", "what's the difference between an area and a category", "why can't I reuse a number", "how do I find X in Notion", "which of these Notion skills should I use". Also holds the workspace map the other skills read — the three KB roots, the nine areas, the live index pages. Routes the actual work elsewhere — where something belongs is `jd-placement`, what number it gets is `jd-numbering`, checking a branch for defects is `jd-audit`, tools and subscriptions are `maul-assets`, who does what is `maul-roles`, changing anything in Notion is `maul-notion-writes`.
---

# Maul's numbering system

Maul files knowledge by number rather than by folder name. Every page has a permanent
address like `41.17`, and that address is used in Notion, in Google Drive, and out loud —
"it's in 45.13". People memorise the numbers and navigate by them.

This skill is the explanation of that system: what it is, why it's built this way, and how
to teach it to someone who has just been handed a Notion login. It also holds the map — the
stable page IDs the other skills read.

It deliberately does none of the work. When a real answer is needed, get it from the skill
that owns it.

## Where the work happens

| The question | The skill |
|---|---|
| Which area and category does this belong in? Why is this page here? | `jd-placement` |
| What number does it get? Is 44.12 free? Two pages both say 22.02 | `jd-numbering` |
| What's wrong with area 20-29? Find the duplicates | `jd-audit` |
| What does a tool cost? Who owns it? What breaks if we cancel it? | `maul-assets` |
| Who is responsible for this process? What must a new hire read? | `maul-roles` |
| What should this page actually say? | `maul-page-writing` |
| Create, rename, move, merge or delete anything | `maul-notion-writes` |

If you're answering a *live* question about the workspace — a specific number, a specific
placement, the current contents of a category — hand it to the owning skill rather than
answering from this file. Explaining the system is not the same as knowing the current
state of it, and this file is written to stay true for years, which means it can't know
what's in category 23 today.

The one thing to fetch yourself is the live index (below), because almost every
explanation needs a real example and the index is where real examples come from.

## The system in one page

Three levels, and only three:

```
Area      40-49 Rekstur                     nine fixed ranges, same in every entity
Category  46 Umbúðir og pökkunarfyrirmæli   a two-digit bucket inside an area
ID        46.03 Thermoboxes - Hitakassar    the addressable page
```

Anything below an ID page is just content — sub-pages don't get numbers. The ID is the
address; what's inside it is free-form.

**The number is an address, not a description.** `46` means "packaging and packing
instructions". `46.03` means nothing in itself — it's the third page filed in 46. That
distinction is the single most useful thing to teach, because it explains why numbers
never change, why gaps are never filled, and why you can't infer meaning from a number you
haven't looked up.

**Three trees, one skeleton.** Each legal entity has its own knowledge base, and all three
use the same nine areas:

| Range | Maul ehf. (English) | Maul í Reykjavík (Icelandic) | Tiffin ApS |
|---|---|---|---|
| 10-19 | Culture | Stemming | Culture |
| 20-29 | Suppliers | Birgjar | Suppliers |
| 30-39 | Customers | Viðskiptavinir | Workplaces |
| 40-49 | IT Operations | Rekstur | Operations |
| 50-59 | Creativity | Sköpun | Creativity |
| 60-69 | Governance | Stjórnun | Governance |
| 70-79 | Growth | Vöxtur | Growth |
| 80-89 | Financials | Fjármál | Financials |
| 90-99 | Legal | Lög og reglur | Legal |

Maul ehf. is the parent — software, product, investors, group policy. Maul í Reykjavík is
the operation — drivers, restaurants, kitchens, customers; it's the largest tree and it's
in Icelandic. Tiffin is Copenhagen, largely historical since November 2024.

Where a concept exists in more than one tree, the three trees try to share the number:
`44.01` is the invoice approval process in all of them. That parallelism is what makes
three trees navigable as one, and it's the reason a new category number is checked against
its siblings before being minted.

**It numbers documents, not records.** A process, a policy, a standard, a guide — those get
numbers. Customers, suppliers, drivers, assets do not: the list grows forever and the
numbers would carry no meaning. Reykjavík's `32 Vinnustaðir í viðskiptum` holds nine
unnumbered workplace pages, and that's correct, not an oversight. The fortieth instance of
a kind of thing wants a database at the category level, not a fortieth number.

**So the workspace has two layers.** The numbered pages describe **processes and systems** —
how the work gets done. The registers describe the **things those processes use and involve**:
`93.01 Asset Database Global` for every tool, subscription, licence and piece of hardware,
`13 Roles` and `14 Responsibilities` for who does what, `Starfsmenn` for people.

A process page says *how we use a tool* and points at its register row with an `@` mention; the
row says what the tool is — vendor, cost, owner, status. The test when it's unclear: would this
text still be true if we swapped the tool for a competitor? If yes it's a process and it gets a
number; if the text is about the tool, it's a row.

This is the distinction most worth teaching, because getting it wrong creates two records of one
thing and neither stays true. Tools live in `maul-assets`, people in `maul-roles`.

## The rules, and why each exists

Teach the reason with the rule. A rule without its reason gets broken the first time it's
inconvenient.

**Number first in the title.** `46.03 Thermoboxes`, never `Thermoboxes - 46.03`. Search by
number and alphabetical sort both depend on the number leading.

**Never reuse a retired number.** If `23.03` was deleted, the next supplier is not `23.03`.
Someone's notes, a Drive folder, or a Slack message may still point at the old one, and a
reused number sends them confidently to the wrong page. A wrong page is worse than a
missing one.

**Never fill a gap.** Same reason, stated forwards: a gap means something used to be there.
Reykjavík's `23` runs 23.01–23.21 then jumps to 23.29 — the next supplier is `23.40`, not
23.22. Gaps are free; collisions cost hours.

**Highest plus one.** That's the whole assignment algorithm. If the category runs to 44.11,
the next page is 44.12.

**The nine areas are fixed.** They're shared across all three entities. Something that
genuinely fits nowhere is a company conversation, not a filing decision.

**Subject matter decides placement, not authorship.** A driver-training document written by
the ops manager is about drivers. An invoice process written by an engineer is about
accounting. Filing by who wrote it is the most common cause of misfiling, because the filer
is thinking about their own day rather than about whoever goes looking in two years.

**One thing, one number.** Before creating anything, search for it — in both languages if it
could go either way. With around 500 numbered pages, the honest answer is often "there's
been a stub for this since 2024, fill that". Two pages for one process is exactly the
failure numbering exists to prevent.

**Add freely, change almost never.** Adding a number invalidates nothing. Changing one
breaks Drive folders, plain-text references, role descriptions and people's memory at the
same time. Everything else here follows from that asymmetry.

**Nobody moves anything unasked.** Including Claude. A move is the only operation that
changes where a page lives while leaving nothing behind at the old address, and Notion has
no undo across pages. Spotting a misfile is a report, not a licence — see
`maul-notion-writes`.

## The live map, and why it isn't in this file

The current contents — every category, the ID ranges in use, and the known defects — live in
Notion, in the `1 Index` tree under `0-9 Getting started`:

| Page | Covers |
|---|---|
| `1 Index - Efnisyfirlit` | Landing page: the three KBs, the area skeleton, the rules |
| `1.01 Index - Maul ehf.` | Categories and ID ranges |
| `1.02 Index - Maul í Reykjavík` | Categories and ID ranges |
| `1.03 Index - Tiffin ApS` | Categories and ID ranges |
| `1.04 Cross-KB numbering` | Numbers shared across the three trees |
| `1.05 Decisions & Retired Numbers` | Settled calls, dead numbers, and the questions still open |

Page IDs are in `references/maul-map.md`, along with the workspace and KB roots, all
twenty-seven area pages, and the structural quirks worth knowing before you go looking.

Keeping the map in Notion rather than in this file was deliberate. A map baked into a skill
freezes on the day it's packaged and can only be corrected by repackaging; a map in Notion
is corrected by whoever notices, and colleagues who never open Claude read the same page.
So this file carries what doesn't change, and looks the rest up.

Two habits keep that honest:

- **Confirm a specific number against the category page itself.** The index gets you to the
  right category in one hop; the category page tells you the truth about its contents.
- **When the index and Notion disagree, Notion wins** — and the disagreement is itself worth
  reporting, because it means the map needs a refresh.

The Notes column on each index page is the running defect register, and `1.05` is its
companion: what has been *decided*, as opposed to what is broken. Read both rather than
re-deriving them — an oddity that looks like a defect is often a settled call. The two house
conventions are what the register is measured against: `0.01` for how a page is written,
`0.02` for how something is retired. Keeping it current is part of the work, not a chore afterwards —
`references/index.md` covers what to update when, and how to regenerate the whole thing.

## Finding something

The question colleagues actually ask. Answer it as a method, so they can do it themselves
next time:

1. **Which entity?** Operations questions are Reykjavík; software, product and investor
   questions are Maul ehf.
2. **Which area?** Nine buckets — pick by what the thing is *about*.
3. **Open the KB's index page** and read the categories in that area.
4. **Open the category** and read its IDs.

Two searches beat guessing, though: search the topic in both languages, and search the
number if you have one. Search ranks semantically rather than numerically, so searching
`22.02` won't reliably surface both pages claiming it — for that, open the category and
read the children.

If the honest answer is "it isn't where it should be", say so. Misfilings here are real —
a page numbered `70.06` sits in 72, and the investor database in `86` carries the number
`85.01`. Inventing a rationale for a mistake teaches the next person the wrong rule.

## Teaching it to a colleague

Two modes, and `references/teaching.md` has both in full:

**Tutoring.** Explain, then check understanding by asking them to place two or three real
things and talking through their reasoning. Twenty minutes of that beats any document,
because the misconceptions surface where you can correct them. Pull the examples from the
live index so they're never wrong.

**A hand-out.** Material they read without Claude in the loop. This belongs on the page
that already exists for it — `0 Númerakerfið - Johnny Decimal` under `0-9 Getting started`
— which is currently three lines long and has some stray scratch notes on it. Extending
that page is right; creating a second explainer elsewhere is the exact duplication the
system exists to prevent. Match the audience's language: Icelandic for Reykjavík operations
staff, English for Maul ehf.

Whichever mode, be honest about the state of things. The workspace has roughly 500 numbered
pages, several duplicate numbers, a few misfiles and some empty categories. A newcomer who
finds `22.02` used twice needs to know that's a known defect on the register, not their own
misunderstanding — otherwise they conclude the system is unreliable and quietly stop using
it.

## References

- `references/maul-map.md` — the stable anchors: workspace and KB root IDs, the twenty-seven
  area pages, index page IDs, the structural quirks, and how to rebuild the index.
- `references/index.md` — what the index is for, what to update when something changes, and
  how to regenerate it rather than hand-patch it.
- `references/teaching.md` — the onboarding curriculum: what to teach in what order, real
  exercises with worked answers, the misconceptions that actually bite, and hand-out
  templates in Icelandic and English.

For the semantics of each area and where its edges are, `jd-placement` holds
`references/areas.md`. For the Google Drive mirror and the `jd_lint.py` checker,
`jd-numbering` holds both. For Notion's sharp edges — alias blocks that read as empty,
`replace_content` deleting child pages, mentions losing their titles over the API —
`maul-notion-writes`. This skill doesn't duplicate any of them; one copy of a rule is the
only way it stays true.
