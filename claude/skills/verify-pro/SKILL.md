---
name: verify-pro
description: Deep verification that validates work end-to-end and learns from stuck moments. Infers whether to verify a diff, a stated feature behavior, or run quality gates. Records lessons automatically when stuck and applies them on future runs. Use when validating that work actually does what it should, or when /verify isn't deep enough.
metadata:
  version: "0.1.0"
---

# Verify-Pro: Deep Verification With Self-Learning

Verify that the work in front of you actually does what it should — by running it, exercising it, and reasoning about it. When you get stuck, record the lesson so future runs are smarter.

Prefix your first line with 🔎 inline, not as its own paragraph.

## Mode Selection

Pick exactly one mode at the top of the run. Announce it on the first line so the user can override.

```
inputs available?
├─ explicit "verify the X feature" / behavior described → BEHAVIOR mode
├─ unstaged or staged diff present                       → DIFF mode
├─ recently edited files but no diff                     → DIFF mode on those files
└─ nothing specific                                       → QUALITY-GATES mode
```

Load the matching playbook before doing anything else:
- `playbooks/diff-mode.md` — verify a code change does what it intended
- `playbooks/behavior-mode.md` — verify a stated feature works end-to-end
- `playbooks/quality-gates.md` — opinionated checklist for the whole project

## Load Relevant Lessons First

Before running any verification step:

1. Identify the current project (repo name from `git remote` or working directory).
2. Identify topic keywords from the diff or stated intent (frameworks, modules, file paths touched).
3. Read `lessons.md`, filter by:
   - matching `project` tag, AND
   - any matching `keywords` tag, AND
   - `confidence >= 0.7`
4. State which lessons loaded ("Loaded 3 lessons: react-query-provider, env-var-typo, e2e-flake-pattern").
5. Apply matching lessons as extra checks during verification.
6. On each lesson hit, increment `hit_count` and update `last_hit` in `lessons.md`.

If no lessons match, proceed without them. Never invent matches.

## Safe Auto-Fixes Only

You may apply fixes only when ALL of:
- The fix is in `safe_auto` class: lint, formatting, obvious typos in newly-touched code, missing imports
- The fix is inside files already in the diff (do not modify unrelated files)
- The fix has near-zero risk of changing behavior

Anything else: report, do not fix. Mirror the policy from the `check` skill.

## Stuck Detection

A "stuck moment" is what triggers automatic lesson recording. Track the state of every playbook step (outcome, error strings, timings, user messages) so these rules can fire.

### Rules that record a lesson

| # | Rule | Modes | Default confidence |
|---|------|-------|--------------------|
| 1 | **Repeat error** — the same error string appears twice across two attempts in this run (e.g. same TS error after a fix, same selector miss, same test failure) | DIFF, QUALITY-GATES | 0.7 |
| 2 | **Reproduction impossible** — BEHAVIOR walk finds no observable evidence of the stated feature (route absent, endpoint 404s, UI element missing) after walking the full path | BEHAVIOR | 0.7 |
| 3 | **Test-regression cycle** — a test failed → safe auto-fix applied → same test fails again | DIFF | **0.85** (very low false-positive risk) |
| 4 | **Command timeout** — a verification command hangs or times out more than once in the same session | all | 0.7 |
| 5 | **User correction** — user says "no" / "wrong" / "not that" / "stop" / "you're checking the wrong thing" mid-run. Record both the correction and what verify-pro was doing when it landed. Always record, regardless of substance | all | 0.7 |

### Mode asymmetry

- **DIFF and QUALITY-GATES** are concrete. Fire rules 1, 3, 4 on first occurrence.
- **BEHAVIOR** is fuzzy. Rule 2 requires either user confirmation OR the signal firing across two playbook steps before recording. This is the main noise-prevention lever.

### Guardrails — do NOT record

- **Known flaky tests** — test files tagged `.flaky`, `.skip`, `xfail`, or matching a project-defined known-flaky list. Failure is noise, not a lesson.
- **First-time environment errors that self-resolve** — missing deps fixed by `npm install` in the same run, etc. Not stuck — just slow setup.
- **Genuine bugs in code-under-test** — these are *findings* (go in the report), not *lessons* (go in lessons.md). The distinction: a finding is about the code being verified; a lesson is about how we verify.
- **Slow but successful commands** — slowness alone is not stuck. Only record on actual failure or timeout.

### When a rule fires

1. Construct the lesson entry per the format in "Recording a Lesson (on stuck)".
2. Use the rule's default confidence (see table) unless context strongly justifies higher.
3. Append to `lessons.md`.
4. Surface in the report under `Lessons recorded:` so the user sees every write and can challenge it.

## Recording a Lesson (on stuck)

When stuck-detection fires, immediately append to `lessons.md`:

```yaml
---
id: lesson-{YYYY-MM-DD}-{NNN}   # NNN = next sequential number for the day
created: {YYYY-MM-DD}
confidence: 0.7                  # default; raise to 0.8+ if highly certain
hit_count: 0
last_hit: null
project: {repo-name}             # e.g. "gigover/web"
keywords: [{tag1}, {tag2}]       # what topics make this lesson relevant
mode: {DIFF | BEHAVIOR | QUALITY-GATES}
trigger_pattern: "{one-line description of what to watch for}"
context: "{why this matters — short}"
verification_step: "{the extra check this lesson adds to future runs}"
resolution: "{what fixed it / what to suggest}"
---
```

After writing, state in the report: "Recorded lesson {id} — {trigger_pattern}". The user sees every write.

## Report Format

Compact pass/fail by default. Structure:

```
🔎 verify-pro · {MODE}

Intent: {what we believe is being verified}
Lessons loaded: {count, ids}

Steps:
  ✓ {step name}
  ✓ {step name}
  ✗ {step name} — {one-line failure summary}

Auto-fixes applied: {none | list}
Lessons recorded: {none | list with trigger_pattern}

Verdict: PASS | FAIL | INCONCLUSIVE
Next: {one sentence on what the user should do}
```

If the user appends `--verbose` to the invocation, include full command outputs and reasoning. Otherwise keep it tight.

## Confidence and Decay

- Lessons with `confidence < 0.7` are loaded only when explicitly requested or in `--verbose`.
- A lesson with `hit_count = 0` and `created` older than 60 days drops in confidence by 0.1 each subsequent run (skill checks on load).
- Lessons at `confidence < 0.3` get tagged `archived: true` and are skipped from default loading.
- Never delete lessons automatically. Pruning is manual — see `prune.md`.

## Pruning

When the user invokes `verify-pro prune` or lessons.md grows past ~50 entries, follow `prune.md`.

## What This Skill Does NOT Do

- It does not replace `/check` (correctness review of the diff). Use `/check` for code review.
- It does not replace `/audit` (a11y/perf scoring). Use `/audit` for quality scoring.
- It does not aggressively rewrite code. Safe auto-fixes only.
- It does not delete lessons. Pruning is always a user-initiated step.
