#!/usr/bin/env python3
"""WebVTT -> deduped, timestamped plain text.

YouTube auto-captions roll: each cue repeats the tail of the previous one so
text scrolls. Naive extraction is ~3x redundant. This keeps only newly-spoken
words and groups them into blocks with a leading [MM:SS] marker.
"""
import re
import sys

TS = re.compile(r"^(\d{2}):(\d{2}):(\d{2})\.\d{3}\s+-->\s+")
TAG = re.compile(r"<[^>]+>")
BLOCK_SECONDS = 30


def parse(path):
    cues = []
    seconds = None
    with open(path, encoding="utf-8", errors="replace") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            m = TS.match(line)
            if m:
                h, mnt, s = (int(x) for x in m.groups())
                seconds = h * 3600 + mnt * 60 + s
                continue
            if seconds is None:
                continue
            text = TAG.sub("", line).strip()
            if not text or text.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
                continue
            cues.append((seconds, text))
    return cues


def dedup(cues):
    """Drop lines already emitted, and lines that are a prefix of the next one."""
    out, seen = [], set()
    for i, (sec, text) in enumerate(cues):
        if text in seen:
            continue
        nxt = cues[i + 1][1] if i + 1 < len(cues) else ""
        if nxt.startswith(text) and text != nxt:
            continue
        seen.add(text)
        out.append((sec, text))
    return out


def stamp(sec):
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"[{h}:{m:02d}:{s:02d}]" if h else f"[{m:02d}:{s:02d}]"


def main():
    cues = dedup(parse(sys.argv[1]))
    if not cues:
        sys.exit("no cues found")
    block_start, words = cues[0][0], []
    for sec, text in cues:
        if sec - block_start >= BLOCK_SECONDS and words:
            print(f"{stamp(block_start)} {' '.join(words)}")
            block_start, words = sec, []
        words.append(text)
    if words:
        print(f"{stamp(block_start)} {' '.join(words)}")


if __name__ == "__main__":
    main()
