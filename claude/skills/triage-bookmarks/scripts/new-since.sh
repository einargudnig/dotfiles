#!/usr/bin/env bash
# Emit bookmarks synced since the last triage run, as a readable digest.
#
#   new-since.sh              # since last successful run
#   new-since.sh --since ISO  # since an explicit timestamp
#   new-since.sh --commit ISO # record a new watermark (call only after triage succeeds)
#   new-since.sh --status     # show the current watermark
#
# `ft list --json` omits synced_at, so this reads SQLite directly.
set -euo pipefail

DB="$HOME/.ft-bookmarks/bookmarks.db"
STATE="$HOME/.ft-bookmarks/triage-watermark"

[ -f "$DB" ] || { echo "no fieldtheory db at $DB — run 'ft sync' first" >&2; exit 1; }

case "${1:-}" in
  --status)
    echo "watermark: $(cat "$STATE" 2>/dev/null || echo '(none — first run)')"
    echo "newest synced_at: $(sqlite3 "$DB" 'SELECT MAX(synced_at) FROM bookmarks;')"
    exit 0 ;;
  --commit)
    printf '%s' "${2:?usage: --commit <iso-timestamp>}" > "$STATE"
    echo "watermark set to ${2}" >&2
    exit 0 ;;
  --since) SINCE="${2:?usage: --since <iso-timestamp>}" ;;
  "")      SINCE="$(cat "$STATE" 2>/dev/null || echo '')" ;;
  *)       echo "unknown flag: $1" >&2; exit 2 ;;
esac

# First run has no watermark — fall back to the last 7 days rather than all 699.
if [ -z "$SINCE" ]; then
  SINCE="$(sqlite3 "$DB" "SELECT datetime('now','-7 days');")"
  echo "  no watermark — defaulting to last 7 days ($SINCE)" >&2
fi

echo "  newest in db: $(sqlite3 "$DB" 'SELECT MAX(synced_at) FROM bookmarks;')" >&2

sqlite3 -json "$DB" "
  SELECT id, author_handle, posted_at, text, url, links_json, primary_domain
  FROM bookmarks
  WHERE synced_at > '$SINCE'
  ORDER BY synced_at DESC;" |
python3 -c "
import json, re, sys

rows = json.load(sys.stdin)
if not rows:
    print('  nothing new since the watermark', file=sys.stderr)
    raise SystemExit(0)

print(f'  {len(rows)} new bookmark(s)', file=sys.stderr)
for r in rows:
    text = re.sub(r'https://t\.co/\w+', '', r['text'] or '')
    text = re.sub(r'\s+', ' ', text).strip()
    links = [l for l in json.loads(r['links_json'] or '[]') if 't.co' not in l]
    print(f\"@{r['author_handle']} [{r['primary_domain'] or 'unclassified'}] {text[:400]}\")
    if links:
        print('   LINKS: ' + ' '.join(links[:3]))
    print(f\"   {r['url']}\")
    print()
"
