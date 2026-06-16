# Handoff Document Template

Order is deliberate: a coworker reads top-down under time pressure — orientation first, then active work, then traps, then reference. Omit a section only if truly empty; never pad.

```md
# Handoff: <project> — <date>

**Away:** <start> → <expected return> · **Covering:** <person/team> · **Reach me:** <policy, e.g. "Slack for emergencies only">

## TL;DR
3–5 sentences: what this project is, what state it's in, the one or two
things most likely to need attention while I'm out.

## Current state — what is live where
Per environment (prod / dev / staging): what's deployed, which backend it
points at, anything intentionally disabled or gated. Table is fine here.

## In-flight work
One subsection per item, most urgent first:
### <Item name> — `In flight | Blocked | Needs decision by <date>`
- **State:** one line of where it stands
- **Links:** branch / PR / Asana task / doc
- **Next step:** the single concrete action to move it
- **If blocked:** on whom or what, and who to chase

## Landmines & gotchas
The section only I could write. Each entry: *symptom → cause → what to do*.
e.g. "Every API call fails with 'Failed to fetch' → the app is sending the
wrong token type → check X before debugging the network."

## Don't touch
Areas under someone else's active development or deliberately frozen, with
why and who owns them.

## Decisions & rationale
Recent decisions a coworker might be tempted to relitigate or accidentally
undo. One line each: decision, why, link.

## Recurring duties
Anything I do on a rhythm that someone must pick up (daily checks, weekly
sends, deploy chores). Include how-to links or the exact command.

## Where things live
Link list: repo, dashboards, env config, design docs, plans, tracker board,
relevant Slack channels.

## Open questions
Known unknowns — things I'd have resolved next, so nobody re-derives them.
```
