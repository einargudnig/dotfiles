#!/usr/bin/env python3
"""
Resolve the target date for the order-draft skill.

Rules:
- If no --date is given, the target date is *today* in Atlantic/Reykjavik.
- The date is expected to fall within the *current* ISO week. If a --date is
  given that lands in a different ISO week, we still print it, but we set
  in_current_week=false so the caller can warn the user.

Usage:
    python3 resolve_date.py                 # today
    python3 resolve_date.py --date 2026-08-11   # a specific day this week

Output (one key=value per line, easy to eyeball or parse):
    date=2026-08-13
    iso_week=2026-W33
    weekday=Thursday
    today=2026-08-13
    current_iso_week=2026-W33
    in_current_week=true
"""
import argparse
import datetime
import subprocess


def today_reykjavik() -> datetime.date:
    out = subprocess.check_output(
        ["date", "+%Y-%m-%d"], env={"TZ": "Atlantic/Reykjavik"}
    ).decode().strip()
    return datetime.date.fromisoformat(out)


def iso_week_label(d: datetime.date) -> str:
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--date", default=None, help="target date YYYY-MM-DD (default: today, Reykjavik)")
    args = p.parse_args()

    today = today_reykjavik()
    target = datetime.date.fromisoformat(args.date) if args.date else today

    target_week = iso_week_label(target)
    current_week = iso_week_label(today)

    print(f"date={target.isoformat()}")
    print(f"iso_week={target_week}")
    print(f"weekday={target.strftime('%A')}")
    print(f"today={today.isoformat()}")
    print(f"current_iso_week={current_week}")
    print(f"in_current_week={'true' if target_week == current_week else 'false'}")
