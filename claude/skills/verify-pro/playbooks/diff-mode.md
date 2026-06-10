# DIFF mode playbook

Verify that a code change does what was intended.

## Step 1 — Get the diff and the intent

- Read the diff: staged + unstaged. If both are empty, fall back to "files modified in last 24h" via `git log` + the recent edit list.
- State the intent in one sentence. Sources for intent (in priority order):
  1. The user's current message
  2. The last user-facing message in the conversation
  3. The most recent commit message
  4. Inferred from the diff itself (lowest priority — say so)

If intent is unclear, ask one question before continuing. Do not guess silently.

## Step 2 — Scope drift check

Compare diff against intent. Label one of:
- **on target** — diff matches intent, nothing extra
- **drift** — diff includes things intent didn't ask for (refactors, renames, unrelated files)
- **incomplete** — diff doesn't appear to fully implement the intent

Drift and incomplete are both report-worthy; they don't block verification but they go in the report.

## Step 3 — Static checks

Run in parallel where possible:
- Type-check (`tsc --noEmit` or project equivalent)
- Lint (project's lint script)
- Unit tests touching the changed files (use test affected-by-diff feature if the project has it; otherwise full run)

Each step: ✓ / ✗ / skipped (with reason).

## Step 4 — Runtime check

For changes touching code that runs:
- If the project has a dev server and the change touches user-facing code, boot it.
- Use Playwright/MCP browser to navigate to the affected area when possible.
- Exercise the specific behavior the diff is supposed to add or fix.
- Watch console for errors during the interaction.

Skip runtime check when:
- Diff is pure config, docs, types, or tests
- No dev server exists for the project
- Project setup makes booting impractical (state in report)

## Step 5 — Regression sweep

For each changed file, identify the immediate callers/importers (one hop). Briefly check that:
- Their tests still pass
- Their type signatures still line up
- No obviously-broken usage patterns

This is a sanity check, not a full audit. Two minutes max.

## Step 6 — Apply lessons

For each loaded lesson, run its `verification_step`. Record hits.

## Step 7 — Verdict

- **PASS** — all steps green, no lesson hits flagging issues
- **FAIL** — any static check failed, runtime behavior wrong, or lesson hit confirms a known problem
- **INCONCLUSIVE** — couldn't run a key step (no dev server, missing creds, etc.); list what's missing
