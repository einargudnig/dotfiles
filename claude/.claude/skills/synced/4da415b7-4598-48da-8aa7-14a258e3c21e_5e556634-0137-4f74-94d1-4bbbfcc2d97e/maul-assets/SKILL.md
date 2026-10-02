---
name: maul-assets
description: Work with Maul's asset register — the `93.01 Asset Database Global` in Notion, where every tool, system, subscription, licence, form and agency is recorded. Use for questions about the tools themselves rather than the work they support — "what do we pay for monthly", "who owns Retool", "is this subscription still in use", "what breaks if we cancel Sling", "which tools have no owner", "is this tool in the register", "where do I document a new tool we started using", "what does this asset cost", "which assets are archived but still referenced", "register this new tool", "add Sling to the asset database". When adding or updating a row, fills in its dependencies (Using / Used By, Part of / Contains) and infers the responsible role and owner from `13 Roles`. Also covers the boundary that keeps the workspace coherent — a numbered page describes a process, a register row describes a tool — and how a process page should point at the tools it depends on. Read-only by default; changes go through `maul-notion-writes`.
---

# The asset register

Maul's Notion workspace has two layers, and knowing which is which prevents most of the mess
this skill exists to clean up.

**Numbered pages in areas 10-99 describe processes and systems** — how the work gets done.
`44.03 Reikningakeyrsla` is a process. `41.16 New drivers protocol` is a process.

**`93.01 Asset Database Global` describes the things those processes use** — Retool, Sling,
Detrack, Front, Regla, a licence, a form, an accounting firm. One row per tool, carrying what
is true about the tool itself: vendor URL, owner, responsible role, status, cost, billing
period.

Processes consume assets. The register is the single place a tool is described; a process page
says *how we use it*, and points at the row rather than re-describing it.

The test, when it's unclear: **would this text still be true if we swapped the tool for a
competitor?** If yes, it's process — it belongs on a numbered page. If the text is *about* the
tool, it's a register row.

`references/register.md` has the schema, the views, the query mechanics and the current state.
Read it before querying — several properties are traps.

## When something is unclear, ask

If the request, the workspace or this skill leaves a real choice open — two answers fit, the
scope is vague, a value can't be inferred, a live page contradicts this skill — **ask before
acting, don't guess.** Use `AskUserQuestion`:

- one question per decision, 2–4 options, your recommendation first and marked;
- one line of context: what you found and why it decides the answer;
- no question you could settle by reading the workspace yourself.

A scheduled or unattended run has nobody to ask: take the safest reading, say which one, and
write nothing.

## The join is a mention, and there is no alternative

There is **no structured link from an asset to a process page**, and there cannot be: process
pages are ordinary Notion pages, not database rows, and Notion relations only join databases.
Every relation on the register points at people, roles, or other assets.

So the only join is an `@` mention written by hand, in the process page's body. The house
convention:

> **Name the tool in the sentence and `@` mention its register row the first time it
> appears.** `Skráðu kassann í @93.41 Detrack við afhendingu.`

No dedicated dependencies section — inline, where the tool is actually used, reading
naturally. An `@` mention survives renames and renumbers; a raw vendor URL survives nothing
and teaches nobody that the register exists.

What not to do, in the order these currently cause damage:

| Instead of | Do this |
|---|---|
| A raw vendor URL — `maul.retool.com/...` | `@` mention the row. The vendor URL lives on the row, in one place |
| The tool named in plain prose with no link | Same. Unlinked prose is invisible to every question below |
| A pasted `notion.so/93-40-Front-…` URL | `@` mention. The slug freezes the number and title as of the day it was pasted |
| Describing the tool on the process page | Describe the *usage*. What the tool is belongs on its row |

`maul-page-writing` applies this when a page is being written or improved.

## What the register is for

