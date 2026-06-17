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

**Note template** (uses the vault-wide `template1` shape — every vault write goes through it, breadcrumbs included):

```markdown
---
Type: #type/breadcrumb
Area: #area/{project-name or "general"}
Keywords: #keyword/{topic1} #keyword/{topic2}
Status: #status/active
Date Created: {YYYY-MM-DD}
---

# {Descriptive Session Title}

**Branch:** `{branch-name or "none"}` · **Project:** `{project-name or "general"}`

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

## Related
- [[{slip-box atom, reference note, or project page this session touched}]]
- [[{another related note}]]
```

**Frontmatter mapping rules:**
- `Type` is **always** `#type/breadcrumb` — this is the field briefing/defrag use to recognise a breadcrumb.
- `Area` carries the project: `#area/{project-name}` (e.g. `#area/maul-backend`), or `#area/general` when there is no project.
- `Keywords` carries topical tags — technologies, domains, libraries the session touched (e.g. `#keyword/zod #keyword/retool`). If none apply, leave a single bare `#keyword/` placeholder.
- `Status` starts at `#status/active`. `/memento-defrag` flips it to `#status/archived` on move; do not pre-archive.
- `Date Created` is the session date in ISO form (`YYYY-MM-DD`), same as the filename prefix.
- Branch lives in the **body** (under the H1) because `template1` has no frontmatter slot for it. Briefings don't need branch; defrag matches on project only.

### 4. Link Outward (Required)

A breadcrumb that links to nothing is a dead leaf — it accumulates but never
becomes part of the knowledge graph. Before saving, populate the `## Related`
section:

1. **Find homes for the session's concepts.** For the main topics/decisions,
   search the vault for existing notes that relate:

   ```bash
   # Search slip-box atoms, reference, and project pages for matching concepts
   rg -li "{key concept}" ~/personal/obsidian/second-brain/"80 slip-box" \
     ~/personal/obsidian/second-brain/"40 reference" \
     ~/personal/obsidian/second-brain/"60 reference" 2>/dev/null | head
   ```

2. **Add `[[wikilinks]]`** to every genuinely related note you find. Link by the
   note's basename (Obsidian resolves it).

3. **No match for a durable concept?** That's a signal, not a dead end. Add a
   follow-up: `- [ ] slip-box candidate: {concept}` so it can be promoted into a
   permanent atom later. Do **not** invent a link to a note that doesn't exist.

Aim for at least one real outbound link per breadcrumb. Zero links is only
acceptable for a genuinely self-contained session (rare).

### 5. Confirm & Exit

After saving, tell the user:
- The file path
- A one-line summary of what was captured
- Count of follow-up items (so they know there are open threads)

## Rules

- **Be comprehensive, not verbose.** Capture substance, skip filler.
- **Preserve decisions with rationale.** "We chose X" is useless without "because Y."
- **Mark unresolved items clearly.** The whole point is context recovery.
- **Use the Obsidian checkbox format** (`- [ ]`) for follow-ups so they're actionable in Obsidian.
- **Add relevant tags** beyond the defaults if the session touched specific technologies or domains (e.g., `react`, `database`, `devops`).
- **Omit empty sections.** If no code was changed, drop "Code Changes" entirely.
- **Always link outward.** A breadcrumb with an empty `## Related` section is a failure mode — it's how 112 of your past breadcrumbs became orphans. Find the real connections or log a slip-box candidate.
