# newproj conventions & invariants

The rules the scaffolder must keep true. Distilled from real migrations across the
personal repos (2026-07). When a journal lesson becomes durable, add it here.

## The one rule that explains every exception

TypeScript 7's native compiler is a drop-in **CLI** (`tsc`), but TS7 does **not yet
expose a stable programmatic API** (arrives ~7.1). So:

| Consumer | How it uses TS | Preset choice |
|---|---|---|
| Bun / Node / plain `tsc` | calls `tsc` as a CLI | **`typescript@7`** + `tsc` |
| Vite | esbuild transpiles; `tsc` only type-checks | **`typescript@7`** + `tsc` |
| Next `next build` | **embeds** the TS compiler API | `typescript@5` for build + **`tsgo`** for typecheck |
| `astro check` / Volar | **embeds** the TS API | `typescript@5` + `astro check` |

`tsgo` (`@typescript/native-preview`) *is* the TS7 engine, packaged separately so it
can coexist with a framework's `typescript@5`. Never bump an embedder to `typescript@7`
until it declares TS7 support — re-check each maintenance run.

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
  off (CSS side-effect imports). check = oxlint + tsc; `build` = tsc + vite build.
- **next** — Next 16 + React 19. `typescript@5` (build) + `@typescript/native-preview`
  (tsgo typecheck). oxlint `react` + `nextjs` plugins. Ships `types/css.d.ts` and a
  static `next-env.d.ts` (so a first `check` before `next dev` has Next's ambient
  types). check = oxlint + tsgo. `next build` uses typescript@5.

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
