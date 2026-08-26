---
name: typecheck
description: Typecheck the current repo with the right checker and fix what it finds. Use when the user asks to typecheck, check types, run tsc, or asks whether the types are clean. Triggers on "typecheck", "check types", "run tsc", "does it compile", "type errors".
argument-hint: "<optional: path, workspace, or package to check>"
---

# Typecheck

Run the checker the repo actually declares, report real errors, fix them, prove it.

## Pick the checker — in this order

1. **The project's own script.** If `package.json` declares `"typecheck"`, run it (`bun run typecheck`). It is authoritative and usually wraps a codegen step the raw compiler needs — `react-router typegen`, `astro sync`, `velite`, `next typegen`. Skipping it produces phantom errors about generated types.
2. **The framework's checker**, if there's no script and the repo has single-file components:

   | Files present | Checker |
   |---|---|
   | `*.astro` | `astro check` (needs `@astrojs/check`) |
   | `*.vue` | `vue-tsc --noEmit` |
   | `*.svelte` | `svelte-check` |

3. **`tsc --noEmit`** otherwise. Prefer `./node_modules/.bin/tsc` over a global one.

**Plain `tsc` cannot resolve `.astro`, `.vue` or `.svelte` imports.** It reports `TS2307: Cannot find module './Foo.astro'` on files that exist. That is a tooling limit, not a bug — those modules are typed by the framework's language server, and none of them ship an ambient `*.astro`/`*.vue` module declaration. If you see TS2307 on single-file-component imports, you picked the wrong checker; go back to step 1.

The Stop hook at `~/.claude/hooks/typecheck.sh` does steps 1 and 3 only — project script, else `tsc`. It has no framework detection, so in a repo with single-file components *and* no `typecheck` script the hook will report TS2307s that aren't real. The fix there is to add the script to that repo, not to work around the hook.

## Errors are not hints

Read the summary line, not the volume of output. `astro check` ends with:

```
Result (107 files):
- 0 errors
- 0 warnings
- 41 hints
```

Hints are almost always `ts(6385)` deprecation notices from third-party types (`lucide-react`'s `Twitter`, `astro:content`'s `z`). **They are not failures and are not yours to fix.** Only `errors` block. Say the counts plainly rather than describing the output as noisy.

`tsc` leads with errors; `astro check` trails them behind hints. Don't `head`/`tail` the output blind — pull out the lines containing `error`.

## Then

Group the real errors by file and fix them. Rules that apply:

- Fix the cause, not the symptom. No `any`, no `@ts-expect-error`, no non-null `!` to silence a checker that is telling the truth. If a type is genuinely wrong upstream, say so rather than papering over it.
- Don't touch code outside the errors. A typecheck run is not a refactor.
- Errors cascade — one bad inferred type yields ten complaints. Fix the root and re-run before working down the list.

**Re-run the checker after fixing.** Report the before/after counts. "Should be clean" is not a result; `0 errors` is.

## Scope

With an argument, check only that path or workspace — `bun run typecheck --filter <pkg>` in a monorepo, or point the checker at the directory. Without one, check the whole repo.

If the repo has no `tsconfig.json`, there is nothing to do. Say so and stop.
