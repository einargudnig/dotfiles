#!/usr/bin/env bash
# Fetch a video's metadata + timestamped transcript.
# Usage: fetch-transcript.sh <url> [outdir]
# Writes  <outdir>/meta.json  and  <outdir>/transcript.txt, prints the outdir.
set -euo pipefail

URL="${1:?usage: fetch-transcript.sh <url> [outdir]}"
OUT="${2:-$(mktemp -d "${TMPDIR:-/tmp}/watch.XXXXXX")}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$OUT"

log() { printf '  %s\n' "$*" >&2; }

log "fetching metadata…"
yt-dlp --dump-single-json --no-warnings "$URL" >"$OUT/meta.json"

python3 - "$OUT/meta.json" <<'PY' >&2
import json, sys
m = json.load(open(sys.argv[1]))
d = m.get("duration") or 0
print(f"  {m.get('title','(untitled)')} — {d//60}m{d%60:02d}s — {m.get('uploader','?')}")
PY

# ---- 1. existing caption track (YouTube, most conference sites) --------------
log "looking for captions…"
yt-dlp --skip-download --no-warnings \
  --write-subs --write-auto-subs \
  --sub-langs "en.*,is.*" --sub-format vtt \
  -o "$OUT/cap.%(ext)s" "$URL" >/dev/null 2>&1 || true

VTT="$(find "$OUT" -name 'cap*.vtt' | sort | head -1)"

if [ -n "$VTT" ]; then
  log "captions found → $(basename "$VTT")"
  python3 "$HERE/vtt2txt.py" "$VTT" >"$OUT/transcript.txt"
  echo "$OUT"
  exit 0
fi

# ---- 2. no captions (X/Twitter, most social video) -> transcribe -------------
log "no caption track — falling back to speech-to-text"

if ! uvx --from mlx-whisper mlx_whisper --help >/dev/null 2>&1; then
  cat >&2 <<'MSG'

  NEEDS-STT: this video has no captions, so it must be transcribed locally.
  Not installed yet. One-off (ephemeral, no global install; ~500MB model
  cached on first run):

      uvx --from mlx-whisper mlx_whisper --model mlx-community/whisper-small-mlx <file>

MSG
  exit 3
fi

log "downloading audio…"
yt-dlp -f "bestaudio/best" -x --audio-format mp3 --no-warnings \
  -o "$OUT/audio.%(ext)s" "$URL" >/dev/null

log "transcribing (this is the slow part)…"
uvx --from mlx-whisper mlx_whisper \
  --model mlx-community/whisper-small-mlx \
  --output-format vtt --output-dir "$OUT" "$OUT/audio.mp3" >/dev/null 2>&1

python3 "$HERE/vtt2txt.py" "$OUT/audio.vtt" >"$OUT/transcript.txt"
echo "$OUT"
