---
name: handoff
description: Build a comprehensive project hand-off document for coworkers before extended leave or when transferring ownership. Sweeps git state, open PRs, repo docs, Claude memory + session breadcrumbs, the Obsidian vault, Asana tasks, and deploy/infra state, then publishes a reviewed handoff page to Notion. Use when the user mentions handoff, hand-off, handing over a project, transferring ownership, or going on leave (paternity, parental, vacation, sabbatical).
---

# Project Handoff

Produce a handoff document a coworker can act on **without access to my Claude memory, vault, or this conversation**. Everything must be translated into plain team language with links.

## Step 1 — Scope (ask once, together)

Confirm in a single question round: leave start/end dates, who is taking over (or "team"), and any areas to explicitly exclude. The project is the current repo unless told otherwise.

## Step 2 — Gather (run sources in parallel)

Launch independent subagents/tool calls concurrently. For each source, the goal is *what would surprise or block a coworker*, not an inventory.

1. **Git + PRs** — `git log --since="60 days ago" --oneline`, `git branch -a --no-merged`, `gh pr list --state open`, `gh pr list --author @me --state open`. Note stale branches and anything unmerged with real work in it.
2. **Repo docs** — README, CLAUDE.md, `docs/` and `plans/` directories. Note docs that are authoritative vs stale.
3. **Claude memory** — read `~/.claude/projects/<dashed-cwd>/memory/MEMORY.md` and every memory file it links (dashed-cwd = absolute cwd path with `/` → `-`). These hold gotchas, blocked features, and hands-off zones. Verify time-sensitive claims (deploy state, blocked endpoints) before repeating them — memory reflects when it was written.
4. **Breadcrumbs + vault** — launch the `concierge` agent: ask for recent session breadcrumbs for this project plus any decisions, open questions, and "watch out for" notes in the slip-box.
5. **Asana** — search my open/in-progress tasks related to this project (`search_tasks`, assignee = me). Capture task URLs; these become the in-flight work links.
6. **Deploy/infra** — what is live where: hosting env vars/aliases (e.g. `vercel env ls`, project dashboard), which API environment each deploy points at, feature flags or gated features, anything armed/disabled on purpose.

## Step 3 — Synthesize

Fill [TEMPLATE.md](TEMPLATE.md). Rules:

- **Classify every work item** as one of: `In flight` / `Blocked (on whom/what)` / `Don't touch` / `Needs decision by <date>`. An item with no classification doesn't go in.
- Each in-flight item gets: one-line state, the branch/PR/task link, and **the single next step**.
- Landmines are the highest-value section — the things only I know (auth quirks, misleading errors, "this 403 is expected", test-send rules). Write each as *symptom → cause → what to do*.
- **Sanitize**: no tokens, secrets, personal notes, or Claude-internal jargon ("memory", "breadcrumbs" — cite the underlying fact instead).
- Convert all relative dates to absolute. Plain prose, not fragments.

## Step 4 — Review, then publish

1. Write the draft to `HANDOFF-DRAFT.md` in the repo root (gitignored or untracked — do not commit) and show the user a summary of what's in each section.
2. **Wait for explicit approval — publishing is outward-facing.** Apply edits, re-show only changed sections.
3. On approval: create the Notion page (`notion-create-pages`) — ask which parent page/teamspace if unknown. Title: `Handoff: <project> — <leave start date>`.
   - **Multi-project leave:** all handoffs go under the same Notion parent (search Notion for an existing `Handoff` parent from a prior run before asking). If covering several projects, offer a short index page listing each project with its TL;DR line.
4. Offer (don't do unprompted): comment the Notion link on the relevant Asana tasks, and delete the local draft.
