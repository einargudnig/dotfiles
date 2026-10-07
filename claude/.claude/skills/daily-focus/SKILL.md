---
name: daily-focus
description: Morning focus. Reads the vault (Top of Mind, Principles if present, latest weekly review, recent daily notes) next to tasks, calendar, git and sleep data, and returns 3 ranked priorities, a check-in on the biggest project and how life is holding up around it, and 3 questions to sit with. Trigger on "/daily-focus", "daily focus", "today's focus", or "what should I focus on today".
---

# Daily Focus

Three priorities, an honest check-in, three questions. Einar reads it in under a minute and walks into the day knowing what matters, at work and outside it.

The vault is the lens. Work tools say what's happening; Top of Mind (and Principles, once written) say what matters. The output earns its keep by connecting the two. It is not another task list. Taskwarrior already is one.

Adapted from James Yu's `/todays-focus` (x.com/jameesy/status/2107488886041563216).

## Sources

Edit this table to change tools. The rest of the skill refers to the **role**, never the tool.

| Role | Tool | What to pull |
|---|---|---|
| Vault | Obsidian (local files) | See *Vault paths* below |
| Tasks | Taskwarrior (synced from Things 3 + Asana) | `task +OVERDUE list`, `task due:today list`, `task due.before:eow list`, `task next limit:10` |
| Calendar | `spark` CLI | `spark events --today`, `spark events --tomorrow` |
| Code | git across `~/work/*/` and `~/personal/*/` | Commits in the last 7 days with author time; branches idle 5–30 days; dirty working trees |
| Health | life-os MCP (`mcp__life-os__query_sql`) | Sleep duration last 7 nights vs the 30-day average; latest HRV / recovery. Run `describe_schema` first if table names are unknown |

If a role's tool fails or isn't available, skip it and leave it out of the footer. Never invent data to fill a gap.

### Vault paths

Vault root: `~/personal/obsidian/second-brain/`
- **Principles:** vault `30 planner/principles.md`, if it exists. Stable. Quote from it. If it's missing, skip it — don't infer principles from elsewhere.
- **Top of Mind:** vault `30 planner/top of mind.md`. Read only the section **above `# Archive`**. If the file is missing or still a stub, say so in the footer and fall back to the latest weekly review's *Focus Suggestions*.
- **Goals:** the newest file in vault `weekly-reviews/` (sections *Open Follow-ups*, *Stalled Work*, *Focus Suggestions*).
- **Daily notes:** vault `30 planner/YYYY-MM-DD.md`, last 14 days, plus this week's `30 planner/weeks/YYYY-Www.md`.
- **Breadcrumbs:** vault `claude-breadcrumbs/` from the last 7 days. Filenames are `YYYY-MM-DD_<branch>.md`; use file birth time (`stat -f %SB`) for when the session happened.
- **Life context:** vault `dad thoughts.md` if present.

The vault is **read-only** for this skill. Never edit, move or create notes.

## Step 1 — Gather (in parallel)

1. **Principles** — read in full, if the note exists.
2. **Top of Mind** — current section only. Note its last-modified date.
3. **Goals** — newest weekly review.
4. **Daily notes** — last 14 days. Note which days exist, open `- [ ]` items that have been carried for days, anything about family, house, health or sleep, and lines worth quoting back.
5. **Breadcrumbs** — last 7 days. Count per day and per project; flag sessions created after 22:00.
6. **Tasks, Calendar, Code, Health** — per the Sources table.

## Step 2 — Find the signals

Before writing, work out:

- **The big project** — the largest active work commitment: most commits/breadcrumbs this week, a deadline this week, or the most open tasks. Note its health: what's shipped vs what's stuck, what's carrying the risk.
- **Commitments vs reality** — for each Top of Mind item and each weekly-review follow-up, compare what Einar said he'd do with what the vault and git show. Something that has survived two weekly reviews unfiled is evidence. A missing daily note is evidence too.
- **Decision debt** — stalled branches, stashed WIP and carried `- [ ]` items are deferred decisions, not outstanding work. Name the oldest or riskiest one.
- **Strain** — signs work is costing life: commits or breadcrumbs after 22:00, short sleep vs his baseline, weekend sessions, daily notes that are only work.
- **The life anchor** — the current Top of Mind item most exposed to that strain (family, the kid, the house, health, sleep).
- **Tensions** — two notes that pull against each other, or behaviour that contradicts a Principle.

