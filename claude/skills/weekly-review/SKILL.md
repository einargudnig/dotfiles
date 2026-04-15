---
name: weekly-review
description: Weekly review that scans git activity across all repos, pulls recent session notes and memento entries, surfaces stalled work, and outputs a structured weekly status to Obsidian. Invoke with /weekly-review.
---

# Weekly Review — Cross-Project Status Synthesis

## Overview

Synthesizes a weekly status report by scanning git activity across all projects, pulling recent session breadcrumbs and memento notes, and surfacing stalled or forgotten work. Outputs a structured markdown note to Obsidian.

## Procedure

### 1. Establish Time Window

```bash
# Get current date and the date 7 days ago
date +%Y-%m-%d
date -v-7d +%Y-%m-%d
```

Store these as `END_DATE` and `START_DATE` for all subsequent queries.

### 2. Scan Git Activity Across Repos

Find all repos under `~/work/` and `~/personal/` with commits in the last 7 days. Run this to get active repos:

```bash
for dir in ~/work/*/ ~/personal/*/; do
  if [ -d "$dir/.git" ]; then
    count=$(git -C "$dir" log --oneline --after="$(date -v-7d +%Y-%m-%d)" --all 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
      echo "$count $dir"
    fi
  fi
done | sort -rn
```

For each active repo, gather:

```bash
# Commit summary (last 7 days, all branches)
git -C "$REPO" log --oneline --after="$START_DATE" --all --no-merges

# Branches with recent work
git -C "$REPO" for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' refs/heads/ | head -5

# Files changed (summary)
git -C "$REPO" diff --stat "$(git -C "$REPO" log --after="$START_DATE" --all --reverse --format=%H | head -1)^..HEAD" 2>/dev/null
```

### 3. Surface Stalled Work

Find branches across all repos that have uncommitted work or haven't been merged but have no commits in the last 5 days:

```bash
for dir in ~/work/*/ ~/personal/*/; do
  if [ -d "$dir/.git" ]; then
    basename=$(basename "$dir")
    # Branches with last commit 5-30 days ago (stalled, not ancient)
    git -C "$dir" for-each-ref --sort=-committerdate \
      --format='%(refname:short)|%(committerdate:short)|%(committerdate:unix)' refs/heads/ 2>/dev/null | \
    while IFS='|' read -r branch date unix; do
      now=$(date +%s)
      age_days=$(( (now - unix) / 86400 ))
      if [ "$age_days" -ge 5 ] && [ "$age_days" -le 30 ] && [ "$branch" != "main" ] && [ "$branch" != "master" ]; then
        echo "$basename: $branch (last commit: $date, ${age_days}d ago)"
      fi
    done
  fi
done
```

Also check for uncommitted changes in active repos:

```bash
for dir in ~/work/*/ ~/personal/*/; do
  if [ -d "$dir/.git" ]; then
    status=$(git -C "$dir" status --porcelain 2>/dev/null)
    if [ -n "$status" ]; then
      count=$(echo "$status" | wc -l | tr -d ' ')
      echo "$(basename "$dir"): $count uncommitted files"
    fi
  fi
done
```

### 4. Pull Recent Session Breadcrumbs

Read recent `/done` session notes from Obsidian:

```bash
# List breadcrumbs from the last 7 days
find ~/personal/obsidian/second-brain/claude-breadcrumbs/ -name "*.md" -newer "$(date -v-7d +%Y-%m-%d)" -type f | sort
```

For each breadcrumb file found within the date range, read the **Summary** and **Follow-ups** sections. Collect all open follow-ups (`- [ ]`) across sessions.

### 5. Pull Recent Memento Notes

Check the memento vault for notes created this week:

```bash
# Notes created in the last 7 days
find ~/memento/notes/ -name "*.md" -newer "$(date -v-7d +%Y-%m-%d)" -type f 2>/dev/null | sort
```

Read each note's title and frontmatter. Group by type (decision, discovery, pattern, bugfix, tool).

### 6. Synthesize the Report

Analyze all gathered data and produce the weekly review. Think about:

- **Themes**: What areas got the most attention this week?
- **Momentum**: Which projects are moving forward vs. stalling?
- **Open loops**: Follow-ups from sessions that haven't been addressed
- **Wins**: What actually shipped or was completed?

### 7. Write the Report to Obsidian

Save to: `/Users/einargudjonsson/personal/obsidian/second-brain/weekly-reviews/`

**Filename format**: `{date}_weekly-review.md`

If a file with the same name exists, append a counter: `{date}_weekly-review-2.md`

**Template**:

```markdown
---
date: {YYYY-MM-DD}
type: weekly-review
period: {START_DATE} to {END_DATE}
tags:
  - weekly-review
  - claude-session
---

# Weekly Review — {START_DATE} to {END_DATE}

## Highlights
{2-4 bullet points of the most significant things that happened this week}

## Active Projects

### {Project Name}
- **Activity**: {X commits on Y branches}
- **Key changes**: {brief summary of what moved}
- **Status**: {shipping / in progress / blocked}

{Repeat for each active project, ordered by activity level}

## Stalled Work
{Branches and uncommitted work that need attention}

- **{repo}: {branch}** — last commit {date}, {age} days ago
  - {context if available from breadcrumbs/memento}

## Open Follow-ups
{Collected from /done session breadcrumbs — unresolved items}

- [ ] {follow-up from session X}
- [ ] {follow-up from session Y}

## Decisions & Discoveries
{From memento notes this week}

- **{note title}**: {one-line summary}

## Focus Suggestions
{Based on the data: what deserves attention next week?}

- {suggestion based on stalled work, open follow-ups, or momentum}
```

### 8. Confirm

Tell the user:
- The file path of the saved report
- Count of active projects, stalled branches, and open follow-ups
- Top 1-2 suggested focus areas for the coming week

## Rules

- **Don't fabricate activity.** Only report what git log and file reads confirm.
- **Keep project summaries concise.** One project = 2-4 lines max.
- **Prioritize signal over noise.** A repo with 1 typo-fix commit doesn't need a section — mention it in a "Minor" bucket.
- **Link back to breadcrumbs.** When referencing a session, mention the breadcrumb filename so the user can find it.
- **Omit empty sections.** No stalled work? Drop that section entirely.
- **Focus suggestions should be actionable.** "Consider finishing X" not "Keep up the good work."
