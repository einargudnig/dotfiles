---
name: jd-audit
description: "Audit a branch of Maul's Notion workspace and report what's wrong with it. Use when asked to audit, review, check or \"go through\" an area, category or knowledge base — \"what's wrong with the suppliers section\", \"is our numbering a mess\", \"check area 40-49\", \"find the duplicates\", \"which processes have no owner\", \"what needs fixing in Notion\" — or before a restructure, to establish what's actually there. Covers numbering defects, content defects, ownership and freshness, and produces a decision-ready report separating cheap fixes from calls the user has to make. Reports only; never changes anything without explicit approval. For rewriting one page's text use `maul-page-writing`; for a single number question use `jd-numbering`."
---

# Auditing a branch

An audit produces a decision list, not a wall of observations. The user already knows their
workspace is untidy — what they need is "here are eleven things, six are cheap, five need you
to choose", with a proposed resolution for each.

The failure mode to avoid is a report that's technically complete and practically inert:
forty findings, no priorities, no proposals, nothing anyone can act on in under an hour.

## This file names no defects

Every finding must come from what you just read, never from this file.

An earlier version of this skill listed real defects by number — which page was duplicated,
which category had outgrown its name, what share of pages carried an owner. Defects get
fixed; the file went on asserting them. A stale finding delivered confidently is worse than
no finding, because it costs the reader a trip to Notion to discover you were quoting a
cached opinion.

So there are no counts and no page numbers below. The categories tell you what to look for.
The workspace tells you what's there. The index pages and `1.05` tell you what is already
known. If you catch yourself reporting something because this file mentioned it, stop and go
and look.

The same rule applies to what you write: an audit report states the date it was run and the
branch it covers, so the next reader knows how old it is.

## Gather the inventory

Start with the index page for the KB (page IDs are in the `johnny-decimal` skill). It tells
you which categories exist, what's already known to be broken, and when the picture was last
checked. Auditing without it means re-discovering things that are already written down and
reporting them as news.

**Then read `1.05 Decisions & Retired Numbers`** (`3c0ca54d24e381b08146d40b77f2130f`), in the
same `1 Index` tree. It has three tables and you need all of them:

- **Settled** — calls that have already been made: a category ordered oddly on purpose,
  deliberately empty categories that keep the three trees parallel, documented
  cross-references, entities that are frozen rather than neglected. **Anything on that table
  is not a finding.** Report it again and people learn to stop reading audits, which costs
  more than the defect would.
- **Retired numbers** — dead for good. Never propose reusing one, and never report the gap as
  a defect.
- **Open** — the opposite: live questions nobody has answered. If your audit answers one, say
  which, and offer to move it up to the settled table.

A finding that isn't in any of the three is genuinely new, which is what makes it worth
reporting. When you settle something during an audit, propose the log row in the same breath —
an unrecorded decision gets re-litigated at the next audit.

Then fetch the area page and each category page. Don't rely on search — it misses pages whose
titles share no keyword with your query, and it can't tell you what a category *doesn't*
contain.

Four traps before you start:

- **Alias blocks read as empty.** Notion returns synced and linked blocks as `unknown`, and
  fetching the target often returns "this page is blank". They cluster — you will meet whole
  categories built from them. Report such branches as *not auditable via the API*, never as
  empty, and never call a single page empty on API evidence alone. `maul-notion-writes` has
  the full trap list.
- **A fetch can be silently truncated.** Check for `truncated: true` before concluding a
  category has three children.
- **Visual order sometimes differs on purpose.** A category may group its pages under
  "current" and "retired" headings, so the lowest ID sits last. Check `1.05` before calling it
  a defect.
- **These KBs are plain page trees, not databases.** Every page returns `properties: {title}`
  and nothing else, so owner and review metadata can only live in the body. Don't look for
  properties that aren't there.

One signal worth collecting as you go: `notion-fetch` reports the time it read each page
("as of …"), which reflects the last edit. It's the only freshness data that exists today.

Write the inventory to a file as you go, then run `jd_lint.py` (in the `jd-numbering` skill)
over it. Mechanical checks are exactly the ones a reader's eye slides past.

## Numbering defects

Roughly in order of damage:

**Duplicate ID in one category.** Two pages answering to one number means half the references
to it point at the wrong thing. Highest priority.

**ID filed outside its category.** An `85.NN` page sitting under 86 breaks the one guarantee
the system makes — that the number tells you where the page is.

**No number at all.** Unfindable by number. Common in fast-moving categories.

**Number at the end of the title.** `Launch menu - 42.02` sorts wrong and misses a
number-prefix search. Cheap to fix. Note that sub-pages *below* an ID commonly do this —
those shouldn't be numbered at all, so the fix is to drop the number rather than move it.

