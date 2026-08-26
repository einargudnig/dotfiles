---
name: triage-bookmarks
description: Invoke to triage new X/Twitter bookmarks — syncs via the fieldtheory CLI, ranks what's new against Einar's interest profile, and proposes the best few as links for the /notes page. Use for "triage my bookmarks", "what's new in my bookmarks", or on a schedule.
metadata:
  version: "1.0.0"
---

# Triage bookmarks → /notes

Turns saved-and-forgotten X bookmarks into a shortlist worth publishing.
Local only — needs `~/.ft-bookmarks/bookmarks.db` and his Chrome session.

## 1. Sync

```bash
ft sync --classify --max-minutes 10
```

`--classify` labels **only the new** bookmarks, so it stays fast and the backlog
never grows again. If it prints `spawnSync claude ETIMEDOUT`, the classify step
is starved by a competing Claude session — the sync itself still succeeded, so
carry on and note it.

## 2. Get what's new

```bash
~/.claude/skills/triage-bookmarks/scripts/new-since.sh
```

Prints a digest of everything synced since the last successful triage. First run
has no watermark and falls back to the last 7 days rather than dumping all 699.

Exit without output means nothing new — say so and stop. That is a valid result.

## 3. Rank

Load `~/.claude/skills/watch/references/interest-profile.md` — the same signal /
noise rules `/watch` uses. It is the single source of taste; do not restate it here.

Bookmark-specific noise, on top of the profile:

- **Bookmark-bait accounts** repackaging the same Anthropic talk with "Bookmark &
  watch tonight." Known repeat offenders: `@zodchiii`, `@phosphenq`, `@sairahul1`,
  `@Av1dlive`, `@allen_explains`, `@0xMovez`, `@AIPandaX`, `@theendeavorpath`.
  Go to the primary source instead — `@ClaudeDevs`, `@AnthropicAI`.
- Self-help and motivational threads.
- Launch announcements with no mechanism — "Introducing X" and nothing else.
- Anything he has already published to `/notes` (check `content/links/`).

**Propose at most 3.** Fewer is normal. A week where nothing clears the bar is a
useful answer, not a failed run.

## 4. Report, then ask

For each candidate: the claim in one line, why it matters to him specifically,
and the canonical URL — the article, not the tweet, when the tweet just points
at one.

Then **ask which to publish**. Do not write to einar-os unprompted; `/notes` is
a public page. For each approved item, hand off to the `notes` skill, which owns
the frontmatter, voice, and verification.

## 5. Commit the watermark

Only after the run succeeds — including any publishing:

```bash
~/.claude/skills/triage-bookmarks/scripts/new-since.sh --commit "<newest synced_at>"
```

The script prints `newest in db:` to stderr in step 2; pass that value back.
Skipping this means the next run re-proposes the same bookmarks. Committing it
after a failed run means they are lost from triage forever — so commit last.

## Gotchas

- **There is no unbookmark command.** Sync is one-way from X. Noise can be
  ignored but never pruned from here; that is manual work in the X UI.
- `ft list --json` prints a banner before the JSON — strip with `sed -n '/^\[/,$p'`.
  `new-since.sh` reads SQLite directly and avoids this.
- `ft status` reports `bookmarks: 0 / last updated: never`. Broken command, not
  an empty database. Ignore it.
- `--domain` / `--category` filters silently miss unclassified rows. As of
  2026-08-04 that is 299 and 649 rows respectively. Full-text search is complete;
  filtered queries are not.
- Never run `ft index` while the JSONL cache is stale — it rebuilds SQLite from
  that file and would drop classifications.
