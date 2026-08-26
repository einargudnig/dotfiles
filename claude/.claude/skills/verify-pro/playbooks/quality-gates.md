# QUALITY-GATES mode playbook

Opinionated checklist. Run when there's no specific diff or behavior to verify — just "is the project healthy right now?"

## Step 1 — Project detection

Detect the project type from the working directory:
- `package.json` present → Node/JS project. Read `scripts` to find the right commands.
- `tsconfig.json` present → TypeScript project. Include type-check.
- `next.config.*` / `react-router.config.*` / `vite.config.*` → Web app. Boot is feasible.
- `Cargo.toml` / `go.mod` / `pyproject.toml` → Use the language's standard tooling.

State the detected stack on first line.

## Step 2 — Run the gates

In parallel where possible:

| Gate | Command (typical) | Pass criteria |
|------|-------------------|---------------|
| Install integrity | `npm ci --dry-run` or check lockfile vs `package.json` | No drift |
| Lint | `npm run lint` | Exit 0 |
| Type-check | `npm run typecheck` or `tsc --noEmit` | Exit 0 |
| Tests | `npm test` | All pass, no skipped without reason |
| Build | `npm run build` | Exit 0, no warnings escalated to errors |

If a script doesn't exist, mark `skipped (no script)` rather than inventing one.

## Step 3 — Repo hygiene (light)

- Uncommitted changes? List them briefly.
- Branch ahead/behind main? Note delta.
- Large new untracked files (>1MB)? Flag.

Don't deep-audit. This is sanity, not full review.

## Step 4 — Apply lessons

Quality-gate lessons are typically environment quirks ("this project's lint script exits 0 even on errors — also check stdout for 'problem'"). Apply them.

## Step 5 — Verdict

- **PASS** — every gate green
- **FAIL** — any gate failed
- **INCONCLUSIVE** — gates couldn't run (missing deps, broken setup)

For quality-gates mode, INCONCLUSIVE is itself worth recording as a lesson if it happens twice — the setup itself is broken.
