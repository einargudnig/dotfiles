# newproj conventions & invariants

The rules the scaffolder must keep true. Distilled from real migrations across the
personal repos (2026-07). When a journal lesson becomes durable, add it here.

## The one rule that explains every exception

TypeScript 7's native compiler is a drop-in **CLI** (`tsc`), but TS7 does **not yet
expose a stable programmatic API** (arrives ~7.1). So:

| Consumer | How it uses TS | TS7? |
|---|---|---|
| Bun / Node / plain `tsc` | calls `tsc` as a CLI | ✅ `typescript@7` |
| Vite — incl. **TanStack Start** | esbuild transpiles; `tsc` only type-checks | ✅ `typescript@7` |
| Next.js `next build` | **embeds** the TS compiler API | ❌ needs TS5 + tsgo |
| `astro check` / Volar | **embeds** the TS API | ❌ `typescript@5` |

This rule is *why the Next preset was dropped* (see JOURNAL 2026-07-10 run 3):
Next is the only full-stack React option that embeds the TS API and can't run TS7.
**TanStack Start replaced it** — it's Vite-native (built on Vite + TanStack Router +
Nitro), so real `typescript@7` works (verified: `tsc --noEmit` + build clean). If a
future full-stack option embeds the TS API, it'd need the TS5 treatment like Astro —
re-check each maintenance run.

## Every preset ships

- `.oxlintrc.json` with `categories.correctness = "error"` (suspicious/perf = warn),
  `ignorePatterns` for `node_modules/`, `dist/`, `.next/`, `**/*.d.ts`.
- `oxfmt` as the formatter (`format` / `format:check` scripts).
- A `check` script that gates lint + typecheck (+ test where applicable).
- A starter source file, and a test for runtimes with a test runner (Bun presets).
- `git init` + an initial commit (unless `--no-git`).
- No `baseUrl` in any tsconfig (removed in TS7); use explicit relative `paths`.

## Per-preset spec

- **bun-lib** — Bun + `typescript@7`. tsconfig `types:["bun"]`, `module: Preserve`,
  `moduleResolution: bundler`, `allowImportingTsExtensions`. check = oxlint + tsc + bun test.
- **hono** — bun-lib + `hono` dep, `/health` route + request test, `bun run --hot`.
- **vite-react** — Vite + React 19 + `typescript@7`. Needs `@types/node` and
  `types:["vite/client","node"]` (vite.config.ts uses `node:path`/`import.meta.dirname`).
  oxlint `react` plugin, `react/react-in-jsx-scope` off, `import/no-unassigned-import`
  off (CSS side-effect imports). **Tests: vitest** (jsdom + @testing-library/react),
  config in vite.config.ts via `defineConfig` from `vitest/config`. check = oxlint +
  tsc + vitest; `build` = tsc + vite build.
- **tanstack-start** — full-stack React (Vite + TanStack Router + Nitro). **Delegated:**
  scaffolded via the official `bunx @tanstack/cli@latest create <name> -y` (its structure
  is non-trivial and evolves), then an overlay bumps `typescript` to `^7` and adds
  oxlint + oxfmt + `lint`/`typecheck`/`format`/`check` scripts + `.oxlintrc.json` +
  a `src/smoke.test.ts` (the scaffold ships `test: vitest run` but no tests). `.cta.json`
  (create-tool metadata) is removed. Vite-native → real `typescript@7` (tsc --noEmit +
  vite build both clean). oxlint passes on the official code. Ignore `src/routeTree.gen.ts`
  (generated) + `.output`/`.nitro`/`.tanstack`. check = oxlint + tsc + vitest.
- **astro** — Astro + `typescript@5` + `@astrojs/check` (`astro check` = typecheck;
  Volar embeds the TS API, so no TS7 — same rule as Next). tsconfig extends
  `astro/tsconfigs/strict`. oxlint lints the `.ts`/config (it does **not** parse
  `.astro`); no vitest by default. check = oxlint + astro check. `.astro` files are
  not formatted by oxfmt (JS/TS only) — a known gap.

## Scaffolder behavior

- Presets are either **template** (a static file map written directly) or **delegated**
  (run an official CLI, then overlay the toolchain). `tanstack-start` is the only
  delegated preset; the rest are templates. Delegated presets always install (the CLI
  installs), so `--no-install` doesn't apply to them.
- After install, the scaffolder runs `bun run format` (oxfmt) on the generated project,
  so a fresh scaffold is oxfmt-clean regardless of template-vs-formatter drift. Bumping
  oxfmt therefore never leaves the templates stale.
- Run `format:check` on **source, before building** — oxfmt scans `dist/` build output
  if present (it doesn't honor `.gitignore`), so a post-build `format:check` will flag
  build artifacts. The verify recipe orders format:check before builds for this reason.

## Durable gotchas (grow this list)

1. **`bun add typescript@7` misresolves** to an old transitive version and may not
   write package.json. Instead put `"typescript": "^7.0.0"` in the manifest and run
   `bun install`. (Same for other tag-based bun adds that misbehave.)
2. **Bun projects need `@types/bun` + `"types": ["bun"]`** or `Bun`/`bun:*` don't
   type-check — and it silently "passed" before only because typecheck never ran.
3. **Side-effect CSS imports** (`import "./globals.css"`) need `declare module "*.css"`;
   bundlers handle them at build time but the type-checker doesn't without the decl.
4. **`next build` auto-edits `tsconfig.json`** on first run (adds
   `.next/dev/types/**/*.ts` to `include`) — expected, not a regression.
5. **oxlint `react/react-in-jsx-scope`** is a false positive under the automatic JSX
   runtime — keep it off in React/Next presets.
6. **fnm + global tsgo:** a global tsgo installed under one Node version isn't on
   PATH after `fnm use <other>`. Not the scaffolder's concern (projects install
   locally), but relevant if verifying with a global binary.
7. **`@types/node` tracks the runtime Node version, not npm "latest".** Pin it to
   the Node major actually in use (^24 for Node 24), not whatever `npm view` returns.
8. **next + vitest needs `@vitejs/plugin-react`.** Next has no Vite, so vitest can't
   transform JSX without the plugin; add it to devDeps + a standalone `vitest.config.ts`
   (`defineConfig` from `vitest/config`). The `test`/`check` still use `tsgo` for types.
