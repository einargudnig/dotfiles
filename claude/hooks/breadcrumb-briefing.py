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
import shutil
import subprocess
import sys
from pathlib import Path

VAULT = Path.home() / "personal/obsidian/second-brain"
BREADCRUMBS = VAULT / "claude-breadcrumbs"
MAX_NOTES = 4
MAX_KNOWLEDGE = 3
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


def knowledge_notes(project: str) -> list[tuple[str, str]]:
    """Ask qmd for slip-box / reference notes relevant to this project.

    Returns [(title, vault-relative-path)]. Empty list on any failure — this is
    a best-effort enrichment, never a blocker. Breadcrumbs/weekly-reviews/planner
    are excluded so this complements (not duplicates) the breadcrumb section.
    """
    if not shutil.which("qmd"):
        return []
    try:
        # BM25 search only — fast, and needs neither embeddings nor the query
        # expansion model (which `qmd query` would download). Safe in a hook.
        out = subprocess.run(
            ["qmd", "search", project, "-c", "second-brain", "-n", "12"],
            capture_output=True, text=True, timeout=6,
        ).stdout
    except Exception:
        return []

    seen, results = set(), []
    for raw in re.findall(r"[^\s'\"]+\.md", out):
        # Normalise qmd:// URIs and absolute paths to a vault-relative path
        rel = raw.split("second-brain/", 1)[-1].strip("/")
        low = rel.lower()
        if "slip-box" not in low and "reference" not in low:
            continue  # only durable knowledge, not logs
        if rel in seen:
            continue
        seen.add(rel)
        results.append((Path(rel).stem, rel))
        if len(results) >= MAX_KNOWLEDGE:
            break
    return results


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

    lines: list[str] = []

    if matches:
        matches.sort(key=lambda x: x["date"], reverse=True)
        top = matches[:MAX_NOTES]
        lines.append(
            f"Recent session breadcrumbs for **{project}** "
            f"({len(matches)} on file, newest {len(top)} shown). "
            f"Read the full note in `claude-breadcrumbs/` if relevant:"
        )
        lines.append("")
        for n in top:
            lines.append(f"- **{n['date']} — {n['title'] or n['file']}**")
            if n["summary"]:
                lines.append(f"  {n['summary']}")

    knowledge = knowledge_notes(project)
    if knowledge:
        if lines:
            lines.append("")
        lines.append(
            "Possibly relevant notes from your knowledge base "
            "(slip-box / reference). Open or ask the concierge agent to dig in:"
        )
        for title, rel in knowledge:
            lines.append(f"- **{title}** — `{rel}`")

    if not lines:
        return

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": "\n".join(lines),
        }
    }))


if __name__ == "__main__":
    main()