## Step 3 — Write

### Focus — 3 priorities

- Mix: at least one time-sensitive work item; at least one slipping Top of Mind or Goal commitment; if there's strain, at least one that takes load off (cut, decide, drop, hand off).
- Action: imperative, specific, doable today, under 12 words.
- *Why:* two or three short sentences naming real things: a number, a repo, a person, a date, Einar's own words. End on a line that lands.
- Three distinct priorities. Don't manufacture urgency. If nothing's urgent, say so.
- Respect today's calendar. Don't schedule deep work into a day that's wall-to-wall meetings without saying so.

### Checking in

- Heading: **Checking in: [big project] and [life anchor]**.
- One line on why the two collide right now.
- **The project:** an honest read of its health with one concrete fact, ending in the direct question Einar is probably avoiding.
- **You:** the thing that's slipped most since the project ramped up (sleep, a habit, family time, a personal project). Evidence vs intention, then his own *why* from Top of Mind or Principles.
- Close with one small, concrete action for this week.
- Blunt and on Einar's side. Not a lecture, not a task list.

### Questions to sit with

Three, in italics. Each one:

- ties to a Top of Mind item or a Principle (quote it briefly or name it plainly)
- cites specific evidence: a dated note, a branch and its age, a timestamp, a quote
- presses on something Einar isn't looking at: a choice vs a drift, a system that needs reshaping rather than more effort, a contradiction between two notes
- can't be answered in one word. No therapy-speak.

Don't repeat evidence already used in the check-in unless the question takes it somewhere new.

### Footer

`*Read:*` then the sources actually read, separated by ` · `: vault files (with Top of Mind's last-modified date and the daily-note date range), then each tool with its scope. Add warnings only when true:

- Top of Mind missing or a stub → "No Top of Mind yet — priorities are guessed from the weekly review."
- Top of Mind not modified in 30+ days → "Top of Mind last updated [date] — worth a refresh."

## Output template

Follow this exactly. No preamble before it, nothing after it.

```
**Focus — [Weekday, D Mon]**

**1. [Action]**
*Why:* [...]

**2. [Action]**
*Why:* [...]

**3. [Action]**
*Why:* [...]

---

**Checking in: [Big project] and [life anchor]**

[One line on why they collide now.]

- **The project:** [...]
- **You:** [...]

[One concrete action for this week.]

---

**Questions to sit with**

- *[Question]*
- *[Question]*
- *[Question]*

---

*Read: [vault sources] · [Tool: scope] · [Tool: scope]*
```

If Einar writes in Icelandic, answer in Icelandic with the same structure.

## Voice

A smart colleague leaving a note, not a management memo. Einar is direct and reads fast.

- Contractions: "it's", "you've", "don't".
- Plain verbs and specific nouns: "delete `feat/hub-logging` in all four repos", not "address branch hygiene".
- Short sentences. If a line needs a semicolon, cut it in two.
- Quote Einar's words exactly. Never paraphrase inside a quote.
- Banned: "align", "leverage", "stakeholder", "drive", "bandwidth", "close the loop", "unblock" (unless literal), "journey", "holistic".
- Don't over-signpost the system. "Your principles say..." is fine. "Per principles.md line 4" is not.

## Don't

- Don't edit the vault or Taskwarrior. This skill reads only.
- Don't invent priorities when the evidence is thin. Say the evidence is thin.
- Don't pad. If a section has nothing honest to say, make it shorter, not vaguer.
- Don't turn it into a briefing. No meeting list, no task dump, no inbox summary.

## Refining

When the output feels wrong, fix one of three things:

- **This skill** when the process or format is wrong.
- **Top of Mind** when it's working from an outdated picture of life.
- **Principles** when a decision rule is missing or no longer true.