**A tool is registered once, and only once.** Before adding a row, search the register — and
search the ordinary pages too, because a parallel habit exists of documenting tools as numbered
`93.x` pages, which duplicates the register's job. Two records for one tool means two costs,
two owners and two statuses, all drifting.

**A tool used by the company but not registered is a finding.** Facebook Messenger is the
actual driver-comms channel in two process pages and has no row. Bruno, Playwright and GitHub
Copilot have their own numbered pages instead of rows. Report these; they're the register's
blind spots, and blind spots are where unowned spend lives.

**Assets are records, not documents**, so they don't get their own JD numbers in the ordinary
sense — the `93.x` prefix on a row is its label inside the register, not an address in the page
tree. `jd-placement` has the documents-versus-records rule; this is its clearest instance.

## Registering or updating a row: fill everything that has an answer

A row with only a name and a URL can't answer any question this skill exists for. When you
create a row, or touch one, fill every property you can support with evidence — and leave
blank what you can't, rather than guessing.

**1. Search first.** The register and the ordinary pages, per above. If a row exists, update it.

**2. The plain properties.** `Name` as `93.x <Tool>` (a new label, never a reused one),
`userDefined:URL`, `Asset Category`, `Status`, `Team Using`, `Billing Period` and the one
`Monthly Cost` field in the currency it's billed in. `Credit Card` only if the user gives it,
and never echo it back.

**3. The dependencies.** Work out what the tool uses and what uses it — from what it
integrates with, from the process pages that name it, and from the user — and set:

- `Using Assets` — tools this one depends on (Maul API → AWS, DynamoDB, Detrack)
- `Used By Assets` — tools that depend on this one
- `Part of` / `Contains` — composition (a Zap is `Part of` Zapier; a sheet `Part of` Google
  Sheets)

The pairs are **two-way**: `Using Assets` ↔ `Used By Assets`, `Part of` ↔ `Contains` (checked
2026-09-24 — every link in the register mirrors). Set one side and Notion fills the other;
re-fetch the other row to confirm. **A relation write replaces the whole list**, so when adding
to a row that already has values, read them first and write old + new. Link only rows that
exist; a dependency with no row is a finding ("uses Messenger, which isn't registered"), not a
row to create unasked. A row related to itself (`93.50 Zapier` is `Part of` itself) is a defect
to report, never a pattern to copy.

**4. The responsible role — inferred from `13 Roles`, not guessed.** Weigh, in this order:

1. **Responsibilities.** The process pages that use the tool → the `14 Responsibilities` rows
   that mention those pages → their owning role. Strongest evidence.
2. **Neighbouring assets.** The role already on the rows this one is `Part of` or shares
   dependencies with.
3. **Role text.** `Role Description` naming the tool or its job, and `Tags` naming the
   category of the pages that use it.
4. **Team Using** must fit. The two databases name teams differently: asset `Maul Reykjavík`
   = role `RVK`, `Tiffin` = `CPH`, `Maul ehf.` = `Global`. A `Global` role can hold any asset.

One clear winner → set `🎭 Role Responsible` and give the reason in one line. Two plausible
roles, or none → **ask**, with the candidates as options and the evidence for each.
`maul-roles` has the walk and the traps (`Actor`, not `Person`).

**5. Owner follows the role.** Propose the role's `Actor` as `Owner` — if their `Employment
Status` is current. If the role has no Actor, or the Actor has left, leave `Owner` empty and
flag it. Read only `Name` and `Employment Status` from `Starfsmenn`; nothing else.
`Owner` and `🎭 Role Responsible` are two-way with `Starfsmenn` and `13 Roles`, so one side is
enough — re-fetch to confirm the other side shows it.

**6. Process pages, both ways.** Each process page that uses the tool should `@` mention the
row inline; the row's body lists those pages under `## Related` (the two-way rule on `0.01`).
Add whichever side is missing.

**Approval.** Creating the one row the user asked for, relations and back-links are
additions — do them, then report every row and page you touched. **Replacing** an existing
value (a different owner, role, status or cost) is a change: propose it and ask. Writes go
through `maul-notion-writes`.

