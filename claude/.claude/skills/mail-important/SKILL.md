---
name: mail-important
description: Surface what actually matters in the personal Gmail (einargudnig@gmail.com) via the spark CLI — real people waiting on the user, deadlines, money, bookings, official mail. Use for "what's important in my email", "anything I need to deal with", "check my personal inbox", or a morning mail triage. Not for newsletters (mail-tldr) or receipts (mail-invoices).
metadata:
  version: "1.0.0"
  requires:
    bins: [spark]
---

# Mail important: what needs attention

Read-only. Never archive, mark read, or reply. Drafts only if the user asks.
CLI reference: the `use-spark` skill. Spark Desktop must be running.

## 1. Collect

Default window: `newer_than:3d` (or since the last check if the user says so).

```bash
ACC=einargudnig@gmail.com
F="newer_than:3d"
spark emails "$ACC" --filter "$F" --page-size 50                       # inbox
spark emails "$ACC" --filter "$F category:personal" --page-size 50     # humans
spark emails "$ACC" --filter "$F category:priority" --page-size 50
spark emails "$ACC" --filter "$F category:invitation" --page-size 20
spark emails "$ACC:Starred" --filter "is:unreplied newer_than:30d" --page-size 20  # starred, unanswered
spark emails "$ACC" --new-senders --filter "$F" --page-size 20         # Gatekeeper — may hide real people
```

Dedupe by ID. Ignore anything `category:newsletter` and anything mail-invoices
would catch, unless it's a failed payment or a dispute.

## 2. Judge

Read candidates with `spark thread <id>`. Classify each:

- **Act** — someone is waiting on the user, a deadline, a payment problem, something
  that gets worse if ignored.
- **Know** — useful to be aware of, no action.
- **Noise** — drop silently.

### User priorities

<!-- TODO: fill in. These override the defaults above. -->

## 3. Report

```
## Act (n)
- **<Who>** — <what they need> · <deadline if any> · id <ID>

## Know (n)
- **<Who>** — <one line>

Skipped: <n> newsletters, <n> notifications, <n> receipts.
```

Most urgent first. If **Act** is empty, say so in one line. Translate Icelandic.
If an item is a clear to-do, offer to add it via `/todo`.
