# Building the review artifact, and the verification URLs

Read this when you reach Step 9, or whenever you need to construct a verification URL (Step 10b's
Chrome path uses the same shape).

## Build it

```bash
python3 scripts/build_review_artifact.py data.json late-orders-<YYYY-MM-DD>.html
```

The script validates nothing, so the JSON has to match this exactly:

```json
{
  "generatedAt": "2026-08-14 08:55 (Atlantic/Reykjavik)",
  "windowLabel": "Wed 12 Aug 08:40 → Fri 14 Aug 08:40",
  "menuWeek": "2026-W33",
  "impWeek": "2026-W32",
  "customers": [{
    "name": "…", "accountEmail": "…", "senderEmail": "…", "senderName": "…",
    "company": "…", "location": "…", "confidence": "High",
    "conversationId": "cnv_…", "subject": "…", "receivedAt": "Thu 13 Aug 18:10",
    "translated": true, "translationScope": "full", "userAllergens": ["crustaceans"],
    "notifications": {"email": false, "sms": false},
    "note": "free-text caveat shown above the table, or \"\"",
    "lines": [{
      "date": "2026-08-15", "dayLabel": "Sat 15 Aug", "meal": "Dinner",
      "requested": "what the customer actually wrote",
      "status": "matched",
      "dishIs": "…", "dishEn": "…", "restaurant": "…",
      "menuItemId": "…", "restaurantId": "…", "menuId": "…",
      "dietTypes": ["omnivore"], "allergens": ["gluten"]
    }]
  }]
}
```

## Per-status fields

- `translated` is true whenever a Step 4 comment went up. `translationScope` is `"full"` for a
  translated message or `"dishes"` for an English one whose dish names needed translating; the card
  labels itself accordingly, and omitting it just says a translation was posted.
- `same_day` — keep whatever dish fields you resolved (the operator needs them to decide) and add
  `"flagReason"`, e.g. `"today's lunch"`. **Today's dinner takes no special status or field** — it is
  an ordinary `matched` line and should appear as one.
- `service_paused` — add `"pausedRange": "2026-07-10 → 2026-07-29"` so the card can name the period.
- `allergen_clash` — keep the dish fields **and** the dish's `allergens`, so the page can name the
  overlap.
- `other_people`, `no_service` — dish fields optional; the reason is the point.
- `ambiguous` — replace the dish fields with an `options` array of
  `{meal, dishIs, dishEn, restaurant, menuItemId, restaurantId, menuId, allergens}`, so a resolved
  ambiguity becomes placeable without re-querying the menu.
- `not_on_menu` — omit the dish fields entirely.
- Any line may carry `"dateWarning": "they wrote Saturday 15th; the 15th is a Friday"`. It renders as
  an amber row note plus a *confirm the date* decision item, and does not change the line's status.

`restaurantId` and `menuId` are carried purely so the write payload survives in a file rather than
only in your context. The script reads named keys with `.get()` and ignores what it doesn't render,
so they cost nothing — and they are what lets a resumed or handed-off run place orders without
re-resolving the menu.

## What the script derives (don't put these in the JSON)

- **Line numbers**, sequential across the whole page, 1..N, each row anchored `id="line-<n>"`. These
  numbers are the shared vocabulary with the operator — keep your own copy of the same numbering so
  "skip 7 and 9" resolves correctly.
- **The scoreboard** — *ready to place*, *need you first*, *customers*. The first two decide what
  happens next, so they're the only ones given any size. "Ready to place" counts `matched` and
  nothing else.
- **The status column**, pills in a right-hand column rather than trailing the text, so a customer's
  situation scans vertically.
- **The "Needs you first" block** — every non-`matched` line as a checklist above the cards, each
  with a checkbox and a `#n` link into context, **grouped by what has to happen** (same day, allergen
  conflict, service paused, covers more than the sender, no service, sitting unclear, nothing
  matches, date to confirm) with the shared explanation written once per group and only specifics per
  line. That grouping is what keeps it usable: eight flagged lines written out in full just duplicates
  the table below and the operator stops reading. `dateWarning` lines appear here too. Checkbox state
  resets on reload (artifacts can't use browser storage) and the page says so. Omitted entirely when
  every line matched.

Because that block is the operator's worklist, `note` earns its keep on any customer with a
non-matched line — it becomes the "why" line under the checkbox. Write it as the reason a human has
to look, not a restatement of the request.

## Verification URLs

Used twice: the artifact's per-customer **Open verification** button, and the Chrome path's tabs in
Step 10b. Same shape both times.

```
https://app.maul.is/verification?imp=<accountEmail>&ms=<date>:<Meal>:<MenuItemId>&ms=…
```

- One `ms` per confirmed `matched` line: ISO `date`, capitalised `MealTime` (`Lunch` / `Dinner`),
  then the line's `MenuItemId` **verbatim** — it already encodes restaurant, dish, sitting and weekday
  (`indianspice.indianspicecauliflowerkeema.lunch.mon`), so never rebuild it from parts.
- Leave the `:` separators and the `@` in the email unencoded. That's the form the app's own links use.
- Worked example:
  `https://app.maul.is/verification?imp=gestur1@maul.is&ms=2026-08-25:Lunch:veganworldpeacerestaurant.veganworldpeacepineapplerice.lunch.tue&ms=2026-08-24:Lunch:indianspice.indianspicecauliflowerkeema.lunch.mon`
- `ambiguous` and `not_on_menu` lines have no `MenuItemId` and are never preselected. A customer whose
  lines are *all* unmatched gets the plain menu URL instead
  (`https://app.maul.is/menus/<impWeek>?imp=<email>`), and the button reads *Open menu as customer* —
  say so when you report, so nobody opens that tab expecting a filled-in selection.
- On the Chrome path, one tab per customer deduped by account email, carrying **only that customer's
  eligible lines** — an exclusion in the operator's answer applies here too. Say which lines each tab
  carries when you report back (`Arnar — 2 lines preselected`).

`impWeek` is only the fallback for that unmatched case. The Maul ordering flow points at the week
*before* the current one for catch-up ordering, so it is normally `get_week_label.py --offset -1`
while `menuWeek` is the current week. Don't hardcode either.
