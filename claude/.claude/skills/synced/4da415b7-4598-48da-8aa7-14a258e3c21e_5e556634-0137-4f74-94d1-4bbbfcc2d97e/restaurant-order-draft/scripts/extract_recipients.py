#!/usr/bin/env python3
"""
Filter a listOrderItems result down to the people who ordered and did NOT
cancel, and emit their email addresses.

`mcp__Maul_Mcp__listOrderItems` returns a big JSON blob. When it's too large to
read inline it gets saved to a tool-results file — pass that file path here.
You can also pipe the JSON in on stdin.

Keep rule:
    An order is kept when its OrderItemStatus is one of --statuses
    (default: "Default,Claimed"). Every cancellation status
    (CanceledByUserBeforeCutoff, etc.) is therefore excluded.

Any *other* status that is neither kept nor an obvious cancellation is listed
under "OTHER STATUSES" so nothing is silently dropped.

Usage:
    python3 extract_recipients.py orders.json
    python3 extract_recipients.py orders.json --statuses Default,Claimed
    cat orders.json | python3 extract_recipients.py -

Output sections (in order):
    COUNT=<n kept> / EMAILS=<n unique>
    EMAILS: comma-separated unique emails (ready to paste / BCC)
    GROUPED: kept people grouped by company (name <email>)
    OTHER STATUSES: any unexpected non-kept, non-cancel statuses seen (if any)
"""
import argparse
import json
import signal
import sys

# Don't spew a traceback when output is piped into head/less and closed early.
try:
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
except (AttributeError, ValueError):
    pass


def load(path: str):
    if path == "-":
        data = json.load(sys.stdin)
    else:
        with open(path) as f:
            data = json.load(f)
    # Accept either the full response {summary,orders} or a bare list.
    if isinstance(data, list):
        return data
    return data.get("orders", [])


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("path", help="path to the listOrderItems JSON file, or '-' for stdin")
    p.add_argument("--statuses", default="Default,Claimed",
                   help="comma-separated OrderItemStatus values to KEEP (default: Default,Claimed)")
    args = p.parse_args()

    keep = {s.strip() for s in args.statuses.split(",") if s.strip()}
    orders = load(args.path)

    kept, other = [], {}
    for o in orders:
        st = o.get("OrderItemStatus")
        if st in keep:
            kept.append(o)
        elif st and not st.lower().startswith("cancel"):
            other.setdefault(st, 0)
            other[st] += 1

    # Dedupe emails, preserving first-seen order.
    seen, emails = set(), []
    for o in kept:
        e = (o.get("Email") or "").strip()
        if e and e.lower() not in seen:
            seen.add(e.lower())
            emails.append(e)

    print(f"COUNT={len(kept)}  EMAILS={len(emails)}")
    print()
    print("EMAILS:")
    print(", ".join(emails))
    print()
    print("GROUPED:")
    kept.sort(key=lambda x: ((x.get("CompanyName") or x.get("AccountName") or ""),
                             (x.get("Username") or "")))
    last = None
    for o in kept:
        c = o.get("CompanyName") or o.get("AccountName") or "(no company)"
        if c != last:
            print(f"\n== {c} ==")
            last = c
        print(f" - {o.get('Username')}  <{(o.get('Email') or '').strip()}>")

    if other:
        print()
        print("OTHER STATUSES (not kept, not a cancellation — review these):")
        for st, n in sorted(other.items()):
            print(f" - {st}: {n}")
