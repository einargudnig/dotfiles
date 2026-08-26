#!/usr/bin/env python3
"""PostToolUseFailure hook: catch friction the moment a tool call fails.

Two layers, because mechanical detection and judgement are different problems:

  1. Every failure is appended to the inbox (JSONL, raw). Zero-miss, needs no
     cooperation from the model — this is the backstop for whatever it skips.
  2. When a failure looks like *real* friction rather than an expected red,
     the hook injects a nudge so the agent writes the curated `papercut` entry
     itself, with the context only it has.

Noise control is the whole game here. A nudge on every failed grep would train
the agent to ignore nudges, so the benign list below is deliberately wide, and
nudges are deduped and capped per session.

Always exits 0: a friction logger must never become friction.
"""

import json
import os
import re
import sys
import time
from pathlib import Path

HOME = Path.home()
INBOX = Path(os.environ.get("PAPERCUT_INBOX", HOME / ".claude" / "papercut-inbox.jsonl"))
STATE_DIR = HOME / ".claude" / "cache" / "papercut-sessions"
MAX_NUDGES_PER_SESSION = 5

# Failures that are a normal part of working, not friction worth recording.
BENIGN_COMMAND = re.compile(
    r"""
    ^\s*(
        (rg|grep|ag|fd|find|ls)\b            # search that found nothing
      | (test|\[)\s                          # shell conditionals
      | command\s+-v\b | which\b | type\b     # capability probes
      | git\s+(rev-parse|diff\s+--quiet|check-ignore|show-ref|merge-base)\b
      | (npm|pnpm|bun|bunx|yarn|npx|deno)\s+(run\s+|exec\s+|dlx\s+|x\s+)?
        (test|lint|typecheck|check|tsc|vitest|jest|pytest|oxlint|eslint|biome)\b
      | (vitest|jest|pytest|tsc|oxlint|eslint|biome|ruff|mypy|cargo\s+(test|clippy))\b
      | diff\b | cmp\b
    )
    """,
    re.VERBOSE,
)

# Substrings in a command that mean "I am deliberately probing for absence".
BENIGN_ANYWHERE = ("|| true", "2>/dev/null", "|| echo", "--dry-run")

# Error text that reflects a user/policy choice rather than broken tooling.
BENIGN_ERROR = (
    "user denied",
    "permission denied by user",
    "requested permissions",
    "operation was aborted",
    "user rejected",
)


def read_state(session_id):
    path = STATE_DIR / f"{session_id}.json"
    try:
        return json.loads(path.read_text())
    except Exception:
        return {"nudges": 0, "seen": []}


def write_state(session_id, state):
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        (STATE_DIR / f"{session_id}.json").write_text(json.dumps(state))
    except Exception:
        pass


def detect_model(transcript_path):
    """The model actually running, straight from the transcript the hook names."""
    try:
        lines = Path(transcript_path).read_text(errors="ignore").splitlines()
    except Exception:
        return "unknown"
    for line in reversed(lines[-400:]):
        try:
            model = (json.loads(line).get("message") or {}).get("model")
        except Exception:
            continue
        if model:
            return model
    return "unknown"


def signature(tool, cmd):
    """Collapse near-identical retries so one stubborn command nudges once."""
    normalized = re.sub(r"\s+", " ", cmd)[:120]
    return tool + ":" + normalized


def is_friction(tool, cmd, error, stderr):
    blob = (error + "\n" + stderr).lower()
    if any(b in blob for b in BENIGN_ERROR):
        return False
    if tool in ("Grep", "Glob"):  # "found nothing" is an answer, not a failure
        return False
    if tool == "Bash":
        # Strip any leading path so ./node_modules/.bin/tsc matches plain tsc.
        bare = re.sub(r"^\s*\S*/(?=[\w.-]+(\s|$))", "", cmd)
        if BENIGN_COMMAND.search(bare) or any(b in cmd for b in BENIGN_ANYWHERE):
            return False
    return True


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return

    tool = data.get("tool_name", "")
    tool_input = data.get("tool_input") or {}
    cmd = tool_input.get("command") or tool_input.get("file_path") or tool_input.get("pattern") or ""
    error = str(data.get("error") or "")
    stderr = str(data.get("stderr") or "")
    session_id = data.get("session_id") or "unknown"
    cwd = data.get("cwd") or ""

    # Layer 1 — record everything, always.
    try:
        INBOX.parent.mkdir(parents=True, exist_ok=True)
        with INBOX.open("a") as fh:
            fh.write(json.dumps({
                "at": time.strftime("%Y-%m-%d %H:%M %z"),
                "tool": tool,
                "cmd": str(cmd)[:500],
                "error": error[:500],
                "stderr": stderr[:500],
                "model": detect_model(data.get("transcript_path", "")),
                "cwd": cwd,
                "repo": Path(cwd).name if cwd else "",
                "agent": data.get("agent_type") or "main",
                "session": session_id,
            }) + "\n")
    except Exception:
        pass

    # Layer 2 — nudge only when it reads as real friction, and only rarely.
    if not is_friction(tool, str(cmd), error, stderr):
        return

    state = read_state(session_id)
    sig = signature(tool, str(cmd))
    if sig in state["seen"] or state["nudges"] >= MAX_NUDGES_PER_SESSION:
        return
    state["seen"].append(sig)
    state["nudges"] += 1
    write_state(session_id, state)

    nudge = (
        f"Papercut check — `{tool}` just failed: {(error or stderr)[:200]}\n"
        "If that was environment friction (bad docs, flaky command, misleading error, "
        "missing setup) rather than something you expected, log it now in one call:\n"
        '  papercut "what you tried, what happened" -t <tool|setup|flaky|error|docs|perf> '
        '-f "what worked instead"\n'
        "If it was expected, ignore this and carry on. Either way, do not mention this to the user."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUseFailure",
            "additionalContext": nudge,
        },
        "suppressOutput": True,
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
