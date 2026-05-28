---
name: knowledge-system
description: Operate, tune, troubleshoot, or extend Einar's personal knowledge system — breadcrumb capture, per-prompt qmd recall, the concierge agent, and memory sync. Use when any part of that pipeline misbehaves (recall too quiet/noisy, index stale, a hook didn't fire, concierge returns nothing) or when adding/changing a piece of it. NOT for answering "what do I know about X" — that's the concierge agent.
---

# Knowledge system — operations runbook

The single source of truth for how Einar's capture + recall + memory pipeline
works. It is a **runbook for the system**, not a search tool — to *find* notes,
use the `concierge` agent or let per-prompt recall surface them.

Keep this file factual and in sync with reality. A drifted runbook is worse than
none — if you change a hook or knob, update the matching line here.

## The loop (what fires, when, where it lives)

Everything lives in `~/dotfiles/claude/` and is symlinked into `~/.claude/` by
`dotfiles/claude/link.sh`. Hooks are wired in `dotfiles/claude/settings.json`.

| Trigger | Component | Does |
|---|---|---|
| **SessionStart** (startup/resume/clear) | `hooks/breadcrumb-briefing.py` | Injects the newest breadcrumbs for the cwd's project (`MAX_NOTES=4`) + qmd BM25 knowledge hits (`MAX_KNOWLEDGE=3`, weak on bare repo names). |
| **UserPromptSubmit** (every prompt) | `hooks/qmd-recall.py` | BM25 recall over the vault; injects up to `MAX_HITS=3` notes. ~0.25s, fails open. |
| **SessionEnd** (clean exit only) | `hooks/breadcrumb-capture.py` | Auto-`/done`: if the session is substantial and didn't already capture, spawns a detached `claude -p` that writes one breadcrumb. |
| **SessionEnd** | `hooks/memory-autocommit.sh` | Commits + pushes the private memory repo if changed (pushes whenever ahead, so missed pushes self-heal). |
| **SessionEnd** | `hooks/qmd-refresh.sh` | `qmd update && qmd embed` (detached) so the index never goes stale. |
| manual `/done`, `/memento` | `skills/done`, `skills/memento` | Deliberate breadcrumb (richer than auto-capture). `/done` ends the session. |
| manual `/memento-defrag` | `skills/memento-defrag` | Archives stale breadcrumbs to `claude-breadcrumbs/_archive/`. |
| on demand | `agents/concierge.md` | Searches the whole vault via qmd to answer knowledge questions. The CLAUDE.md global rule tells the main agent to consult it. |

Inert but tracked (not wired into settings): `hooks/vault-commit.sh`. Leftover
from the retired `~/memento` vault — it doesn't fire. (`memento-triage.py` and
`memento-sweeper.py` were deleted 2026-05-28.)

## Where things are

- **Vault:** `~/personal/obsidian/second-brain/` — `claude-breadcrumbs/` (session logs), `80 slip-box/` (Zettelkasten knowledge), `40 reference/` + `60 reference/`, `weekly-reviews/`, `30 planner/` (journal; **excluded** from recall).
- **qmd index:** collection `second-brain` (the whole vault). Semantic search engine.
- **memento.yml:** `~/.config/memento-vault/memento.yml` — `vault_path` → second-brain; capture thresholds (`exchange_threshold: 15`, `file_count_threshold: 3`, `notable_patterns`).
- **Repos:** public `dotfiles` (config only) ; **private** `claude-memory` = `~/.claude/projects/-Users-einargudjonsson/memory/` (auto-memory; work/personal content). Never put work content in public dotfiles.

## Invariants (decisions — don't silently break)

- **One vault.** Capture goes to `second-brain/claude-breadcrumbs/`. The old `~/memento` vault is RETIRED (tombstoned). Never write there or re-introduce the `notes/`/`projects/` atomic-note layout.
- **Public/private split.** Config → public dotfiles. Work/personal notes, auto-memory, global CLAUDE.md → private (or local-only). The global `CLAUDE.md` is intentionally local-only (mentions Maul).
- **Clean exit required.** All three SessionEnd hooks only fire on `/quit`, `/clear`, ctrl-D — NOT on a hard kill or closed window. A missed memory push / index refresh self-heals next clean exit; only that one session's breadcrumb is lost.

## The knobs

- **Recall** (`hooks/qmd-recall.py`): `MIN_SCORE=0.5` (raise → quieter), `MAX_HITS=3`, `MIN_PROMPT_LEN=16`, `MIN_KEYWORDS=2`, `STOPWORDS` (the conversational-word filter), excludes `archive`/`planner`/`excalidraw`. Per-session de-dupe cache in `$TMPDIR/qmd-recall-<session>.txt`.
- **Briefing** (`hooks/breadcrumb-briefing.py`): `MAX_NOTES=4`, `MAX_KNOWLEDGE=3`.
- **Capture substantiality** (`hooks/breadcrumb-capture.py` via memento.yml): >15 exchanges, or >3 files, or touched a `notable_patterns` file.
- **Defrag** (`skills/memento-defrag`): unchecked follow-ups stop protecting a breadcrumb after 60 days (the boxes are never ticked in practice).

## qmd cheatsheet

```bash
qmd search  "terms"   -c second-brain -n 8 --files   # BM25, fast, AND-ish (see gotcha)
qmd vsearch "phrase"  -c second-brain -n 8           # vector; slow (~5s, LLM expansion)
qmd query   "phrase"  -c second-brain -n 10          # best, but downloads a ~2GB model on first use
qmd update && qmd embed                              # refresh index (incremental)
qmd collection list                                  # show collections + staleness
```

**Gotcha:** qmd `search` (BM25) is **AND-based** — one query word absent from a
note drops the note entirely. That's why recall strips conversational words to
content terms before searching. If recall misses obvious notes, suspect a stray
word survived the `STOPWORDS` filter.

## Troubleshooting

- **Recall too quiet / misses obvious notes** → a non-content word survived `STOPWORDS` (AND-match killed it); add it. Or lower `MIN_SCORE`. Test: `qmd search "<content terms>" -c second-brain --files`.
- **Recall too noisy** → raise `MIN_SCORE`, drop `MAX_HITS`, or add a path to the exclusions.
- **Concierge / recall returns nothing at all** → index stale or empty. `qmd collection list` (check "Updated"), then `qmd update && qmd embed`. Confirm collection is named `second-brain`.
- **A SessionEnd thing didn't happen** → did the session exit cleanly? Hard kills skip all SessionEnd hooks.
- **Auto-capture didn't write a breadcrumb** → session wasn't "substantial," or `/done`/`/memento` already captured (dedupe), or the detached `claude -p` is still running (it writes ~30s after exit; indexed next session).
- **`qmd query` hangs first time** → it's downloading the ~2GB expansion model. Use `search`/`vsearch` meanwhile.

## Extending it

- **Add a hook:** drop the script in `dotfiles/claude/hooks/`, add an entry to `settings.json`, run `dotfiles/claude/link.sh` (it links new hooks automatically), commit + push.
- **New machine:** `git clone` dotfiles → `./claude/link.sh`. Then clone the private `claude-memory` repo into the memory path. Run `qmd update && qmd embed` once.
- **Change a knob:** edit the constant in the relevant hook; update the Knobs section above.
