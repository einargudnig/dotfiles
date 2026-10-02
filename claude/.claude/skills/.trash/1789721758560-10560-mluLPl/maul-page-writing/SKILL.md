---
name: maul-page-writing
description: "Write and improve the content of knowledge pages in Maul's Notion workspace, to the house standard on `0.01 Page Template & Writing Standard`. Use whenever a page's text is the deliverable — \"document this process in Notion\", \"write up how we do X\", \"fill in 44.02\", \"improve this page\", \"is this page any good\", \"add an owner and review date\", \"split this page in two\" — and after `jd-placement` and `jd-numbering` have settled where a new page goes and what it's called. Covers the page skeleton, owner and last-reviewed metadata, the writing rules, the one-page-one-thing test, raising an existing page to standard without destroying what people rely on, and Icelandic and English headings. One page at a time; to survey a whole branch for defects use `jd-audit`."
---

# Writing a knowledge page

A correctly numbered page that nobody can follow is a failure with tidy filing. The
numbering skills get a page to the right address; this one is about whether the thing at
that address is worth reading.

The house standard already exists in Notion — `0.01 Page Template & Writing Standard`
(`3bbca54d24e3819581add9d817d0dc7e`), a child of `0 Númerakerfið - Johnny Decimal`. It is
the source of truth. Everything below encodes it so you can work without a fetch, but when
the two disagree, `0.01` wins — say so, and treat this skill as needing an update.

**The test the standard sets, and the only one that matters:** could a new hire follow this
page without asking a question? If not, it isn't done, however clean the numbering is.

## Start by knowing which job you're doing

**Writing a new page.** The rarer case. Placement and number are settled before you start —
if they aren't, `jd-placement` and `jd-numbering` come first.

**Raising an existing page to standard.** The common case. Assume the page you've been handed
carries none of the standard's furniture — no owner, no review date, no one-line purpose, no
Related section. Check rather than assuming the reverse, but don't be surprised: the standard
is newer than most of the workspace.

That changes the rules. See *Raising a page* below before you touch anything.

## The skeleton

```markdown
# NN.NN  Page name
(number first, one space, then the name — match the KB's language)

> Owner: @person   Last reviewed: YYYY-MM-DD   KB: Maul ehf. / Reykjavík / Tiffin

## Purpose
One sentence: what this page is for and who needs it.
If you can't say it in one line, it is probably two pages.

## [The content]
The knowledge itself. Numbered steps for a process; a short table
or list for a reference. Lead with the thing people came for.

## Related
- @NN.NN  A page this depends on or points to
  (use an @ mention, not a typed number — mentions survive renumbers)

---
Moved from NN.NN on YYYY-MM-DD   (only if the page was renumbered)
```

Why each block is there, because a block whose reason nobody knows gets dropped:

- **Number-first title** — search-by-number and alphabetical sort both depend on it.
- **Owner and Last reviewed** — the metadata a freshness review reads. No owner, or a stale
  date, is itself a finding. These knowledge bases are plain page trees rather than
  databases, so this lives as a quote or callout line at the top of the body, not as a page
  property. If a category is ever converted to a database, prefer properties.
- **Purpose in one line** — the test for whether the page is a single addressable thing.
- **Related as @ mentions** — the only reference form that survives a renumber.
- **Redirect trail** — a silent move looks like a deletion to someone navigating from memory.

In Icelandic pages use Icelandic headings — `## Tilgangur`, `## Ferlið` or `## Verklag`,
`## Tengt efni`. Follow the headings the KB already uses rather than importing English ones
into an Icelandic tree.

## The six writing rules

1. **Lead with the answer.** First sentence is the thing they came for. Never "this
   document describes…".
2. **Short sentences, active voice.** "The driver logs the box at pickup," not "Boxes are to
   be logged by the driver at the point of pickup."
3. **Steps for processes, not paragraphs.** If it's a sequence, number it. A wall of prose
   hides the step someone skips.
4. **One page, one thing.** If it needs the word "also" three times, it's two pages — split
   it and give the second one its own number.
5. **Cut every word that carries no information.** "In order to" → "to". "At this point in
   time" → "now". "Please note that" → delete.
6. **Name things by their number.** "Follow 44.01" beats "follow the invoice process" —
   precise, and it teaches the address.

Rule 6 has a wrinkle worth knowing. Most cross-references in this workspace are inline
markdown links that display a *title* — `[Garra](/67e601e2…)`. Those survive renumbering,
which is good, but they hide the number, which breaks rule 6. Write both: the number in the
sentence, the link on it. `Follow @44.01` satisfies both.

## Cross-references, in the order you should prefer them

1. **`@` mention** — survives renames and renumbers, shows the current title. Use in Related,
   and in prose wherever a number is named. Note it renders as a bare URL over the API, so
   don't use mentions inside a table another agent has to parse.
2. **Inline link on selected text** — fine. Add the number in the visible text.
3. **Typed number in prose** — acceptable *alongside* a mention, never alone. `see 30.06`
   with no link keeps saying 30.06 forever.
