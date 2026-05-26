#!/usr/bin/env python3
"""SessionEnd hook: auto-capture a breadcrumb for substantial sessions.

The automatic counterpart to `/done`. On session end it parses the transcript,
decides whether the session was substantial, and — if so — spawns a detached
`claude -p` that reads the transcript and writes ONE flat breadcrumb into
claude-breadcrumbs/ in the /done format. Trivial sessions are skipped.

Guards:
  - Skips if a breadcrumb was already written this session (i.e. /done or
    /memento ran) — this also prevents the spawned agent from recursing, since
    its own transcript shows a write into claude-breadcrumbs/.
  - Skips sessions with < 2 exchanges.

Pure stdlib. Set MEMENTO_DRYRUN=1 to print the decision + command instead of
spawning.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

CONFIG = Path.home() / ".config/memento-vault/memento.yml"
DEFAULTS = {
    "vault_path": str(Path.home() / "personal/obsidian/second-brain"),
    "exchange_threshold": 15,
    "file_count_threshold": 3,
    "notable_patterns": ["plan", "design", "MEMORY.md", "CLAUDE.md", "SKILL.md"],
    "agent_model": "sonnet",
}
BREADCRUMB_MARKER = "claude-breadcrumbs"


def load_config() -> dict:
    """Minimal line reader for the few memento.yml keys we need (no yaml dep)."""
    cfg = dict(DEFAULTS)
    if not CONFIG.is_file():
        return cfg
    for raw in CONFIG.read_text(errors="ignore").splitlines():
        line = raw.split("#", 1)[0].rstrip()
        m = re.match(r"^(\w+):\s*(.+)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if key in ("exchange_threshold", "file_count_threshold"):
            try:
                cfg[key] = int(val)
            except ValueError:
                pass
        elif key == "notable_patterns":
            cfg[key] = [v.strip().strip("\"'") for v in val.strip("[]").split(",") if v.strip()]
        elif key in ("vault_path", "agent_model"):
            cfg[key] = val.strip("\"'").replace("~", str(Path.home()))
    return cfg


def parse_transcript(path: str) -> dict:
    users = assistants = 0
    files_edited: set[str] = set()
    wrote_breadcrumb = False
    branch = cwd = first_prompt = None
    with open(path, errors="ignore") as f:
        for line in f:
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            cwd = cwd or e.get("cwd")
            branch = branch or e.get("gitBranch")
            t = e.get("type")
            if t == "user":
                users += 1
                content = e.get("message", {}).get("content", "")
                if isinstance(content, str) and not first_prompt:
                    cleaned = re.sub(r"<[^>]+>.*?</[^>]+>", "", content, flags=re.DOTALL).strip()
                    if cleaned:
                        first_prompt = cleaned[:200]
            elif t == "assistant":
                assistants += 1
                for block in e.get("message", {}).get("content", []) or []:
                    if isinstance(block, dict) and block.get("type") == "tool_use" \
                       and block.get("name") in ("Edit", "Write"):
                        fp = block.get("input", {}).get("file_path", "")
                        if fp:
                            files_edited.add(fp)
                            if BREADCRUMB_MARKER in fp:
                                wrote_breadcrumb = True
    return {
        "cwd": cwd,
        "branch": branch,
        "first_prompt": first_prompt,
        "exchanges": min(users, assistants),
        "files_edited": sorted(files_edited),
        "wrote_breadcrumb": wrote_breadcrumb,
    }


def is_substantial(meta: dict, cfg: dict) -> bool:
    if meta["exchanges"] > cfg["exchange_threshold"]:
        return True
    if len(meta["files_edited"]) > cfg["file_count_threshold"]:
        return True
    return any(p in f for f in meta["files_edited"] for p in cfg["notable_patterns"])


def build_prompt(transcript_path: str, meta: dict, breadcrumbs: Path) -> str:
    return f"""You are an automatic session-capture agent. A Claude Code session just ended; write ONE breadcrumb summarising it.

Transcript (JSONL): {transcript_path}
Project: {meta['cwd']}
Branch: {meta.get('branch') or 'none'}
Files edited: {json.dumps(meta['files_edited'])}

Steps:
1. Read the transcript at the path above to understand what happened.
2. Follow the note format in ~/.claude/skills/done/SKILL.md EXACTLY (frontmatter + Summary, Topics, Key Decisions, Code Changes, Q&A, Follow-ups, Learnings, Related). Omit empty sections.
3. Write the breadcrumb to {breadcrumbs}/ as {{date}}_{{branch-or-topic}}.md (append -2 on collision).
4. Populate the ## Related section with ONLY real [[wikilinks]] (one per line, "- [[note name]]") — search "{breadcrumbs.parent}/80 slip-box", "/40 reference", "/60 reference" for related notes. Never invent a link to a note that does not exist. If a durable concept has no home note, do NOT put it in Related — instead add it under ## Follow-ups as "- [ ] slip-box candidate: <concept>".
5. SECURITY: redact any secrets (sk-*, ghp_*, Bearer tokens, postgres:// URLs, JWTs) as [REDACTED].
6. Do NOT run `kill`, do NOT delete or overwrite other notes, do NOT create notes/ or projects/ folders. Write exactly one breadcrumb file. Then stop.
"""


def main() -> None:
    try:
        hook = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    transcript = hook.get("transcript_path")
    if not transcript or not os.path.exists(transcript):
        sys.exit(0)

    try:
        meta = parse_transcript(transcript)
    except Exception:
        sys.exit(0)
    meta["cwd"] = meta["cwd"] or hook.get("cwd")

    cfg = load_config()
    breadcrumbs = Path(cfg["vault_path"]) / "claude-breadcrumbs"

    # Guards
    if meta["exchanges"] < 2:
        sys.exit(0)
    if meta["wrote_breadcrumb"]:
        sys.exit(0)  # /done or /memento already captured (also blocks recursion)
    if not breadcrumbs.is_dir():
        sys.exit(0)
    if not is_substantial(meta, cfg):
        sys.exit(0)

    prompt = build_prompt(transcript, meta, breadcrumbs)
    cmd = [
        "claude", "--print", "--model", cfg["agent_model"],
        "--dangerously-skip-permissions", "--no-session-persistence",
        "--allowedTools", "Read", "Write", "Edit", "Glob", "Grep",
        "--add-dir", str(breadcrumbs.parent),
        "--add-dir", os.path.dirname(transcript),
        "-p", prompt,
    ]

    if os.environ.get("MEMENTO_DRYRUN"):
        print(f"DECISION: capture (exchanges={meta['exchanges']}, "
              f"files={len(meta['files_edited'])}, project={os.path.basename(meta['cwd'] or '?')})")
        print("WOULD SPAWN:", " ".join(cmd[:8]), "... -p <prompt>")
        sys.exit(0)

    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                     start_new_session=True)
    sys.exit(0)


if __name__ == "__main__":
    main()
