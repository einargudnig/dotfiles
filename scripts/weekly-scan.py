#!/usr/bin/env python3
"""Weekly scan: the drift check this setup keeps needing.

Facts, not narrative. It answers the questions that were only answered by
accident this month: does every repo have a remote, does a handover doc still
describe the branch it claims to describe, is a branch quietly unmerged, do the
hooks point at files that exist, is the scheduler still ticking.

Writes `weekly-reviews/<date>_weekly-scan.md` in the vault and commits + pushes
it. Prints only the findings, so a Hermes cron job with `--no-agent` stays
silent on a clean week.

  weekly-scan.py            # write, commit, push
  weekly-scan.py --dry-run  # print everything, touch nothing
  weekly-scan.py --no-push  # write and commit, leave the push to a session
"""
from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path

HOME = Path.home()
VAULT = Path(os.environ.get("WEEKLY_SCAN_VAULT", HOME / "personal/obsidian/second-brain"))
# Where the Lumen (life-os) hub credentials live. Deliberately a file and not env
# vars: the scheduler does not inherit a shell, and a 600 file beats a token in a
# launchd plist.
HUB_ENV = Path(os.environ.get("WEEKLY_SCAN_HUB_ENV", HOME / ".config/life-os/hub.env"))
HUB_TIMEOUT = 5
OUT_DIR = VAULT / "weekly-reviews"

# Repo roots to scan: one level, plus one level under personal/ and work/.
ROOTS = [HOME / "dotfiles", HOME / "mac-mini-lean"]
for base in (HOME / "personal", HOME / "work", HOME):
    ROOTS.extend(p for p in base.glob("*") if p.is_dir())

HANDOVER_DOCS = ("NEXT.md", "next.md", "progress.md", "PROGRESS.md")
STALE_BRANCH_DAYS = 30
STALE_DOC_DAYS = 7
MAIN_NAMES = {"main", "master"}
GIT_TIMEOUT = 20


