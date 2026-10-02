#!/usr/bin/env python3
"""
Maul dinner/lunch ordering-window check.

Maul's cutoff rule, as given by ops:

- Dinner can be ordered the same day, up until 16:00 local time.
- Lunch is always ordered a day ahead: the order for tomorrow's lunch has to
  arrive before 16:00 today. Lunch can never be placed for the same day, no
  matter how early in the day it is.

Both halves collapse into one formula: the cutoff for a given (meal, date) is

    Dinner -> that date at 16:00
    Lunch  -> the day BEFORE that date, at 16:00

...and the line is orderable exactly when `now <= cutoff`. Same-day lunch
falls out of this automatically: its cutoff is yesterday's 16:00, which has
already passed by the time "today" exists, so it never needs a special case.

Usage:
    python3 check_cutoff.py --meal Dinner --date 2026-08-26
    python3 check_cutoff.py --meal Lunch  --date 2026-08-27 --now 2026-08-26T15:30
    python3 check_cutoff.py --meal Lunch  --date 2026-08-26   # always past-cutoff

`--now` is optional and defaults to the real current time in
Atlantic/Reykjavik. Pass it explicitly only to check a hypothetical, or in a
test — never to override the real clock for an actual reply.

Prints one JSON object to stdout. Fields:
    meal, date, cutoff (ISO, Reykjavik), now (ISO, Reykjavik),
    status:  "ok"                    -> still inside the ordering window
             "date_in_past"          -> the requested date has already happened
             "dinner_cutoff_passed"  -> today's dinner, but it's after 16:00
             "lunch_cutoff_passed"   -> tomorrow's lunch, but it's after 16:00 today
             "lunch_same_day"        -> lunch requested for today (always closed;
                                        reported as its own status even though the
                                        cutoff math already catches it, because the
                                        customer-facing reason is different wording)
    same_day_dinner: true when this is a same-day dinner request that is still
                     inside the window -- worth a slightly different tone in the
                     reply ("we've let the kitchen know") than an ordinary
                     ordered-ahead dinner.
    minutes_to_cutoff: minutes remaining until the cutoff, negative if passed.
"""
import argparse
import json
import sys
from datetime import date, datetime, time, timedelta

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - Python < 3.9 fallback
    print(json.dumps({"error": "zoneinfo unavailable; Python 3.9+ required"}))
    sys.exit(1)

TZ = ZoneInfo("Atlantic/Reykjavik")
CUTOFF_TIME = time(16, 0)


def parse_date(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def parse_now(s):
    if s is None:
        return datetime.now(TZ)
    # Accept a bare date, a date+time, or a full ISO timestamp.
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.replace(tzinfo=TZ)
        except ValueError:
            continue
    raise ValueError(f"Unrecognised --now value: {s!r}")


def cutoff_for(meal, target_date):
    meal_norm = meal.strip().lower()
    if meal_norm == "dinner":
        return datetime.combine(target_date, CUTOFF_TIME, tzinfo=TZ)
    if meal_norm == "lunch":
        return datetime.combine(target_date - timedelta(days=1), CUTOFF_TIME, tzinfo=TZ)
    raise ValueError(f"meal must be 'Lunch' or 'Dinner', got {meal!r}")


def check(meal, target_date, now):
    meal_norm = meal.strip().capitalize()
    today = now.date()
    cutoff = cutoff_for(meal_norm, target_date)
    minutes_to_cutoff = int((cutoff - now).total_seconds() // 60)
    within_window = now <= cutoff

    if target_date < today:
        status = "date_in_past"
    elif meal_norm == "Lunch" and target_date == today:
        status = "lunch_same_day"
    elif not within_window:
        status = "dinner_cutoff_passed" if meal_norm == "Dinner" else "lunch_cutoff_passed"
    else:
        status = "ok"

    return {
        "meal": meal_norm,
        "date": target_date.isoformat(),
        "cutoff": cutoff.isoformat(),
        "now": now.isoformat(),
        "status": status,
        "same_day_dinner": meal_norm == "Dinner" and target_date == today and status == "ok",
        "minutes_to_cutoff": minutes_to_cutoff,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--meal", required=True, choices=["Lunch", "Dinner", "lunch", "dinner"])
    ap.add_argument("--date", required=True, help="Target order date, YYYY-MM-DD")
    ap.add_argument("--now", default=None, help="Override 'now' (YYYY-MM-DD[THH:MM]); defaults to the real clock")
    args = ap.parse_args()

    target_date = parse_date(args.date)
    now = parse_now(args.now)
    result = check(args.meal, target_date, now)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
