#!/usr/bin/env python3
"""SessionStart hook: inject recent breadcrumbs for the current project.

Reads claude-breadcrumbs/, finds the few most recent breadcrumbs whose
`project:` frontmatter matches the current working directory's basename, and
emits their title + Summary as additionalContext so the agent starts the
session already aware of recent work. Pure stdlib, no deps. Silent (no
injection) when there's nothing relevant.
"""

import json
import os
import re
import sys
from pathlib import Path

BREADCRUMBS = Path.home() / "personal/obsidian/second-brain/claude-breadcrumbs"
MAX_NOTES = 4
SUMMARY_MAX_CHARS = 280


def project_from_cwd(cwd: str) -> str:
    return os.path.basename(os.path.normpath(cwd)) if cwd else ""


def parse(md: str) -> dict:
    """Pull project, date, title, and the Summary section out of a breadcrumb."""
    project, date = "", ""
    fm = re.match(r"^---\n(.*?)\n---\n", md, re.DOTALL)
    if fm:
        for line in fm.group(1).splitlines():
            if line.startswith("project:"):
                project = line.split(":", 1)[1].strip().strip("\"'")
            elif line.startswith("date:"):
                date = line.split(":", 1)[1].strip().strip("\"'")[:10]
    title_m = re.search(r"^#\s+(.+)$", md, re.MULTILINE)
    title = title_m.group(1).strip() if title_m else ""
    sum_m = re.search(r"^##\s+Summary\s*\n(.+?)(?:\n##\s|\Z)", md, re.DOTALL | re.MULTILINE)
    summary = " ".join(sum_m.group(1).split()) if sum_m else ""
    if len(summary) > SUMMARY_MAX_CHARS:
        summary = summary[:SUMMARY_MAX_CHARS].rstrip() + "…"
    return {"project": project, "date": date, "title": title, "summary": summary}


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    cwd = payload.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    project = project_from_cwd(cwd)
    if not project or project in {"einargudjonsson", ""} or not BREADCRUMBS.is_dir():
        return  # at home / no project / no vault — nothing useful to surface

    matches = []
    for f in BREADCRUMBS.glob("*.md"):
        try:
            info = parse(f.read_text(encoding="utf-8", errors="ignore"))
        except Exception:
            continue
        if info["project"] == project:
            # date fallback: leading YYYY-MM-DD in filename
            if not info["date"]:
                m = re.match(r"(\d{4}-\d{2}-\d{2})", f.name)
                info["date"] = m.group(1) if m else ""
            info["file"] = f.name
            matches.append(info)

    if not matches:
        return
    matches.sort(key=lambda x: x["date"], reverse=True)
    top = matches[:MAX_NOTES]

    lines = [
        f"Recent session breadcrumbs for **{project}** "
        f"({len(matches)} on file, newest {len(top)} shown). "
        f"Read the full note in `claude-breadcrumbs/` if relevant:",
        "",
    ]
    for n in top:
        head = f"- **{n['date']} — {n['title'] or n['file']}**"
        lines.append(head)
        if n["summary"]:
            lines.append(f"  {n['summary']}")
    context = "\n".join(lines)

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
