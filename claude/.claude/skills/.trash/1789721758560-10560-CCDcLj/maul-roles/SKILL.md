---
name: maul-roles
description: Answer questions about who does what at Maul using the org model in Notion — the `13 Roles`, `14 Responsibilities`, `Starfsmenn`, `93.01 Assets` and `47.01 Skipulag þrifa` databases. Use for "what does a new driver need to read", "build an onboarding reading list for this role", "who owns 44.01", "who is responsible for this process", "which processes have no owner", "what does this person own", "X is leaving — what needs reassigning", "what are the responsibilities of the depot manager", "which roles have nobody assigned". Walks from a role to its responsibilities to the numbered process pages they point at, and back again. Read-only by default; the databases hold plain-text personal data that must never be repeated in a report.
---

# Who does what

Maul's org model is a graph, not a document. A **role** (`13.40 Restaurant Account Manager`)
holds **responsibilities** (`14.40 Perform Restaurant Check-in Meetings`), each of which
points at the numbered **process page** that says how the work is done. A **person** is
attached to a role, and roles own **assets**.

That means the knowledge base can answer questions no page can: what a new hire must read,
who is accountable for a process, and what breaks when someone leaves. Nothing else in this
workspace can answer those, which is why this skill exists.

Database IDs, full schemas and quirks are in `references/databases.md`. Read it before
querying — several properties are traps.

## Before anything else: the people database holds plain-text personal data

`Starfsmenn - Hlutverk og ábyrgðir` carries SSN, passport ID, bank account and credit card
number as ordinary text fields, alongside phone numbers and home addresses.

**Never read those fields into a report, a summary, a file, or a message.** Query the
properties you actually need — usually `Name`, `Full Name`, `Employment Status`,
`Team Member`, `Email Business` — rather than selecting everything and filtering afterwards.
If a task genuinely needs one of the sensitive fields, say what you need and why, and let the
user fetch it themselves.

That the fields exist at all is worth reporting once, as a finding, to whoever owns data
protection — `jd-audit` treats credentials in plain text as the one finding with a clock on
it, and this is the largest instance of it in the workspace. Report the *existence*, never
the values.

## The one mechanic that matters

**A responsibility points at its process page with an `@` mention in the row's body.** Not a
relation. Not a URL property. Not the row number.

So you cannot get a reading list from a query. `notion-query-data-sources` returns properties
only, and the properties don't contain the link. The walk is:

1. Query `13 Roles` for the role → read its `👩‍👦 14 Responsibilities` relation.
2. **`notion-fetch` each responsibility row** and pull `<mention-page url="…"/>` out of its
   content.
3. Fetch each mentioned page for its real title.

Three things follow from this, and getting them wrong produces a confidently wrong answer:

**Roughly a third of responsibilities have no mention at all.** The row exists, the work is
real, and no process page is linked — sometimes because none exists. Report those explicitly
as *no documented process*. A reading list that silently omits them looks complete and isn't.

**Check the other carriers before concluding there's no link.** Some rows put a raw Google
Docs or Retool URL in the `Text` property, some name a number in prose in `Description`
("like described in 11.02"), and some use an inline link written as `[label](/<pageid>)`
rather than a mention. Role rows themselves sometimes carry mentions in their body too.

**The number is not a pointer.** `14.NN` mirrors the *owning role's* category — 14.40
responsibilities belong to 13.40 roles — not the category of the process page they point at.
`14.40 Reply to grant requests` points at `11.02`; `14.40 Call restaurants that had issues`
points at `45.01`. Never infer the target page from the row number.

## Building an onboarding reading list

The highest-value thing here. Given a role:

1. Find the role row. Titles are `13.NN <Title> Role`, though the trailing "Role" is
   inconsistent — match on the number or a substring, not an exact title.
2. Walk to responsibilities, then to process pages as above.
3. Report as: the role, its description, then one line per responsibility with the process
   page as an `@`-mentionable link — and a clearly separated list of responsibilities with no
   documented process.

