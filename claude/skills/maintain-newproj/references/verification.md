# Verifying newproj presets

Mandatory before committing any change. Scaffold each preset into a throwaway dir,
run its real gate, and for the web presets run the build. Green across the board or
the change doesn't ship.

Use a scratch dir outside any repo (e.g. the session scratchpad, or `mktemp -d`).

```sh
WORK=$(mktemp -d)/np-verify && mkdir -p "$WORK" && cd "$WORK"

# 1. Every preset scaffolds + passes its check gate
for preset in bun-lib hono vite-react next; do
  echo "===== $preset ====="
  bun ~/dotfiles/scripts/newproj.ts "v-$preset" --preset "$preset" || { echo "SCAFFOLD FAILED: $preset"; continue; }
  ( cd "v-$preset" && bun run check ) && echo "check OK: $preset" || echo "CHECK FAILED: $preset"
done

# 2. Web presets must also build
( cd "$WORK/v-vite-react" && bun run build ) && echo "vite build OK"
( cd "$WORK/v-next"       && bun run build ) && echo "next build OK"   # proves the tsgo + typescript@5 split

# 3. Confirm the compilers resolved as intended
echo "bun-lib tsc:  $("$WORK"/v-bun-lib/node_modules/.bin/tsc --version)"       # expect 7.x
echo "next tsc:     $("$WORK"/v-next/node_modules/.bin/tsc --version)"          # expect 5.x (for next build)
echo "next tsgo:    $("$WORK"/v-next/node_modules/.bin/tsgo --version)"         # expect 7.x

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
