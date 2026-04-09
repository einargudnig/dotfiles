---
name: maul-prep-confirmations
description: Use this skill to check which restaurants have confirmed their food prep for today. It scans the maul@maul.is Google Groups inbox via the browser, finds all prep confirmation emails ("er að undirbúa") sent by "Maul restaurant", and extracts a clean list of restaurant names. Use this skill whenever someone asks about prep confirmations, which restaurants are prepping, who has confirmed, restaurant prep status, or anything related to today's food preparation overview — even if they don't mention "prep" or "undirbúa" by name. Also use when comparing confirmed restaurants against a menu or order list.
---

## Purpose

Every day, restaurants that partner with Maul send automated prep confirmation emails to the **maul@maul.is** Google Groups inbox. These emails confirm that the restaurant is preparing today's orders. This skill extracts the list of confirmed restaurants so ops can quickly see who's prepping and — critically — spot who's missing.

The confirmation emails follow a consistent pattern: the sender is always **"Maul restaurant"** and the subject line contains the restaurant name followed by **"er að undirbúa"** (Icelandic for "is preparing"), plus the date.

---

## When to use this skill

Trigger on questions like:
- "Which restaurants have confirmed prep?"
- "Who's prepping today?"
- "Show me today's prep confirmations"
- "Hvaða veitingastaðir eru að undirbúa?"
- "Check the inbox for prep emails"
- "Compare today's menu against prep confirmations"

---

## Step-by-step instructions

### Step 1 — Open the Google Groups inbox

Navigate to the Maul Google Groups inbox using the Chrome browser tools:

```
https://groups.google.com/a/maul.is/g/maul
```

Use `tabs_context_mcp` to get or create a tab, then `navigate` to the URL. Wait a couple seconds for the page to load.

### Step 2 — Scan the inbox for prep confirmation emails

Take a screenshot to see the inbox. Prep confirmation emails are easy to spot:

- **Sender**: "Maul restaurant"
- **Subject pattern**: `[Restaurant name] er að undirbúa, [date]`

The date portion comes in two formats:
- Icelandic: `mánudagur 30. mars!` (weekday + day + month)
- English: `Monday 30 March!`

Both formats appear — treat them identically.

Scroll through the inbox and collect every email matching this pattern. The confirmations typically arrive in the morning (roughly 8:00–11:00 AM), so they'll be clustered together among today's messages. Keep scrolling until you stop seeing today's prep emails (you'll start hitting yesterday's messages or other non-prep threads).

### Step 3 — Extract restaurant names

From each matching subject line, extract just the restaurant name — everything before "er að undirbúa".

**Examples:**
- `XO er að undirbúa, Monday 30 March!` → **XO**
- `Hraðlestin er að undirbúa, mánudagur 30. mars!` → **Hraðlestin**
- `Olifa La Madre pizza er að undirbúa, mánudagur 30. mars!` → **Olifa La Madre pizza**
- `Vegan World Peace er að undirbúa, Monday 30 March!` → **Vegan World Peace**

### Step 4 — Deduplicate

Some restaurants send more than one confirmation email (e.g. XO or Reykjavík Asian may appear twice). Count each restaurant only once in the final list.

### Step 5 — Output the list

Present a clean, numbered list of all unique restaurants that have confirmed prep for today, sorted by the time of their earliest confirmation (earliest first). Include the total count.

Format:
```
## Prep Confirmations for [Today's date]

[N] restaurants have confirmed prep:

1. Restaurant A
2. Restaurant B
3. Restaurant C
...
```

If the user also has a list of expected restaurants (from an API, a menu, or provided manually), compare the two lists and highlight:
- **Confirmed**: restaurants on both lists
- **Missing**: restaurants on the expected list that have NOT sent a confirmation
- **Extra**: restaurants that confirmed but aren't on the expected list (rare, but worth flagging)

---

## Icelandic day names (for reference)

These may appear in the date portion of the subject line:
- `mánudagur` → Monday
- `þriðjudagur` → Tuesday
- `miðvikudagur` → Wednesday
- `fimmtudagur` → Thursday
- `föstudagur` → Friday
- `laugardagur` → Saturday
- `sunnudagur` → Sunday

---

## Tips for reliability

- The inbox is high-traffic (50,000+ conversations), so don't try to load everything — just scan the first page or two of recent messages.
- If the page shows a date filter or search, you can search for `er að undirbúa` to narrow results, but scrolling through today's messages is usually fast enough.
- Prep emails cluster together in the morning. Once you scroll past them into older or unrelated threads, you can stop.