**Empty shell category.** A promise the system didn't keep — fill it, merge it, or retire it.
Check `1.05` first: some are deliberately empty to keep the three trees parallel.

**Cosmetic damage.** Stray markdown, trailing whitespace, a stop after the number (`27.`
versus `27`), a number with no title. Individually trivial; collectively they're what makes a
workspace feel abandoned.

**Not defects:** gaps in a sequence (deliberate — retired numbers stay dead), documented
cross-references, headings that reorder a category for human reasons.

## Content defects

The easy half is numbering. This is the half people actually want fixed, and it means reading
the pages rather than the titles.

**An empty or textless page.** A numbered page with nothing in it is worse than a missing one,
because it looks like documentation. Two variants that both read as content and aren't: a page
holding only a screenshot — not searchable, not readable by a screen reader, invisible to every
skill here — and a page holding only an unfilled template. Check the alias trap above before
calling anything empty.

**The same thing documented twice under different numbers.** Two suppliers that turn out to be
one company; two spellings of one process. Worse than a duplicate number, because both pages
look legitimate. The cross-KB version is easy to miss: two KBs each holding their own copy of a
shared process, one of them empty.

**The same content twice on one page, in two languages.** Two things to update and no way for a
reader to tell which is current. Propose keeping the KB's language.

**A page that contradicts itself.** A parenthetical saying the section above it is no longer
true, a figure dated three years ago sitting next to a current one. Flag it; don't resolve it
silently.

**A category that has outgrown its name.** An "other" category that has become "everything".
Propose the split and name the free numbers for it.

**Stale content that contradicts live data.** A seasonal table still on an index page listing
things that appear as inactive two pages over. Note the date and the contradiction.

**Retired things not following the convention.** `0.02 Retirement Convention`
(`3c0ca54d24e381ab86dcce2099c4ec05`) settles this, so the finding is non-compliance rather
than an open question. Read it and check each requirement: the page under a retired heading on
its parent with current items first, the `(Úrelt)` / `(Retired)` tag at the end of the title, a
dated footer line with the reason, a row on `1.05`, and the Drive folder tagged. Name the pages
that miss one and say which. A silent gap with no record anywhere is the worst variant — it's
how a number gets quietly reused.

**A tool used but not linked to the register.** Maul's model is two-layered: numbered pages are
processes, and `93.01 Asset Database Global` is where the tools they use are recorded. A process
page that names a tool in prose, or links the vendor's own URL instead of the register row,
breaks the join — and the join is what answers "what breaks if we cancel this". This one is
usually widespread rather than occasional, so count it per branch rather than listing pages.
`maul-assets` has the convention and the register.

**A tool documented as its own numbered page.** The structural version of the same problem, and
worse: an ordinary numbered page duplicating a register row. Two records for one tool means two
owners, two statuses and two costs, drifting apart. This needs a decision about which layer owns
the record, not a tidy-up.

**A process depending on an archived tool.** The finding most likely to actually break something
— the page reads as current and the tool is gone. Cross-check process pages against `Archived`
rows in the register.

**Stale numbers baked into link slugs.** A pasted `notion.so/93-40-Front-…` URL keeps asserting
the number and title from the day it was pasted. This is where old numbers actually survive —
more than in prose. Grep the inventory for `notion.so/` links whose slug number disagrees with
the target's current number.

**Secrets in plain text.** API keys, merchant secrets, door codes, shared logins. This goes at
the **top** of the report, above the counts — it's the only finding with a clock on it. Name
what it is and where, recommend rotating rather than just deleting (anyone who already read the
page still has it), and don't reproduce the value. The `Starfsmenn` database is a known standing
instance of the same class, holding identity and banking fields as ordinary text; `maul-roles`
has the handling rule. Report that such fields exist; never read the values.

## Ownership and freshness

The half that no amount of numbering hygiene reaches. A process page that is beautifully
numbered, current, and owned by nobody is the workspace's most expensive defect, because
nothing about it looks wrong.

**Processes nobody is responsible for.** Maul's org model links a role to its responsibilities
to the numbered process pages they describe. A page in an operational category that no
responsibility points at is unowned in the only sense that matters. Getting this list means
walking the org model — `maul-roles` has the method, including the awkward part: the link from
a responsibility to its page is an `@` mention in the row's body, so it can't be queried.

**Owned by someone who has left.** A role with no person attached, or one whose person is
marked `Past Employee`, reads as owned and isn't. Check it before reporting a branch as
covered.

**Untouched for years.** Use the last-edit timestamp. Two years of silence on a supplier page
is fine; two years on a delivery process is a question. Judge by category, not by a single
threshold, and report the date rather than the verdict.

