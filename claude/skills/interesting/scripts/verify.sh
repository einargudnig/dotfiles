#!/usr/bin/env bash
# Rebuild the Velite content layer and confirm a new /interesting item landed.
# Usage: verify.sh "<exact title>"
set -euo pipefail

TITLE="${1:?usage: verify.sh \"<exact title>\"}"
REPO="${EINAR_OS:-$HOME/personal/einar-os}"
cd "$REPO"

echo "  building content layer…" >&2
if ! bunx velite --clean >/tmp/velite.log 2>&1; then
  echo >&2
  echo "  VELITE FAILED — schema violation. Full log:" >&2
  cat /tmp/velite.log >&2
  exit 1
fi

python3 - "$TITLE" <<'PY'
import json, pathlib, sys

title = sys.argv[1]
items = json.loads(pathlib.Path(".velite/interesting.json").read_text())
match = next((i for i in items if i["title"] == title), None)

if not match:
    print(f"  NOT FOUND: {title!r} is not in the built collection", file=sys.stderr)
    print(f"  collection has {len(items)} item(s): "
          + ", ".join(repr(i["title"]) for i in items), file=sys.stderr)
    raise SystemExit(1)

print(f"  ok — {len(items)} item(s) in /interesting")
print(f"     title: {match['title']}")
print(f"     date:  {match['date'][:10]}")
print(f"     url:   {match.get('url') or '(none)'}")
print(f"     tags:  {', '.join(match.get('tags') or []) or '(none)'}")

newest = max(items, key=lambda i: i["date"])
if newest["title"] != title:
    print(f"  note: not the newest item — {newest['title']!r} "
          f"({newest['date'][:10]}) still sorts first", file=sys.stderr)
PY