def git(repo: Path, *args: str) -> str | None:
    """Run git in `repo`, returning stdout or None when it fails."""
    try:
        out = subprocess.run(
            ["git", "-C", str(repo), *args],
            capture_output=True,
            text=True,
            timeout=GIT_TIMEOUT,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    return out.stdout.strip() if out.returncode == 0 else None


@dataclass
class Repo:
    path: Path
    name: str
    branch: str = ""
    last_commit: int = 0
    commits_7d: int = 0
    dirty: int = 0
    remote: str = ""
    stale_branches: list[tuple[str, int]] = field(default_factory=list)
    stale_docs: list[tuple[str, int]] = field(default_factory=list)


def inspect(path: Path) -> Repo | None:
    if git(path, "rev-parse", "--is-inside-work-tree") != "true":
        return None

    # Resolve symlinks (.claude, agent -> dotfiles) so one repo is not counted three times.
    top = git(path, "rev-parse", "--show-toplevel")
    root = Path(top).resolve() if top else path.resolve()
    repo = Repo(path=root, name=root.name)
    repo.branch = git(path, "rev-parse", "--abbrev-ref", "HEAD") or "?"

    last = git(path, "log", "-1", "--format=%ct")
    repo.last_commit = int(last) if last and last.isdigit() else 0

    count = git(path, "rev-list", "--count", "--since=7.days", "HEAD")
    repo.commits_7d = int(count) if count and count.isdigit() else 0

    status = git(path, "status", "--porcelain")
    repo.dirty = len([line for line in (status or "").splitlines() if line.strip()])

    repo.remote = git(path, "remote", "get-url", "origin") or ""

    # Unmerged remote branches that have gone quiet — the shape of work that
    # stops being work and starts being an artefact.
    default_ref = git(path, "symbolic-ref", "--quiet", "refs/remotes/origin/HEAD") or ""
    refs = git(
        path,
        "for-each-ref",
        "--format=%(refname:lstrip=3)\t%(committerdate:unix)",
        "refs/remotes/origin/*",
    )
    cutoff = time.time() - STALE_BRANCH_DAYS * 86_400
    for line in (refs or "").splitlines():
        if "\t" not in line:
            continue
        short, ts = line.rsplit("\t", 1)
        if short in MAIN_NAMES or short == "HEAD" or not ts.isdigit():
            continue
        if int(ts) >= cutoff:
            continue
        # Only work that is actually still outstanding, not history.
        merged = default_ref and git(
            path, "merge-base", "--is-ancestor", f"refs/remotes/origin/{short}", default_ref
        )
        if merged is not None:
            continue
        repo.stale_branches.append((short, int(ts)))

    # A handover doc last touched long before the code it describes is the doc
    # that told us the wrong thing about nido for three months.
    for doc in HANDOVER_DOCS:
        if not (path / doc).exists():
            continue
        ts = git(path, "log", "-1", "--format=%ct", "--", doc)
        if not ts or not ts.isdigit():
            continue  # untracked doc
        lag = repo.last_commit - int(ts)
        if lag > STALE_DOC_DAYS * 86_400:
            repo.stale_docs.append((doc, lag))

    return repo


def hook_findings() -> list[str]:
    """Hook commands that point at files which no longer exist."""
    settings = HOME / ".claude/settings.json"
    if not settings.exists():
        return []
    try:
        data = json.loads(settings.read_text())
    except (OSError, json.JSONDecodeError):
        return ["settings.json is not valid JSON — every hook is off"]

    broken = []
    for event, entries in data.get("hooks", {}).items():
        for entry in entries:
            for hook in entry.get("hooks", []):
                for raw in re.findall(r"(?:\$HOME|~)/[^\s\"']+", hook.get("command", "")):
                    path = Path(os.path.expandvars(os.path.expanduser(raw)))
                    if not path.exists():
                        broken.append(f"{event}: {raw}")
    return broken


def scheduler_findings() -> list[str]:
    """Is the thing that runs the schedule still alive?"""
    findings = []
    ticker = HOME / ".hermes/cron/ticker_last_success"
    if ticker.exists():
        try:
            age = time.time() - float(ticker.read_text().strip())
        except (OSError, ValueError):
            age = None
        if age is not None and age > 3600:
            findings.append(f"Hermes cron ticker last succeeded {hours(age)} ago")
    else:
        findings.append("Hermes cron ticker has never succeeded")

    for label in ("ai.hermes.gateway", "com.einargudjonsson.tmux-prune"):
        probe = subprocess.run(
            ["launchctl", "print", f"system/{label}"], capture_output=True, text=True
        )
        if probe.returncode != 0:
            findings.append(f"LaunchDaemon {label} is not loaded")
    return findings


def hours(seconds: float) -> str:
    if seconds < 3600:
        return f"{int(seconds / 60)}m"
    if seconds < 86_400:
        return f"{int(seconds / 3600)}h"
    return f"{int(seconds / 86_400)}d"


def vault_state() -> tuple[int, int]:
    """(uncommitted files, unpushed commits) in the vault."""
    status = git(VAULT, "status", "--porcelain") or ""
    dirty = len([line for line in status.splitlines() if line.strip()])
    ahead = git(VAULT, "rev-list", "--count", "@{u}..HEAD")
    return dirty, int(ahead) if ahead and ahead.isdigit() else 0


def repo_findings(repos: list[Repo], now: date) -> list[str]:
    findings = []
    for repo in repos:
        if not repo.remote:
            findings.append(f"**{repo.name}** has no git remote — it exists on this disk only")
        if repo.dirty:
            findings.append(f"**{repo.name}** has {repo.dirty} uncommitted change(s)")
        for doc, lag in repo.stale_docs:
            findings.append(
                f"**{repo.name}/{doc}** was last touched {lag // 86_400} days before the "
                f"code it describes — check it still tells the truth"
            )
        for branch, ts in repo.stale_branches:
            age = (now - date.fromtimestamp(ts)).days
            findings.append(
                f"**{repo.name}** branch `{branch}` is unmerged and quiet for {age} days"
            )
        if repo.last_commit and (now - date.fromtimestamp(repo.last_commit)).days >= 30:
            findings.append(
                f"**{repo.name}** has had no commits since "
                f"{date.fromtimestamp(repo.last_commit).isoformat()}"
            )
    return findings


def render(repos: list[Repo], findings: list[str], now: date) -> str:
    since = now - timedelta(days=7)
    lines = [
        "---",
        f"date: {now.isoformat()}",
        "type: weekly-scan",
        f"period: {since.isoformat()} to {now.isoformat()}",
        "tags:",
        "  - weekly-scan",
        "  - automated",
        "---",
        "",
        f"# Weekly scan — {since.isoformat()} to {now.isoformat()}",
        "",
        "Facts only, generated by `weekly-scan.py`. For the written review, run `/weekly-review`.",
        "",
        "## Needs attention",
        "",
    ]
    lines += [f"- {f}" for f in findings] or ["Nothing. Every repo has a remote, the docs are younger than the code, and the scheduler is ticking."]

    lines += ["", "## Repos", "", "| repo | last commit | 7d | branch | dirty | remote |", "|---|---|---|---|---|---|"]
    for repo in sorted(repos, key=lambda r: r.last_commit, reverse=True):
        last = date.fromtimestamp(repo.last_commit).isoformat() if repo.last_commit else "—"
        remote = "github" if "github.com" in repo.remote else ("none" if not repo.remote else "other")
        lines.append(
            f"| {repo.name} | {last} | {repo.commits_7d} | {repo.branch} | "
            f"{repo.dirty or ''} | {remote} |"
        )

    dirty, ahead = vault_state()
    lines += [
        "",
        "## Health",
        "",
        f"- Vault: {dirty} uncommitted file(s), {ahead} unpushed commit(s)",
        f"- Hermes cron ticker: {ticker_age()}",
        "",
    ]
    return "\n".join(lines)


def ticker_age() -> str:
    ticker = HOME / ".hermes/cron/ticker_last_success"
    try:
        return f"last success {hours(time.time() - float(ticker.read_text().strip()))} ago"
    except (OSError, ValueError):
        return "no heartbeat file"


def read_hub_config() -> dict[str, str]:
    """LIFEOS_HUB_URL / LIFEOS_INGEST_TOKEN, or {} when not configured."""
    if not HUB_ENV.exists():
        return {}
    config = {}
    for line in HUB_ENV.read_text(errors="ignore").splitlines():
        line = line.split("#", 1)[0].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        config[key.strip()] = value.strip().strip("\"'")
    return config


def post_to_hub(findings: list[str], report: str, now: date) -> str | None:
    """Push the scan into Lumen's log hub. Returns a status line, or None if unconfigured.

    Lumen's only generic write surface today is POST /v1/logs, so a scan lands as one
    structured event (project `mac-mini`, event `weekly_scan`) and shows up in the Logs
    view. A dedicated Reviews view would need a life-os endpoint; this needs nothing.
    """
    config = read_hub_config()
    url = config.get("LIFEOS_HUB_URL", "").rstrip("/")
    token = config.get("LIFEOS_INGEST_TOKEN", "")
    if not url or not token:
        return None

    payload = {
        "project": "mac-mini",
        "events": [
            {
                "event": "weekly_scan",
                "level": "warn" if findings else "info",
                "ts": int(time.time() * 1000),
                "fields": {
                    "findings": len(findings),
                    # Plain text and a vault-relative path: the log is read from
                    # another machine, where an absolute path means nothing.
                    "items": [f.replace("**", "") for f in findings],
                    "report": str(Path(report).relative_to(VAULT)),
                    "period": f"{(now - timedelta(days=7)).isoformat()} to {now.isoformat()}",
                },
            }
        ],
    }
    request = urllib.request.Request(
        f"{url}/v1/logs",
        data=json.dumps(payload).encode(),
        headers={"content-type": "application/json", "authorization": f"Bearer {token}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=HUB_TIMEOUT) as response:
            return f"lumen: logged weekly_scan ({response.status})"
    except (urllib.error.URLError, OSError, ValueError) as error:
        # Never fail the scan because the hub is unreachable — the vault copy is the
        # record, and next week's run is the retry.
        return f"lumen: post failed ({error})"


def publish(text: str, now: date, push: bool) -> str:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = OUT_DIR / f"{now.isoformat()}_weekly-scan.md"
    target.write_text(text)

    git(VAULT, "pull", "--rebase", "--autostash")
    git(VAULT, "add", str(target.relative_to(VAULT)))
    if git(VAULT, "diff", "--cached", "--quiet") is None:
        git(VAULT, "commit", "-m", f"weekly scan: {now.isoformat()}")
        if push and git(VAULT, "push") is None:
            # The vault is written from more than one machine — the hourly
            # "vault backup" commits come from elsewhere. One rebase and retry
            # is the difference between a lost report and a queued one.
            git(VAULT, "pull", "--rebase", "--autostash")
            git(VAULT, "push")
    return str(target)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="print, write nothing")
    parser.add_argument("--no-push", action="store_true", help="commit but do not push")
    parser.add_argument("--no-post", action="store_true", help="skip the Lumen hub post")
    args = parser.parse_args()

    now = date.today()
    seen: set[Path] = set()
    repos: list[Repo] = []
    for root in ROOTS:
        if root.parent == root:
            continue
        repo = inspect(root)
        if repo and repo.path not in seen:
            seen.add(repo.path)
            repos.append(repo)

    findings = repo_findings(repos, now) + hook_findings() + scheduler_findings()
    text = render(repos, findings, now)

    if args.dry_run:
        print(text)
        return 0

    path = publish(text, now, push=not args.no_push)
    print(f"wrote {path}", file=sys.stderr)
    if not args.no_post:
        status = post_to_hub(findings, path, now)
        if status:
            print(status, file=sys.stderr)
    # stdout is what the scheduler delivers: findings only, silent when clean.
    if findings:
        print(f"Weekly scan — {len(findings)} thing(s) need attention:")
        for finding in findings:
            print(f"- {finding}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