4. **A full `notion.so/...` URL** — avoid. The slug bakes in the title *and* the number at
   the time of pasting, so `notion.so/93-40-Front-…` keeps asserting a number that may have
   moved. This is where stale numbers actually hide, more than in prose.
5. **`/link`** — never. It creates a sub-page and silently changes the hierarchy. Maul's own
   documented rule.

### Naming a tool the process depends on

**Name the tool in the sentence and `@` mention its register row the first time it appears,**
inline where the tool is actually used — no separate dependencies section.

> Skráðu kassann í `@93.41 Detrack` við afhendingu.

That mention is the only join between a process page and the asset register, so every
"what breaks if we cancel this" question depends on it existing. Three habits to undo when you
meet them, worst first: a raw vendor URL, the tool named in prose with no link, and a pasted
`notion.so/...` row URL. Check the row you link is the right one — a link that resolves isn't
necessarily a link that's correct, and archived rows keep resolving.

And **describe the usage, not the tool.** If you find yourself explaining what a tool *is*,
that text belongs on its row. If the tool has no row, say so rather than inventing a link;
that gap is a finding for `maul-assets`, which owns this convention and the reasoning behind
it.

Two related house habits worth undoing, both cosmetic but both teaching the wrong lesson:
sub-pages titled with the number at the *end* ("Umbúðir í notkun - 46.01"), and unlabelled
external links to Google Sheets, Retool or ja.is. Content below an ID page doesn't need a
number at all; say what an external link is for before you paste it.

## Raising a page to standard

The page has readers. Improving it is not the same as replacing it.

**Read it properly first, and don't trust an empty-looking fetch.** Alias and linked blocks
come back from the API as `unknown` with no title, and synced blocks show content that
belongs to a different page. A page that reads as three lines over the API can be full in
the UI. Never conclude a page is empty from an API fetch alone — check in Notion, or say the
page needs checking there. `maul-notion-writes` has the rest of these traps.

**Keep the title.** People navigate by it from memory, and a title change costs recall for
no content gain. If the title is genuinely wrong, that's a rename — ask, per
`maul-notion-writes`.

**Add before you cut.** Metadata line, Purpose, headings, and Related are pure additions —
do them freely. Deleting or rewriting existing content is a different act: propose it, and
say what you'd remove and why. Struck-through text, a three-year-old figure and a
contradictory sentence all look like junk and are sometimes the only record of something.

**Say when the page contradicts itself.** Pages here sometimes carry a parenthetical
admitting a section is no longer true. Don't quietly delete that — flag it, because it's a
content decision someone has to make.

**Bilingual duplication is a defect, not thoroughness.** Where a page carries the same
section twice, once in Icelandic and once in English, pick the KB's language and keep one.
Two copies drift, and the reader can't tell which is current.

**A screenshot is not content.** An image with no text is not searchable, not readable by
anyone using a screen reader, and invisible to every skill here. Transcribe the substance
into the body and keep the image alongside it.

**Leave the TODO visible if you can't resolve it.** A page ending with an @user note asking
for a better description is honest and useful. Turning it into confident prose you invented is
worse than leaving it.

## When the page is actually two pages

Rule 4 is the one that changes the filing, so it's the one that leaves this skill. If the
purpose won't fit in a sentence, say so, propose the split, and hand the second half to
`jd-placement` for a category and `jd-numbering` for a number. Don't mint a number here.

Splitting is also the honest answer when a page has grown into a scratchpad. The question to
ask is not "how do I tidy this" but "how many things is this page trying to be".

## Find a model in the workspace, not in this file

Before writing, read two pages in the same KB that do the job well and follow their shape.
What makes one worth copying: a typed purpose or `## Tilgangur` heading, numbered steps a new
hire could follow, `@` mentions rather than pasted URLs.

Two reliable starting candidates — read them before copying, since either may have been raised
or let slip since this was written:

- **`44.11 Vörutalning`** (`2eaca54d24e38039a3e9e73b22030d2e`)
- **`41.16 New drivers protocol`** (`2c6ca54d24e3809dbd66e2e36ff1cab4`)

If the filled example on `0.01` disagrees with the standard written above it, or cites pages
whose numbers have moved, follow the example's *shape* and not its links — and say so, because
that's a cheap fix to a page the system owns.

## Before you write anything to Notion

Creating a page, rewriting a body, renaming, or adding a metadata line to twelve pages at
once are all writes. **Never rename, move, merge or delete without an explicit yes for that
specific change**, and when a schedule fired this task rather than a person, there is nobody
to say yes, so the answer is no. The approval pattern, the batch prompts, the
enhanced-markdown syntax spec and the traps are in `maul-notion-writes`. Read it before the
first write, not after.

Who should be named as Owner is usually answerable from the org model rather than by asking —
`maul-roles` walks roles and responsibilities to the person accountable for a process. If a
page turns out to be describing a *tool* rather than a process, it belongs in the asset
register instead of on a numbered page — `jd-placement` has the boundary and `maul-assets` has
the register.