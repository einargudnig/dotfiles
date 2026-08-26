---
name: memento
description: Capture the current session as a breadcrumb in the second-brain vault. Use when you want to record decisions, discoveries, or patterns mid-session. Also use when the user says "remember this" or "save this".
---

# Memento — manual session capture

Capture the current session as a breadcrumb note in the second-brain vault.
This is the *mid-session* sibling of `/done`: same note format, but it does
**not** end the session — you keep working afterward.

Vault: `/Users/einargudjonsson/personal/obsidian/second-brain/claude-breadcrumbs/`

> Consolidated 2026-05-26. The old standalone `~/memento` vault (atomic
> Zettelkasten notes, certainty scores, QMD recall) is retired. Capture is now
> one flat breadcrumb per session, in the vault you actually open in Obsidian.

## When to use

- User invokes `/memento`
- User says "remember this", "save this", or similar
- A milestone is reached mid-session and you want it recorded before continuing

## Arguments

- `/memento` — capture the session so far
- `/memento "context"` — capture with the user's framing of what matters most

## Process

1. **Gather context** (run in parallel):

   ```bash
   git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-branch"
   date +%Y-%m-%d
   basename "$(pwd)"
   ```

2. **Check for an existing breadcrumb from this session today.** Glob
   `claude-breadcrumbs/{date}_*.md`. If one already covers this session
   (same branch/topic), **update it in place** rather than creating a second
   file — append new decisions/learnings and refresh the Summary.

3. **Analyze the conversation** and extract: Summary (2-3 sentences), Topics,
   Key Decisions (with rationale — *why*, not just *what*), Code Changes,
   Questions & Answers, Follow-ups, Learnings.

4. **Write the breadcrumb** to `claude-breadcrumbs/{date}_{branch-or-topic}.md`
   (append a counter on collision: `_main-2.md`). Use the shared template in
   `~/.claude/skills/done/SKILL.md` — keep `/memento` and `/done` byte-identical
   in format so breadcrumbs are uniform.

5. **Link outward** (see Rules). A breadcrumb that links nothing is a dead leaf.

6. **Confirm to the user**: the file path, a one-line summary, and the count of
   open follow-ups. Do **not** kill the session — `/memento` is mid-session.

## Rules

- **One breadcrumb per session**, not per idea. Update, don't fragment.
- **Link outward.** Add `[[wikilinks]]` to the slip-box atoms, reference notes,
  or project pages this session actually touched. If a durable concept emerged
  that has no home yet, note it under Follow-ups as a slip-box candidate.
- **Preserve decisions with rationale.** "Chose X" is useless without "because Y."
- **Be comprehensive, not verbose.** Substance over filler; omit empty sections.
- If the user provided context via `/memento "..."`, use their framing as the lens.
- Never delete or overwrite breadcrumbs from other sessions.
