---
name: maintain-newproj
description: Maintain and update the `newproj` project scaffolder (dotfiles/scripts/newproj.ts) — bump toolchain and framework versions to current, adapt to new TypeScript 7 / oxc / framework behaviors, verify every preset still scaffolds and builds green, and record lessons to a journal so each run is smarter than the last. Invoke with /maintain-newproj.
---

# Maintain newproj — self-improving scaffolder maintenance

## Overview

`newproj` (at `~/dotfiles/scripts/newproj.ts`) scaffolds new projects preconfigured
with the TypeScript 7 + oxc toolchain. Tech moves; this skill keeps the scaffolder
current **without regressing** — every change is proven by scaffolding each preset
and running its real `check`/`build` before anything is committed.

**Self-improving loop:** you read `JOURNAL.md` before acting (so you inherit every
prior lesson), and you append a structured entry after (so the next run inherits
this one). Durable rules graduate from the journal into `references/conventions.md`.

Paths (all under this skill's directory unless noted):
- Scaffolder: `~/dotfiles/scripts/newproj.ts`
- Alias: `~/dotfiles/zsh/zshrc` (`newproj`)
- Journal (memory): `JOURNAL.md`
- Invariants + preset spec: `references/conventions.md`
- Verification recipe: `references/verification.md`

## Procedure

### 0. Load memory — do this first, always
Read `JOURNAL.md` (most recent entries first) and `references/conventions.md`.
These carry hard-won gotchas (e.g. `bun add typescript@7` misresolves; Next/Astro
can't use TS7). Apply them; do not rediscover them.

### 1. Audit versions
For each dependency the scaffolder pins, find the latest published version and
compare to what `newproj.ts` writes. Check at least: `typescript`,
`@typescript/native-preview`, `oxlint`, `oxfmt`, `@types/bun`, `@types/node`,
`next`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, `vite`,
`@vitejs/plugin-react`, `hono`.

```sh
for p in typescript oxlint oxfmt next react vite hono @vitejs/plugin-react @typescript/native-preview; do
  echo "$p -> $(npm view "$p" version 2>/dev/null)"
done
```
Record the current-vs-pinned table; you'll cite it in the journal.

### 2. Audit behavior / currency (not just numbers)
A version number is not the whole story. Check for:
- **Framework majors** (Next 17+, React 20+, Vite 7+, Bun majors) — read the
  release/upgrade notes for breaking changes before bumping a major.
- **New TS7 removals/flags** — TS7 keeps trimming legacy options (already gone:
  `baseUrl`, `target: es5`, `moduleResolution: node/node10`). New ones may appear.
- **oxc changes** — new default rules, renamed flags (`oxc_format` → `oxfmt` already),
  config schema changes.
- **The embedder guardrail (critical):** tools that embed the TS compiler API
  (Next `next build`, `astro check`/Volar) still cannot use `typescript@7` until
  the stable programmatic API lands (~7.1). **Do NOT "upgrade" the Next preset to
  typescript@7** — it keeps `typescript@5` + `tsgo`. Re-check whether 7.1 shipped;
  if it did, that's a real preset change (verify `next build` before trusting it).

### 3. Apply updates
Edit `~/dotfiles/scripts/newproj.ts`: bump pins, fix deprecations, adjust tsconfig/
oxlint configs, add a preset only if the user asked. Keep the invariants in
`references/conventions.md` true.

### 4. Verify — the safety net (never skip)
Follow `references/verification.md`: scaffold **every** preset into a temp dir,
run `bun run check`, and run the build for `vite-react` and `next`. All must be
green. A version bump that breaks a preset is a regression — fix it or revert it.
Never commit an unverified change.

### 5. Record — the self-improvement
Append a dated entry to `JOURNAL.md` using the template at its top: what you
bumped (before → after), issues found + fixes, and any new gotcha. If a lesson is
**durable** (applies to every future run), also add it to the Gotchas section of
`references/conventions.md` — that's how the skill compounds.

### 6. Commit
Stage only the files you changed (`scripts/newproj.ts`, this skill's `JOURNAL.md`
/ `references/*`) — leave unrelated dotfiles WIP alone. Commit with a clear message.
Do not push unless the user asks.

## Guardrails (summary — full detail in references/conventions.md)
- **Per-runtime TS:** Bun/Node/Vite → real `typescript@7` + `tsc`. Next → `typescript@5`
  + `tsgo`. Astro → `typescript@5` + `astro check`. Same engine, different packaging.
- **Every preset:** oxlint (`correctness: error`), oxfmt, a `check` gate, a starter
  file (+ test where the runtime has one), git init + commit.
- **Known traps:** write `"^7.0.0"` into package.json then `bun install` (never
  `bun add typescript@7` — it misresolves); Bun needs `@types/bun` + `"types":["bun"]`;
  side-effect CSS imports need `declare module "*.css"`; no `baseUrl` under TS7.
- **Verification is mandatory.** If you can't verify a change, don't ship it.
