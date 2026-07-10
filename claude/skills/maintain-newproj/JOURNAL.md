# newproj maintenance journal

Append-only log. **Read newest-first before maintaining; append after.** Durable
lessons also graduate into `references/conventions.md`.

## Entry template (copy for each run)

```
## YYYY-MM-DD
**Versions (pinned → latest seen):** typescript X→Y, oxlint X→Y, next X→Y, …
**Bumped:** <what changed in newproj.ts, or "none — all current">
**Issues found + fixes:** <regressions caught by verification and how resolved>
**New gotchas:** <anything surprising; promote durable ones to conventions.md>
**Verified:** all 4 presets check green; vite build ✓ / next build ✓
```

---

## 2026-07-10 — maintenance run 1 (+ vitest)

**Versions (pinned → set):** oxfmt ^0.20.0 → ^0.58.0 · vite ^6 → ^8 ·
@vitejs/plugin-react ^4 → ^6. typescript/next/react/hono/oxlint already current.
**Deliberate non-bump:** @types/node stayed ^24 (latest is 26) — it tracks the
runtime Node version (24), not npm "latest". Promoted to conventions.md.
**Added:** vitest to the two non-Bun presets (vite-react, next) —
vitest ^4 + jsdom ^29 + @testing-library/react ^16 (+ /dom ^10), a sample
component test, `test` script, and vitest folded into `check`.
**Issues found + fixes:** none — vite 6→8 (two majors) built clean with the
minimal config; no regressions. next+vitest needed @vitejs/plugin-react to
transform JSX (Next has no Vite) — added to next devDeps + a `vitest.config.ts`.
**New gotchas:** (1) next+vitest requires @vitejs/plugin-react for the JSX
transform; (2) @types/node tracks runtime, not latest. Both → conventions.md.
**Verified:** all 4 presets check green; vite build (8.1.4) ✓; next build ✓;
vitest ran 1 test in each of vite-react + next, passed. tsc: bun/vite 7.0.2,
next 5.9.3 + tsgo 7.0.0-dev.

## 2026-07-10 — baseline (skill created)

**State at creation.** Scaffolder pins:
- `typescript ^7.0.0` (resolves 7.0.2) · `@typescript/native-preview latest` (7.0.0-dev.20260707.2)
- `oxlint ^1.73.0` · `oxfmt ^0.20.0` · `@types/bun latest` · `@types/node ^24`
- `next ^16` · `react/react-dom ^19` · `@types/react(-dom) ^19`
- `vite ^6` · `@vitejs/plugin-react ^4` · `hono ^4`

**Presets:** bun-lib, hono, vite-react, next.

**Verified:** all four scaffold; `bun run check` green in each; `vite build` and
`next build` both exit 0. bun-lib/hono/vite-react `tsc` = 7.0.2; next keeps `tsc`
5.9.3 + `tsgo` 7.0.0-dev.

**Gotchas established** (now in conventions.md): bun tag-add misresolution → pin in
manifest + `bun install`; Bun needs `@types/bun` + `types:["bun"]`; CSS side-effect
imports need `declare module "*.css"`; vite.config.ts needs `@types/node` +
`types:["vite/client","node"]`; Next/Astro/Volar embed the TS API so stay on
`typescript@5` until TS 7.1; `next build` auto-edits tsconfig on first run.

**Watch next time:** whether TS 7.1 shipped a stable programmatic API (would let the
Next preset move fully to `typescript@7` — verify `next build` before trusting it);
whether Next 17 / React 20 / Vite 7 / a Bun major landed; oxlint 2.x rule changes.
