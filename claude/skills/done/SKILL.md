---
name: done
description: Use when ending a Claude Code session to capture key decisions, discussions, questions, and follow-ups as a markdown note in Obsidian. Invoke with /done at end of session.
---

# Done - Session Debrief to Obsidian

## Overview

Captures everything meaningful from the current session — topics discussed, key decisions, open questions, and follow-ups — and saves it as a structured markdown note in the Obsidian vault.

## Procedure

### 1. Gather Context

Run these in parallel:

```bash
# Get current git branch (if in a git repo)
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-branch"

# Get current date
date +%Y-%m-%d

# Get working directory basename as project name
basename "$(pwd)"
```

For session ID, use the current timestamp: `date +%Y%m%d-%H%M%S`

### 2. Analyze the Conversation

Review the ENTIRE conversation and extract:

- **Summary**: 2-3 sentence overview of what was accomplished
- **Topics Discussed**: Bullet list of all significant topics covered
- **Key Decisions**: Decisions made with brief rationale (why, not just what)
- **Code Changes**: Files created/modified and what changed (if any)
- **Questions Raised**: Questions that came up, whether answered or not
- **Follow-ups**: Action items, things to revisit, unfinished threads
- **Learnings**: Anything non-obvious discovered during the session

Be thorough. The purpose is to reconstruct full context months later.

### 3. Write the Note

Save to: `/Users/einargudjonsson/personal/obsidian/second-brain/claude-breadcrumbs/`

**Filename format**: `{date}_{branch-or-topic}.md`

Examples:
- `2026-02-17_feat-auth-flow.md`
- `2026-02-17_debugging-api-timeout.md`
- `2026-02-17_no-branch.md` (when not in a git repo)

If a file with the same name exists, append a counter: `2026-02-17_main-2.md`

**Note template**:

```markdown
---
date: {YYYY-MM-DD}
project: {project-name or "general"}
branch: {branch-name or "none"}
tags:
  - claude-session
  - {project-name}
---

# {Descriptive Session Title}

## Summary
{2-3 sentence overview of what was accomplished this session}

## Topics Discussed
- {topic 1}
- {topic 2}

## Key Decisions
- **{Decision}**: {Rationale}

## Code Changes
- `{file path}` — {what changed}

## Questions & Answers
- **Q**: {question raised}
  - **A**: {answer if resolved, or "Unresolved" with context}

## Follow-ups
- [ ] {action item 1}
- [ ] {action item 2}

## Learnings
- {non-obvious insight or discovery}
```

### 4. Confirm & Exit

After saving, tell the user:
- The file path
- A one-line summary of what was captured
- Count of follow-up items (so they know there are open threads)

Then immediately run:

```bash
kill $PPID
```

This terminates the Claude Code process. Do this AFTER printing the confirmation — it is the final action.

## Rules

- **Be comprehensive, not verbose.** Capture substance, skip filler.
- **Preserve decisions with rationale.** "We chose X" is useless without "because Y."
- **Mark unresolved items clearly.** The whole point is context recovery.
- **Use the Obsidian checkbox format** (`- [ ]`) for follow-ups so they're actionable in Obsidian.
- **Add relevant tags** beyond the defaults if the session touched specific technologies or domains (e.g., `react`, `database`, `devops`).
- **Omit empty sections.** If no code was changed, drop "Code Changes" entirely.
