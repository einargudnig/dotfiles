#!/usr/bin/env python3
"""UserPromptSubmit hook: inject vault notes relevant to the prompt.

Per-prompt recall over the second-brain qmd index. Fires on every prompt, so it
is aggressively noise-controlled:
  - skips trivial / command prompts (too short, /slash, !bash, "ok"/"yes"/...)
  - BM25 `search` only (fast, deterministic, no LLM query-expansion / model)
  - keeps only confident hits (Score >= MIN_SCORE), caps at MAX_HITS
  - excludes archived breadcrumbs
  - per-session cache: never re-injects a note already surfaced this session

Fails open (injects nothing) on any error or timeout — must never block a prompt.
Pure stdlib.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

COLLECTION = "second-brain"
MAX_HITS = 3
MIN_SCORE = 0.5         # BM25 score (0-1); below this, too weak for the tokens
MIN_PROMPT_LEN = 16
MIN_KEYWORDS = 2
SEARCH_TIMEOUT = 5

# qmd's BM25 is AND-ish: one term absent from a note drops it entirely. So strip
# conversational scaffolding aggressively — keep only likely domain terms.
STOPWORDS = frozenset("""
a an the to for of in on at and or but with my me you your i we it its as by from
be been being is are was were am do does did doing have has had can could would
should will shall may might must not no yes get got make made use used using need
want about into out over under again then than so just like one also this that
these those there here what when where why which who whom how whose if else while
off up down only very more most some any all each both few how's let lets please
help show tell give find add fix update change set run go ever any anything
something someone regarding concerning know knows knew knowing remember remembered
recall recalls think thinks thinking thought thoughts tell told explain explained
explaining understand understood understanding wonder wondering figure figured
written wrote write writing note notes again did done already still ever stuff
thing things way ways idea ideas remind reminds whats what's im i'm ive i've
""".split())


def keywords(prompt: str) -> str:
    """Reduce a natural-language prompt to content terms for BM25."""
    toks = re.findall(r"[A-Za-z0-9][A-Za-z0-9'_-]+", prompt.lower())
    kept = [t for t in toks if t not in STOPWORDS and len(t) > 2]
    return " ".join(kept)
SKIP_RE = re.compile(
    r"^\s*(?:[/!]|y|n|yes|no|ok|okay|sure|thx|thanks|thank you|yep|nope|yeah|"
    r"continue|go|go ahead|do it|proceed|stop|wait|nvm|never ?mind|undo|"
    r"commit|push|run( it| that| the tests?)?)\s*[.!]?\s*$",
    re.IGNORECASE,
)


def cache_file(session_id: str) -> Path:
    safe = re.sub(r"[^A-Za-z0-9_-]", "_", session_id or "nosession")
    return Path(tempfile.gettempdir()) / f"qmd-recall-{safe}.txt"


def search(prompt: str) -> list[tuple[str, str, int]]:
    """Keyword-reduced BM25 search → [(title, vault-relative-path, score%)].

    Uses `--files` (CSV: docid,score,filepath) — stable and easy to parse.
    """
    if not shutil.which("qmd"):
        return []
    terms = keywords(prompt)
    if len(terms.split()) < MIN_KEYWORDS:
        return []
    try:
        out = subprocess.run(
            ["qmd", "search", terms, "-c", COLLECTION, "-n", "8", "--files"],
            capture_output=True, text=True, timeout=SEARCH_TIMEOUT,
        ).stdout
    except Exception:
        return []

    hits, seen_stems = [], set()
    for line in out.splitlines():
        parts = line.split(",", 2)          # docid, score, filepath
        if len(parts) != 3:
            continue
        try:
            score = float(parts[1])
        except ValueError:
            continue
        rel = parts[2].split("second-brain/", 1)[-1].strip()
        stem = Path(rel).stem
        low = rel.lower()
        # Recall knowledge, not journal/scratch: skip planner, archives, excalidraw.
        excluded = ("/archive/" in low or "planner" in low
                    or "excalidraw" in low or low.startswith("00 "))
        if (score >= MIN_SCORE and rel.endswith(".md") and not excluded
                and stem not in seen_stems):
            seen_stems.add(stem)
            title = stem.replace("-", " ").replace("_", " ")
            hits.append((title, rel, round(score * 100)))
        if len(hits) >= MAX_HITS:
            break
    return hits


def main() -> None:
    try:
        hook = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    prompt = (hook.get("prompt") or "").strip()
    if len(prompt) < MIN_PROMPT_LEN or SKIP_RE.match(prompt):
        sys.exit(0)

    hits = search(prompt)
    if not hits:
        sys.exit(0)

    # Per-session de-dupe: don't re-surface a note already injected this session.
    cache = cache_file(hook.get("session_id", ""))
    try:
        seen = set(cache.read_text().splitlines()) if cache.exists() else set()
    except Exception:
        seen = set()
    fresh = [h for h in hits if h[1] not in seen]
    if not fresh:
        sys.exit(0)
    try:
        with cache.open("a") as f:
            for _, rel, _ in fresh:
                f.write(rel + "\n")
    except Exception:
        pass

    lines = ["Possibly relevant from your knowledge base (auto-recall — open in "
             "Obsidian or ask the concierge agent to dig in):"]
    for title, rel, score in fresh:
        lines.append(f"- **{title}** — `{rel}` ({score}%)")

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": "\n".join(lines),
        }
    }))


if __name__ == "__main__":
    main()
