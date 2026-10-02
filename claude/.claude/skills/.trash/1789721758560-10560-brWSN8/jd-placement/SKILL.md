---
name: jd-placement
description: Decide which Johnny Decimal area and category something belongs in, and explain why — or explain why an existing page sits where it does. Use whenever the question is about *where* something goes rather than what number it gets — "which area does this belong in", "should this be under suppliers or customers", "why is this filed here", "does 45 or 47 own this", "where would I find X", "is this in the right place", "what's the difference between these two categories". Also use when filing anything into Maul's Notion or the mirrored Google Drive tree, when a category feels like it has outgrown its name, or when someone is arguing about which of two categories owns a topic. Reasoning only — this skill never assigns numbers or edits anything.
---

# Where does this belong, and why

Johnny Decimal fails quietly. A page in the wrong category isn't broken — it's findable
by anyone who guesses the same way the filer did, and invisible to everyone else. Nobody
reports it. So placement is worth thinking about properly at the moment of filing, when
it costs a minute, rather than discovering it two years later in an audit.

This skill does the reasoning and nothing else: which area, which category, and the
argument for it. Numbers are a separate question — see the `jd-numbering` skill. Writing
anything to Notion is a separate question again.

## The question to ask

**What is this about?** Not who wrote it, not who asked for it, not which team owns the
work. A driver-training document written by the ops manager is about drivers, not about
management. An invoice-approval process written by an engineer is about accounting.

Authorship is the single most common source of misfiling, because the person filing is
thinking about their own day rather than about the person who'll go looking in two years.

## Maul's structure

Three knowledge bases, one per entity, each with the same nine areas:

| Range | Maul ehf. (parent, English) | Maul í Reykjavík (Icelandic) | Tiffin ApS (Copenhagen) |
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

Which KB comes first, and it's about subject matter rather than who's paying:

- Software, product, infrastructure, investors, group-wide policy → **Maul ehf.**
- Drivers, restaurants, Reykjavík customers, kitchen and delivery operations →
  **Maul í Reykjavík**
- Anything Copenhagen → **Tiffin ApS** (rare; the operation has been dormant since
  November 2024)

Something that genuinely applies to the whole group lives in Maul ehf. once, and the
subsidiaries point at it. Three copies is not parallelism, it's three things to update.

For the live list of categories under each area, read the index in Notion — page IDs are
in the `johnny-decimal` skill. `references/areas.md` here holds the *semantics*: what each
area is for and where its edges are.

## The boundaries that actually cause arguments

Most placements are obvious. These are the ones that aren't, and knowing them is most of
the value:

