#!/usr/bin/env python3
"""ISO week label for Maul menu lookups, in Atlantic/Reykjavik.

    python3 scripts/get_week_label.py              # ISO week containing today
    python3 scripts/get_week_label.py --offset -1  # the week before
    python3 scripts/get_week_label.py --date 2026-09-15

Prints `YYYY-Www` (e.g. 2026-W38) — the form listBlueprintMenus and the
impersonation menu URLs expect.

Always computed in Atlantic/Reykjavik rather than the container's clock: a run
that starts before midnight and finishes after it would otherwise resolve the
wrong week, which is the same class of bug the skill warns about for "today".
"""

import argparse
from datetime import date, datetime, timedelta

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("Atlantic/Reykjavik")
except Exception:  # pragma: no cover - zoneinfo missing or tzdata absent
    TZ = None


def today_in_reykjavik() -> date:
    if TZ is not None:
        return datetime.now(TZ).date()
    # Iceland does not observe DST and sits on UTC+0 year-round, so plain UTC is
    # a correct fallback here — stated explicitly so nobody "fixes" it later.
    return datetime.utcnow().date()


def week_label(day: date, offset: int = 0) -> str:
    shifted = day + timedelta(weeks=offset)
    iso_year, iso_week, _ = shifted.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--offset", type=int, default=0,
                    help="weeks to shift; -1 is the previous week (the catch-up "
                         "ordering week the Maul flow points at)")
    ap.add_argument("--date", dest="on",
                    help="anchor date as YYYY-MM-DD instead of today")
    args = ap.parse_args()

    anchor = date.fromisoformat(args.on) if args.on else today_in_reykjavik()
    print(week_label(anchor, args.offset))


if __name__ == "__main__":
    main()