Two things to say out loud in the output:

- **The reading list usually crosses knowledge bases.** Roles live in Maul ehf.'s `10-19
  Culture`, but most process pages they point at are in Maul í Reykjavík. That's expected,
  not a misfile.
- **Say how complete it is.** "Nine responsibilities, six with a documented process, three
  without" is an honest reading list. It also happens to be the most useful documentation
  backlog anyone could hand the role's manager.

If the role has *no* responsibilities attached, say that plainly rather than returning
nothing — nine of the thirty-two roles are in that state, several with long role
descriptions and nothing actionable.

## Who owns this process

The reverse walk, and there's no index for it. Two routes:

**For one page:** search the workspace for the page's title and number, looking for a
responsibility row that mentions it. Then follow the row's `🎭 13 Roles` relation → the role →
its `Actor` → the person.

**For a whole branch:** walk all responsibility rows once, build the process-page → role map,
and answer from that. Slower, but it's the only way to answer "which pages have *no* owner",
because absence can't be searched for.

Then check the answer is real. A role with no `Actor`, or an `Actor` whose `Employment
Status` is `Past Employee`, is nominally owned and actually not — and that reads as a clean
result unless you look. Never use the native `Person` property to answer this; it is empty on
every role. `Actor` is the real assignment.

## Coverage and ownership audit

What to check, roughly in order of how much damage the gap does:

- **Process pages nobody is responsible for.** The worst outcome in this workspace by both
  other skills' account. Requires the full walk.
- **Roles with no person, or a person who has left.** The work is unassigned and looks
  assigned.
- **Responsibilities attached to no role.** Unreachable from any role; they will never appear
  in an onboarding list.
- **Responsibilities with no documented process.** The documentation backlog.
- **Duplicate and near-duplicate rows.** Exact title duplicates from double-clicks, the same
  task written once in English and once in Icelandic, and typo variants sitting alongside the
  correct row. Two rows for one duty means the responsibility is half-linked in each.
- **Assets with no owner or no responsible role**, and assets still marked in use whose owner
  has left.
- **Rows whose `13.NN`/`14.NN` numbers don't line up**, and rows with no number at all.

Report it the way `jd-audit` reports: cheap fixes as one batch, real decisions with a
proposal each. Ownership gaps are almost always decisions — only a person can say who takes a
process — so expect this audit to be mostly questions, and make each one answerable in a
click.

## When someone leaves

Query the person in `Starfsmenn`, then read `🎭 13 Responsible for Roles`, `🎭 13 Backup for
Roles` and `93.01 Assets Responsibility`. That's the reassignment list: roles they hold,
roles they back up, and assets in their name. Check whether each role has a `Backup` — where
one exists, that's the obvious candidate and worth naming; where none does, that's the gap
worth flagging.

Asset questions that aren't about a person — cost, status, what depends on the tool — belong to
`maul-assets`. This skill answers who holds it; that one answers what it is.

Changing `Employment Status`, reassigning roles or moving asset ownership are writes. Propose
the list, get a decision per line, and follow `maul-notion-writes`.

## Adding roles and responsibilities

New rows need numbers, and the numbering rules are not this skill's: `13.NN` and `14.NN`
follow the same never-reuse and highest-plus-one discipline as everything else, and the
second pair should match the role's category. Take the number from `jd-numbering` and do the
write through `maul-notion-writes`.

When a new responsibility has a process page, **add the `@` mention to the row's body** — that
mention is the entire link, and a row without it is invisible to every walk described here.
If the process page doesn't exist yet, say so; writing it is `maul-page-writing`.

## The state of the model

As of August 2026: 32 roles, 107 responsibilities, 38 people, 143 assets. Nine roles have no
responsibilities, six responsibilities have no role, and around three quarters of
responsibility rows have neither a description nor a text field filled in — the substance
lives in the title and the mentioned page.

Don't quote those counts as current. Re-derive them; they're here to tell you roughly what to
expect, and to make clear that gaps are the normal state rather than a sign you queried
wrongly.
