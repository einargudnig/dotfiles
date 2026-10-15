---
name: maul-menu-gluten-free-finder
description: "Find every gluten-free dish available on a specific weekday for Maul's Icelandic lunch catering menus. Use whenever asked for gluten-free, glútenlaus, or gluten-free options for a given day (mánudagur/Monday, þriðjudagur/Tuesday, miðvikudagur/Wednesday, fimmtudagur/Thursday, föstudagur/Friday), or asked to check the gluten-free menu for the upcoming week. Reads menu data from the Maul MCP (blueprint menus + courses catalog) — do not guess dishes from memory or last week's menu."
---

You are finding gluten-free lunch options for Maul, an Icelandic lunch catering service. Data always comes from the **Maul MCP** (`mcp__Maul_mcp__*` tools) — never guess or reuse a previous answer, since the menu and course catalog change week to week.

## Input

This skill takes one required parameter: **the weekday** to check (e.g. "Wednesday", "miðvikudagur", or weekday number 3). If the caller didn't specify a weekday, ask which one before proceeding — the whole point of this skill is a single day's answer, not the whole week.

Map the weekday to `WeekdayNumber`: 1 = mánudagur/Monday … 5 = föstudagur/Friday. Weekdays 6–7 (Saturday/Sunday) are never analysed — Maul doesn't serve lunch then.

## Which week

Default to the **upcoming week** unless the user names a different one. Weeks are ISO format `YYYY-Www` (e.g. `2026-W36`). Compute the target weekday's actual calendar date too (e.g. `2026-W36`, weekday 3 → `2026-09-02`) — you'll need it later for the date-postfix check.

## The two-step data model

Maul menus are built from two layers, and this skill needs both:

1. **Blueprint menus** (`mcp__Maul_mcp__listBlueprintMenus`, param `isoWeek`) — tell you *which restaurants are on which menu on which day*. This is the weekly assignment.
2. **Courses catalog** (`mcp__Maul_mcp__listActiveCourses`, param `restaurantId` or `search`) — the restaurant's actual dish repertoire, including `DietTypes` and, importantly, whether a given dish is a one-off tied to a single calendar date. This is the source of truth for diet tags — trust it over anything in the blueprint entry itself.

If either tool's schema is deferred, load it first via ToolSearch (`select:mcp__Maul_mcp__listBlueprintMenus,mcp__Maul_mcp__listActiveCourses`).

### Step 1 — Find which restaurants are on the menu that day

Call `listBlueprintMenus` for the target `isoWeek`. The result is large — save it to a file and read it with `jq` via Bash, never by dumping the whole file into context.

Filter to:
- `LocationId` in `thor`, `huginn`, `muninn`, `freyja` and their `-b` variants, plus `variety-a`, `variety-b`. Ignore `dinner` entirely.
- `Menu[].WeekdayNumber` equal to the target weekday.

From the matching dish entries, collect the distinct `RestaurantId` / `RestaurantName` values — these are the restaurants actually serving lunch that day. Dedup restaurants that show up on more than one menu (`thor` and `thor-b` are normally identical; `variety-a`/`variety-b` too) but keep a note of *which* menus each restaurant appears on, since that's useful context for the final answer.

Example jq:
```
jq -r --arg wd 3 '.blueprintMenus[]
  | select(.LocationId | test("^(thor|huginn|muninn|freyja)(-b)?$|^variety-[ab]$"))
  | .Menu[] | select(.WeekdayNumber == ($wd|tonumber))
  | "\(.RestaurantId)\t\(.RestaurantName)\t\(.LocationId)"' FILE | sort -u
```

### Step 2 — Pull each restaurant's gluten-free courses

For each distinct restaurant from Step 1, call `listActiveCourses` with `restaurantId` (preferred — exact) or `search: <RestaurantName>` if you only have the name, and `status: "Active"`. This returns the restaurant's full dish catalog with fields including `CourseId`, `DietTypes`, `DescriptionByLang`, `ShortDescriptionByLang`, `Status`.

Keep only courses where `DietTypes` contains `"gluten-free"` (exact string — don't infer gluten-free from the text of the description; "glútenlaus" in Icelandic text is a helpful hint but `DietTypes` is authoritative).

### Step 3 — Apply the date-postfix rule

Some `CourseId` values end in an 8-digit date, `YYYYMMDD` (e.g. `eldhusidokkarbakedarctic20260922`). That date-postfix means the dish is a **one-off tied to that exact calendar date**, not a recurring weekday item — restaurants like "Eldhúsið okkar" use this for chef's-special-style dishes. `CourseId`s *without* a trailing date are recurring and always eligible when their restaurant is on the day's menu.

For each gluten-free course found in Step 2:
- If its `CourseId` ends in an 8-digit date, parse it and compare to the target weekday's actual calendar date (computed above). Keep the dish only if the dates match exactly; otherwise discard it — it belongs to a different day.
- If there's no date postfix, keep it.

## Output

List every surviving gluten-free dish, grouped by restaurant, for the requested weekday. For each dish show: restaurant name, dish name (Icelandic short description, with the English short description alongside), and which menu(s) (`LocationId`) it's on that day. If a restaurant appears on the day's menu but has no gluten-free course, don't mention it — only report what's actually available. If nothing turns up at all, say so plainly rather than padding the answer.

Keep the report itself free of headers/bullets-for-bullets'-sake — a short list is fine as a plain list, but don't editorialize or add recommendations beyond what was asked.

## Response Language

Respond in Icelandic if the user writes in Icelandic, in English if the user writes in English.