**Supplier or customer?** Restaurants are both. `20 Veitingastaðir sem birgjar` is the
supply relationship — onboarding, price sheets, who's active. `30 Veitingastaðir sem
viðskiptavinir` is the commercial one — check-ins, terms, account management. The 30 page
states a preference for treating restaurants as customers, so lean that way for anything
relationship-shaped.

**Operations or Governance?** How work gets done day to day is 40s. How the company
decides things is 60s. A recruitment *process* is 62 (governance); a driver *shift
handover* is 41 (operations).

**Creativity or Growth?** Making the artefact is 50s; taking it to market is 70s. Brand
assets live in 51, branding strategy in 71. The test: would this still exist if you
stopped selling? If yes, it's 50s.

**Operations or IT Operations?** Same numbers, different meaning across KBs. Reykjavík's
40s are physical — routes, packaging, thermoboxes. Maul ehf.'s 40s are the software that
supports them. `41` is delivery in both, but one is vans and one is fleet software.

**45 or 47 (Reykjavík)?** These overlap and it's a known wart — 45 Gæðaferli is
process-shaped, 47 Reglugerðir og gæðamál is regulation-shaped. If it exists because a
regulator requires it, 47. If it exists because Maul decided to work that way, 45.

When two categories both fit, say so and pick one with a reason. A stated reason can be
argued with; a silent choice can't.

## Explaining an existing placement

The reverse question — "why is this here?" — comes up in onboarding, in audits, and when
someone thinks something is misfiled. Answer it in this order:

1. **What the category is for**, in one line.
2. **What this page is about**, in one line.
3. **The alternative someone would expect**, and why it isn't that.

> `41.17 Maul skólinn` sits in `41 Rúntar og útkeyrsla` because 41 covers everything about
> getting food into vans and out to people, including how drivers are trained to do it.
> You might expect it in `12 Menntun` — but 12 is about employee development in general
> (courses, mentors, reading), while this is the operational induction for one role. If
> driver training grows beyond induction, it'd be a fair argument to move it.

Two things make this answer useful rather than defensive. It names the plausible
alternative instead of pretending there wasn't one. And it says what would change the
answer — placement is a judgement that can go stale, not a fact.

**Search for the expected alternative before ruling it out.** The most common real answer
isn't "right place" or "wrong place" — it's *both pages exist*. Someone asking why the
thermobox page is in Rekstur usually also wants the Fastus page, and it's already sitting
in Birgjar. When that's the case, lead with the split rather than defending one placement:

> Both exist, and they're the two halves of one topic. `22.02 Fastus` covers who we buy
> from and on what terms; `46.03 Thermoboxes` covers sizes, counts and how boxes come
> back. Who we buy it from → 20s. What we do with it → 40s.

That reply resolves the confusion instead of winning the argument, and it teaches the
rule in a form the person can reuse.

**Sometimes the honest answer is "it isn't in the right place."** Say that. Misfilings in
this workspace are real: `85.01 Investor Contacts` sits under 86, `11.03 Tiffin handbook`
under 10, `70.06 ICP` under 72. Explaining is not the same as justifying, and inventing a
rationale for a mistake teaches the next person the wrong rule.

## When nothing fits

Work down this list — the cheap options first, because each step down costs more:

1. **It fits a category you dismissed too fast.** Re-read what the category actually
   contains rather than going by its title. Most "nothing fits" turns into this.
2. **It fits a sibling KB's category that this KB hasn't created yet.** Then use that
   number, not a free one. Parallelism across the three trees is worth more than a tidy
   sequence in one.
3. **It needs a new category.** Legitimate, but a bigger commitment than it looks —
   see `jd-numbering` for how new category numbers get minted and flagged.
4. **It needs a new area.** It doesn't. The nine ranges are fixed across all three
   entities; changing them is a company decision, not a filing decision.

## Documents, not records

Johnny Decimal numbers *documents*. It does not number *instances of a thing*.

`32 Vinnustaðir í viðskiptum` holds nine unnumbered customer pages, and that's the right
instinct — numbering every customer was never going to work, because the list grows
forever and the numbers carry no meaning. Same for restaurants, suppliers, assets.

When someone is filing the fortieth instance of the same kind of thing, the answer isn't a
number, it's a database at the category level with one row per entity. The workspace
already does this in several places: `13 Roles`, `51.01 Brand Assets`, `72.07 Delivery
Business Prospects`. Point at those as the pattern.

Related: content *below* an ID page doesn't get numbered at all. The ID is the address;
what lives inside it is free-form. Where sub-pages have been given numbers anyway
(`Brikk - 20.05`), that's noise, not a scheme to complete.

## Processes and systems, not tools

The other half of the same rule, and the one that actually gets broken. **A numbered page
describes a process or a system — how the work gets done. A tool is a row in the asset
register**, `93.01 Asset Database Global`, alongside every other subscription, licence, form and
piece of hardware.

So "we started using a new tool, where do I document it?" is not a placement question at all.
The answer is a register row, not a number. Sending it to a category creates a second record of
the tool with its own cost, owner and status, drifting from the first.

The test when it's unclear: **would this text still be true if we swapped the tool for a
competitor?**

- *Yes* — it describes how we work, and the tool is incidental. Numbered page. `44.03
  Reikningakeyrsla` stays true if the accounting system changes; only the tool names change.
- *No, the text is about the tool* — vendor, pricing, setup, API, who administers it. Register
  row.

A process page then *points at* the tools it uses, with an inline `@` mention of the row the
first time each appears. `maul-page-writing` has the convention; `maul-assets` has the register.

This boundary is currently broken in a structural way rather than a one-off way — Reykjavík's
`93 Eignaskráning` holds a tree of ordinary numbered `93.x` pages doing the register's job, and
`45.01 Google App Scripts` duplicates a register row as a substantial page. When you find one,
say which layer it belongs in and why; it's a decision about the record, not a tidy-up.

## What this skill doesn't do

Assigning the actual number, resolving duplicates, and the never-reuse rule belong to
`jd-numbering`. Auditing a whole branch belongs to `jd-audit`. Anything about a tool rather
than a process — cost, ownership, whether it's registered, what breaks if it's cancelled —
belongs to `maul-assets`. Anything that writes to
Notion belongs to `maul-notion-writes` — and placement reasoning alone should never
change anything, so if you've reached the point of editing, you've changed task.