**Missing owner and review metadata.** The house standard (`0.01 Page Template & Writing
Standard`) requires an `Owner` and a `Last reviewed` line on every page, and says explicitly
that a missing owner or a stale date is itself a finding.

Check adoption in the branch rather than assuming it either way, then report it as **a single
aggregate line, not per page** — "none of the 74 pages in this area carries an owner or review
date; the standard is on 0.01" is the whole finding. Listing it against every page buries forty
real findings under two hundred identical ones. Whether to adopt the standard is a decision
worth surfacing once, and `maul-page-writing` is what applies it.

The same logic applies to anything universal. A defect present on every page is one finding
about the branch, not one per page.

## Sort by who decides

This is what makes an audit usable.

**Cheap to fix** — no number changes, no moves, nothing anyone references breaks: whitespace,
stray markdown, punctuation, moving a trailing number to the front, a typo in a category name.
Still ask before applying, but as one batch question — they're a single decision.

**Needs a decision** — anything that changes what a number points at or where a page lives:
resolving a duplicate, moving a misfiled ID, numbering a batch of unnumbered pages, retiring an
empty category, merging overlapping ones. Ownership gaps land here too, and they're almost
always questions rather than proposals: only a person can say who takes a process.

For each of these, propose the resolution rather than naming the problem. "This number is used
by A and B; B owns the Drive folder and is live, so B keeps it and A becomes the next free
number" is a three-second decision. "This number is duplicated" makes them go and look.

## Report format

Shape only — every row below is invented. Fill it from what you read.

```markdown
## Audit: 20-29 Birgjar (Maul í Reykjavík) — run 2026-09-03
74 IDs across 9 categories. 13 findings — 8 cheap to fix, 5 need a decision.
Read-only; nothing has been changed.

### Cheap to fix (one batch, say the word)
| ID | Issue | Fix |
|---|---|---|
| NN.NN | Trailing whitespace | trim |
| NN.NN | Title carries a second number | drop it, @-mention the other page in the body |

### Needs your call
| ID | Issue | Proposed |
|---|---|---|
| NN.NN | Used twice (A, B) | B keeps it — owns the Drive folder and is live; A → next free |
| NN | Empty since 2022 | fill it, or retire the category? |

### Ownership and freshness
| ID | Issue | Proposed |
|---|---|---|
| NN.NN, NN.NN | No responsibility points at these | who owns supplier relationships? |
| NN.NN | Last edited 2022-09-14; supplier may be inactive | confirm or mark retired |

No page in this area carries an Owner or Last reviewed line (standard: 0.01).
Worth deciding once whether to adopt it — see `maul-page-writing`.

### Also worth knowing
- Two pages in 23 appear to be the same company under different names.
- 23 holds 32 pages across five unrelated kinds of supplier; 29 is free.

### Not auditable
NN — built from alias blocks the API can't read. Check in the Notion UI.
```

Urgent findings go above all of it, before the counts.

**Don't cap the list.** Twenty findings means report twenty; stopping at "the top five" leaves
the user believing they've seen the picture. The cheap-versus-decision split is what keeps a
long list usable, so length is affordable. The exception is the universal-defect rule above:
collapse, don't truncate — and say which findings you collapsed.

If the branch is clean, say so in one line and stop. Finding nothing is a good outcome, not a
failure to look hard enough.

## Ending the audit

An audit ends with the report and an offer — never with edits. **Never move, renumber, merge or
delete anything without an explicit yes for that specific change**, and when a schedule fired
this audit rather than a person, there is nobody to say yes, so the answer is no. Ask whether to
apply the cheap batch and step through the decisions; the approval pattern and the closing
change summary are in `maul-notion-writes`. Until the user answers, the workspace stays exactly
as you found it, and the report should say so.

Two things belong in that closing offer alongside the fixes: any **open question on `1.05`
your audit answered**, and any **new decision** the user made while reading the report. Both
are one-line additions to a page the system owns, and both are the difference between an audit
that compounds and one that repeats.

If the reader is new to the system, one line is enough: offer to walk through the numbering
using what the audit just found, and hand over to `johnny-decimal` if they say yes. Skip the
offer for whoever built the system, and for anyone who has had it before.

## Where this stops

Placement arguments ("should this be in 45 or 47?") belong to `jd-placement`; number resolution
rules belong to `jd-numbering`; ownership walks belong to `maul-roles`; anything about the tools
themselves — cost, registration, what depends on them — belongs to `maul-assets`; rewriting a
thin or contradictory page belongs to `maul-page-writing`; the retirement convention itself is
`0.02`.