**Close** with the TL;DR from `maul-page-writing`, then a short table: property → value →
evidence, plus every other row or page you touched.

## What breaks if we cancel this

The question the register exists to answer, and the one currently hardest to answer honestly.

1. Find the asset row.
2. Read `Used By Assets` and `Contains` — other tools that depend on it.
3. Search the workspace for mentions of the row to find the process pages that use it.
4. Read `🎭 Role Responsible` and `Owner` for who has to be consulted.

**Then state your confidence, because step 3 is unreliable.** Only about half the process pages
that depend on a tool link its row at all; the rest name it in prose or link the vendor
directly. So a mention search finds the linked half and misses the rest. Say so — "three
process pages link this row; a prose search also found Detrack named on 46.03 and 41.16
without a link" is an honest answer. "Three pages depend on this" is not.

That gap is also the argument for the convention above: impact analysis is only as good as the
mentions, and it gets better every time a page is improved.

## Cost and subscription questions

`Monthly Cost` exists in four separate currency fields — ISK, $, EUR, DKK — so a total needs
converting rather than summing, and the answer should name the rate you used and its date.
`Billing Period` (Annually / Monthly / Quarterly) means a monthly figure isn't always what
leaves the account that month.

Only about a third of rows carry any cost. So "what do we pay monthly" is answerable for the
rows that have it and not for the rest — give the total, the row count it covers, and the
count it doesn't. A confident total over 37% of the register is a wrong answer delivered
convincingly.

The `Billing` view is the one built for these questions. `Credit Card` holds the last four
digits of the card an asset is billed to; use it to group spend by card if asked, and **never
reproduce the digits in a report.**

## Ownership questions

`Owner` is a person, `🎭 Role Responsible` is a role. Both matter and they answer different
questions: the person to ask today, versus the seat that should carry it when that person
leaves. A row with a role but no person is fine; a row with neither is unowned.

Check whether an `Owner` has left — `maul-roles` covers the `Employment Status` trap, and an
owner marked `Past Employee` reads as ownership and isn't. For "what does this person own", go
through `maul-roles`; it walks people, roles and assets together.

## Register health

Worth running as its own audit, since the register is where money lives. What to check:

- **No `Status`** — a third of rows. These can't answer "are we paying for this?"
- **No owner and no responsible role.**
- **`In use` but nothing references it** — either genuinely orphaned spend, or the mention gap.
  Say which you think it is.
- **`Archived` but still referenced** by a live process or another asset. A live dependency on a
  retired tool is the one that actually breaks something.
- **Duplicates** — the same tool twice, or split across `Asset Category` values so a form and a
  document version of one thing both exist.
- **Overlapping subscriptions** — several tools doing one job is a spend question, not a data
  defect, but it belongs in the report.
- **Rows with no cost** where the category implies one, especially `Subscription` and `Licence`.
- **Tools documented as ordinary `93.x` pages** rather than rows.

Report it the way `jd-audit` does: cheap fixes as one batch, real decisions with a proposal
each. Cancelling something is always the user's call.

## Retiring an asset

Set `Status` to `Archived` and leave the row. Do not add a marker to the row title — for
database rows the property is the single source of truth, and two marks that can disagree are
worse than one. `0.02 Retirement Convention` (`3c0ca54d24e381ab86dcce2099c4ec05`) is the house
rule and says exactly this.

Before archiving, check what still points at the row, and report it. Archiving a tool that a
live process depends on is how a process page silently starts lying.

## Where this stops

Choosing an area or category for a *process* page is `jd-placement`. Numbers for pages are
`jd-numbering`. Writing the process page that uses a tool is `maul-page-writing`. People,
roles and responsibilities are `maul-roles`. Any write — a new row, a status change, a cost
correction — goes through `maul-notion-writes`, with the same approval per change.
