#!/usr/bin/env python3
"""Lint a Johnny Decimal inventory for structural defects.

Input is a plain text file. Lines beginning with '#' declare the category
being listed; every other non-empty line is one entry, number first:

    # 22 Umbudir birgjar
    22.01 Garri
    22.02 Fastus
    22.02 Vesture
    # 23 Adrir birgjar
    23.01 Plastplan

Everything after the number is treated as the title. Entries with no leading
number are reported as unnumbered rather than skipped -- those are usually the
most actionable finding in a real audit.

Optionally declare the area range so out-of-range categories are caught:

    ## AREA 20-29 Birgjar

Usage:
    python3 jd_lint.py inventory.txt
    python3 jd_lint.py inventory.txt --json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict

ID_RE = re.compile(r"^(\d{2})\.(\d{2})\b[ \t]*(.*)$")
TRAILING_ID_RE = re.compile(r"\b(\d{2}\.\d{2})\s*$")
CATEGORY_RE = re.compile(r"^#\s*(\d{2})\.?\s*(.*)$")
AREA_RE = re.compile(r"^##\s*AREA\s*(\d)0-(\d)9\s*(.*)$", re.IGNORECASE)


def parse(lines):
    """Return (areas, categories) where categories is an ordered list of dicts."""
    areas = []
    categories = []
    current = None
    current_area = None

    for lineno, raw in enumerate(lines, 1):
        line = raw.rstrip("\n")
        if not line.strip():
            continue

        m = AREA_RE.match(line.strip())
        if m:
            current_area = {
                "start": int(m.group(1)) * 10,
                "end": int(m.group(2)) * 10 + 9,
                "title": m.group(3).strip(),
                "line": lineno,
            }
            areas.append(current_area)
            continue

        if line.lstrip().startswith("#"):
            m = CATEGORY_RE.match(line.strip())
            if not m:
                # A comment header we can't parse -- treat as an unnamed section.
                current = {
                    "number": None,
                    "title": line.strip("# ").strip(),
                    "line": lineno,
                    "area": current_area,
                    "entries": [],
                }
            else:
                current = {
                    "number": int(m.group(1)),
                    "title": m.group(2).strip(),
                    "line": lineno,
                    "area": current_area,
                    "entries": [],
                }
            categories.append(current)
            continue

        if current is None:
            current = {
                "number": None,
                "title": "(no category header)",
                "line": lineno,
                "area": current_area,
                "entries": [],
            }
            categories.append(current)

        text = line.strip()
        m = ID_RE.match(text)
        if m:
            current["entries"].append(
                {
                    "cat": int(m.group(1)),
                    "seq": int(m.group(2)),
                    "id": f"{m.group(1)}.{m.group(2)}",
                    "title": m.group(3).strip(),
                    "raw": text,
                    "line": lineno,
                }
            )
        else:
            current["entries"].append(
                {
                    "cat": None,
                    "seq": None,
                    "id": None,
                    "title": text,
                    "raw": text,
                    "line": lineno,
                }
            )

    return areas, categories


def lint(categories):
    findings = []

    def add(severity, kind, where, message):
        findings.append(
            {"severity": severity, "kind": kind, "where": where, "message": message}
        )

    for cat in categories:
        cname = (
            f"{cat['number']:02d} {cat['title']}".strip()
            if cat["number"] is not None
            else cat["title"]
        )

        # Category number outside its declared area.
        if cat["number"] is not None and cat["area"]:
            if not (cat["area"]["start"] <= cat["number"] <= cat["area"]["end"]):
                add(
                    "high",
                    "category-out-of-area",
                    cname,
                    f"category {cat['number']:02d} sits in area "
                    f"{cat['area']['start']}-{cat['area']['end']} "
                    f"({cat['area']['title']})",
                )

        numbered = [e for e in cat["entries"] if e["id"]]

        if cat["number"] is not None and not cat["entries"]:
            add("low", "empty-category", cname, "no entries")

        # Duplicates.
        by_id = defaultdict(list)
        for e in numbered:
            by_id[e["id"]].append(e)
        for jd_id, group in sorted(by_id.items()):
            if len(group) > 1:
                titles = " | ".join(g["title"] or "(no title)" for g in group)
                add("high", "duplicate-id", cname, f"{jd_id} used {len(group)}x: {titles}")

        # Wrong category prefix.
        if cat["number"] is not None:
            for e in numbered:
                if e["cat"] != cat["number"]:
                    add(
                        "high",
                        "id-outside-category",
                        cname,
                        f"{e['id']} {e['title']} is filed under "
                        f"{cat['number']:02d}",
                    )

        # Unnumbered entries.
        for e in cat["entries"]:
            if e["id"]:
                continue
            trailing = TRAILING_ID_RE.search(e["title"])
            if trailing:
                add(
                    "medium",
                    "number-at-end",
                    cname,
                    f"'{e['title']}' -- number {trailing.group(1)} belongs at the front",
                )
            else:
                add("medium", "unnumbered", cname, f"'{e['title']}' has no JD number")

        # Cosmetic damage.
        for e in numbered:
            if not e["title"]:
                add("medium", "no-title", cname, f"{e['id']} has a number but no title")
                continue
            if e["raw"] != e["raw"].strip() or e["title"] != e["title"].strip():
                add("low", "whitespace", cname, f"{e['id']} has stray whitespace")
            if "**" in e["title"] or "__" in e["title"]:
                add("low", "markdown-in-title", cname, f"{e['id']} {e['title']}")

        # Gaps. Reported as informational only: in this workspace a gap normally
        # means a retired number, which must stay retired.
        if numbered:
            seqs = sorted({e["seq"] for e in numbered if e["cat"] == cat["number"]})
            if seqs:
                missing = [s for s in range(seqs[0], seqs[-1]) if s not in seqs]
                if missing:
                    shown = ", ".join(f"{cat['number']:02d}.{s:02d}" for s in missing[:12])
                    more = f" (+{len(missing) - 12} more)" if len(missing) > 12 else ""
                    add(
                        "info",
                        "gap",
                        cname,
                        f"unused: {shown}{more} -- do not reuse; next free is "
                        f"{cat['number']:02d}.{seqs[-1] + 1:02d}",
                    )
                add(
                    "info",
                    "next-free",
                    cname,
                    f"next free number is {cat['number']:02d}.{seqs[-1] + 1:02d}",
                )

    return findings


ORDER = {"high": 0, "medium": 1, "low": 2, "info": 3}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inventory", help="path to the inventory text file, or - for stdin")
    ap.add_argument("--json", action="store_true", help="emit JSON instead of text")
    args = ap.parse_args()

    if args.inventory == "-":
        lines = sys.stdin.readlines()
    else:
        with open(args.inventory, encoding="utf-8") as fh:
            lines = fh.readlines()

    _areas, categories = parse(lines)
    findings = lint(categories)
    findings.sort(key=lambda f: (ORDER[f["severity"]], f["where"], f["kind"]))

    entry_count = sum(len(c["entries"]) for c in categories)

    if args.json:
        print(
            json.dumps(
                {
                    "categories": len(categories),
                    "entries": entry_count,
                    "findings": findings,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    print(f"{entry_count} entries across {len(categories)} categories")
    real = [f for f in findings if f["severity"] != "info"]
    print(f"{len(real)} findings ({len(findings) - len(real)} informational)\n")

    last = None
    for f in findings:
        if f["severity"] != last:
            print(f"-- {f['severity'].upper()} --")
            last = f["severity"]
        print(f"  [{f['kind']}] {f['where']}: {f['message']}")

    return 1 if any(f["severity"] == "high" for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main())
