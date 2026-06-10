# Pruning lessons.md

Manual workflow. Triggered when:
- User invokes `verify-pro prune`
- `lessons.md` exceeds ~50 entries
- Verify-pro notices on load that >5 lessons are stale (zero hits, >60 days old)

## Step 1 — Audit pass

Read all lesson entries. For each, classify:

| Class | Criteria | Action |
|-------|----------|--------|
| **Active** | `hit_count >= 1` AND `last_hit` within 90 days | Keep |
| **Dormant** | `hit_count >= 1` BUT `last_hit` older than 90 days | Lower confidence by 0.1, keep |
| **Cold** | `hit_count = 0` AND `created` older than 60 days | Set `archived: true` |
| **Duplicate** | Trigger pattern matches another active lesson | Merge into the active one (sum hit_counts), archive this one |
| **Wrong** | Lesson references files/functions that no longer exist OR user has flagged as incorrect | Set `confidence: 0.0` and `archived: true` |

## Step 2 — Show the audit before changes

Print a table:

```
Active:     N lessons (keep)
Dormant:    N lessons (lower confidence)
Cold:       N lessons (archive)
Duplicate:  N lessons (merge)
Wrong:      N lessons (archive at confidence 0.0)
```

Then ask the user to confirm. Do not auto-apply pruning — even though lesson *recording* is automatic, lesson *removal* should not be.

## Step 3 — Apply

On confirmation, rewrite `lessons.md` with the chosen changes. Keep archived entries in place but with `archived: true` so they're skipped from default loading. Never hard-delete entries — keep the history.

## Step 4 — Summarize

Report counts before/after and any patterns noticed (e.g. "5 cold lessons all related to react-query — that lesson topic might not be worth tracking here").
