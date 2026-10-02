---
name: restaurant-order-draft
description: Draft a Front email (BCC from maul@maul.is, never sent) to everyone who ordered a given Maul restaurant on a day that week without cancelling (status Default/Claimed). Date defaults to today.
---

# Restaurant order draft

Staff sometimes need to email everyone who ordered a specific restaurant on a
given day — a heads-up about a delay, a swap, a pickup change, a thank-you. This
skill does the lookup and assembles the Front draft, addressed by BCC, and
then **stops so a human can review and send it**. It never sends anything.

## When to use

Reach for this whenever the user wants to message or draft to everyone who
ordered a particular restaurant on a day — e.g. "draft an email to everyone who
ordered Yndisauki today", "create a BCC draft for today's Spiran orders", "put
everyone getting that restaurant today into a draft", "email today's customers
for a restaurant", "make a draft to Monday's orders for a restaurant".

The two inputs:

- **Restaurant** — required. The user names it ("Yndisauki", "Spiran", …). If
  they don't, ask which restaurant before doing anything.
- **Date** — optional, defaults to **today** in Atlantic/Reykjavik. It is
  expected to be within the **current ISO week** (Maul orders are placed per
  week, so a same-week day is the normal case). If the user gives a date that
  falls outside the current week, still proceed but tell them plainly that it's
  in a different week, in case they mistyped.

## Step 1 — Resolve the date

Run the bundled script rather than computing the date by hand — it reads the
real Reykjavik-local clock:

```bash
python3 scripts/resolve_date.py                 # today (default)
python3 scripts/resolve_date.py --date 2026-08-11   # a specific day the user named
```

It prints `date=`, `iso_week=`, `weekday=`, and `in_current_week=`. If
`in_current_week=false`, surface a one-line warning to the user but keep going.
Use the printed `date=` value (YYYY-MM-DD) for the order lookup in Step 3.

## Step 2 — Resolve the restaurant ID

Call `mcp__Maul_Mcp__listRestaurants` with `search` set to the name the user
gave. The `RestaurantId` you want is the short slug (e.g. `yndisauki`,
`spiran`).

- Exactly one match → use its `RestaurantId`.
- Several plausible matches → show the user the names and ask which one; don't
  guess.
- No match → tell the user you couldn't find that restaurant and stop.

## Step 3 — Pull that day's orders for the restaurant

Call `mcp__Maul_Mcp__listOrderItems` with:

- `startDate` and `endDate` both set to the resolved date (single day),
- `restaurantId` set to the slug from Step 2,
- `limit` high (e.g. `1000`) so nothing is truncated.

This response is usually large and gets saved to a tool-results file instead of
being returned inline — that's expected. Note the file path from the result
(the error/notice text includes it); you'll feed it to the next step. If it
*did* come back inline, just write it to a scratch `.json` file yourself.

## Step 4 — Filter to people who didn't cancel, and get their emails

Run the bundled extractor on that saved JSON file:

```bash
python3 scripts/extract_recipients.py PATH_TO_ORDERS_JSON
```

It keeps only orders whose `OrderItemStatus` is **Default** or **Claimed**
(every cancellation status is dropped), dedupes email addresses, and prints:

- a `COUNT=… EMAILS=…` header,
- `EMAILS:` — the unique addresses, comma-separated,
- `GROUPED:` — the kept people grouped by company (for a human-readable recap),
- `OTHER STATUSES:` — only if some order carried a status that was neither kept
  nor an obvious cancellation. If this section appears, mention it to the user
  so they can decide whether those people belong in the draft; don't silently
  include or exclude them.

The keep-set is a script flag (`--statuses Default,Claimed`) if a run ever needs
a different rule, but Default+Claimed is the standard.

## Step 5 — Show the user the recap, then create the draft

Briefly show the count and the grouped-by-company recap so the user can sanity
check who's included. Then create the draft.

Create a **new outbound** draft with `mcp__Front_MCP__create_draft`:

- `channelId`: the **maul@maul.is** channel. Its ID is `cha_aarm`
  (`send_as: maul@maul.is`). If that ever looks stale, re-confirm with
  `mcp__Front_MCP__list_channels` and pick the channel whose `send_as` is
  `maul@maul.is`.
- `bcc`: the full list of unique emails from Step 4. **BCC, not To/CC** — these
  recipients shouldn't see each other's addresses.
- `subject`: empty string.
- `body`: a single space (`" "`) — a blank body for the user to fill in.
- `bodyFormat`: `"plain"` (a plain single space keeps the body empty without
  needing any HTML tag).
- `shared`: `true` (required for this identity; makes the draft visible in
  Front).

Do **not** set `to` or `cc`, and do **not** call `send_message` or any send
action. The whole point is to hand a ready-but-unsent draft to a human.

## Step 6 — Report back

Keep it short:

- One line: restaurant, date (and weekday), how many orders kept, how many
  unique emails went into the draft.
- Confirm the draft was created in Front from maul@maul.is with everyone BCC'd,
  and that it was **not sent**.
- If Step 1 flagged the date as outside the current week, or Step 4 printed
  OTHER STATUSES, call that out here.
- Offer to fill in a subject/body if the user wants — but still don't send.
