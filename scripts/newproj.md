# newproj — project scaffolder

Spin up a new project preconfigured with the **TypeScript 7 + oxc** toolchain
(oxlint + oxfmt), a green `check` gate, a starter test, and an initial commit.

## Setup (one-time)

The alias lives in `zsh/zshrc`:

```zsh
alias newproj='bun ~/dotfiles/scripts/newproj.ts'
```

Reload your shell (`source ~/.zshrc`) after a fresh checkout. Requires `bun`.

## Usage

```sh
newproj <name> --preset <preset>     # e.g. newproj my-app --preset tanstack-start
newproj <name>                       # prompts for the preset
newproj                              # prompts for name + preset
newproj --help                       # list presets
```

Flags: `--no-git` (skip the initial commit), `--no-install` (skip `bun install`).

## Presets

| Preset | Stack | Type-check | Tests |
|---|---|---|---|
| `bun-lib` | Bun CLI / library | `tsc` (TS7) | bun test |
| `hono` | Hono API on Bun (`/health`) | `tsc` (TS7) | bun test |
| `vite-react` | Vite + React 19 SPA | `tsc` (TS7) | vitest |
| `tanstack-start` | Full-stack React (Vite + Router + Nitro) | `tsc` (TS7) | vitest |
| `astro` | Astro content site | `astro check` (TS5) | — |

Every preset ships `.oxlintrc.json` (`correctness: error`), oxfmt, and a `check`
script that gates lint + typecheck (+ tests). After scaffolding:

```sh
cd <name>
bun run dev
bun run check      # your green gate
bun run format     # oxfmt --write
```

## The one rule behind the presets

TypeScript 7's native compiler is a drop-in **CLI** (`tsc`) but doesn't yet expose a
stable **programmatic API** (arrives ~7.1). So tools that *call* `tsc` get TS7; tools
that *embed* the TS API don't yet:

- **TS7-native:** Bun, Node, Vite, TanStack Start (Vite-based).
- **Not yet (embed the API):** `next build`, `astro check`/Volar → stay on `typescript@5`.

That's why Next was dropped (only preset that couldn't run TS7) and replaced with
TanStack Start, and why Astro uses `astro check` on TS5. See the slip-box note
`2a8m1 - typescript 7 native compiler`.

## Presets by design

- **template** presets write a static file map (bun-lib, hono, vite-react, astro).
- **delegated** presets run an official CLI then overlay the toolchain
  (`tanstack-start` → `@tanstack/cli create` + TS7/oxc overlay). Used when a
  framework's structure is non-trivial or fast-evolving.

## Maintenance

The `maintain-newproj` skill keeps this current — run `/maintain-newproj` to audit
versions, apply updates, verify every preset scaffolds + builds green, and log the
run. It carries a journal of prior lessons so each run is smarter than the last.
Implementation + invariants: `~/dotfiles/claude/skills/maintain-newproj/`.
