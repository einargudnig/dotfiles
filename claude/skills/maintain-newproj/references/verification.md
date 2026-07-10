# Verifying newproj presets

Mandatory before committing any change. Scaffold each preset into a throwaway dir,
run its real gate, and for the web presets run the build. Green across the board or
the change doesn't ship.

Use a scratch dir outside any repo (e.g. the session scratchpad, or `mktemp -d`).

```sh
WORK=$(mktemp -d)/np-verify && mkdir -p "$WORK" && cd "$WORK"

# 1. Every preset scaffolds + passes its check gate AND format:check
# (tanstack-start is delegated — it runs the official CLI, so it needs network + is slower)
for preset in bun-lib hono vite-react tanstack-start astro; do
  echo "===== $preset ====="
  bun ~/dotfiles/scripts/newproj.ts "v-$preset" --preset "$preset" || { echo "SCAFFOLD FAILED: $preset"; continue; }
  ( cd "v-$preset" && bun run check )        && echo "check OK: $preset"        || echo "CHECK FAILED: $preset"
  ( cd "v-$preset" && bun run format:check ) && echo "format:check OK: $preset" || echo "FORMAT DRIFT: $preset"
done

# 2. Build presets must also build (run AFTER format:check — oxfmt scans dist/)
( cd "$WORK/v-vite-react"     && bun run build ) && echo "vite build OK"
( cd "$WORK/v-tanstack-start" && bun run build ) && echo "tanstack build OK"   # SSR bundle, on TS7
( cd "$WORK/v-astro"          && bun run build ) && echo "astro build OK"

# 3. Confirm the compilers resolved as intended
echo "bun-lib tsc:        $("$WORK"/v-bun-lib/node_modules/.bin/tsc --version)"        # expect 7.x
echo "tanstack-start tsc: $("$WORK"/v-tanstack-start/node_modules/.bin/tsc --version)" # expect 7.x (Vite-native, no embedder caveat)

# 4. Interactive path still parses (name + preset by number)
printf 'v-int\n2\n' | bun ~/dotfiles/scripts/newproj.ts --no-install --no-git

rm -rf "$WORK"
```

Pass criteria:
- All four presets scaffold without error.
- `bun run check` exits 0 in each (0 lint errors, typecheck clean, tests pass).
- `vite build` and `next build` exit 0.
- `bun-lib`/`hono`/`vite-react` resolve `tsc` to **7.x**; `next` keeps `tsc` **5.x** and
  `tsgo` **7.x**.

If a preset fails after a bump, that's the regression to fix (or revert the bump) —
and a candidate gotcha for `conventions.md`.
