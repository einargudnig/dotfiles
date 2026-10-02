# The Front decision comment

Read this at Step 11, once the placing step is settled — including after a "just the artifact"
answer, because the record matters either way.

One internal comment per conversation per run. Not two, and not one per line: a thread that
accumulates AI comments stops being read.

Post with `mcp__Front_MCP__add_comment`, plain text — the body resolves @mentions but don't rely on
markdown rendering. Four sections in this order, and **omit any section that would be empty**:

```
Maul late-order scan — decisions (confirmed by Einar)

WHO
Wrote from jonas@ashb.is → account jonas.b@ashb.is (High: unique name
match, company lines up). Örugg afritun · Reykjavík.
⚠ Notifications off (email + SMS) — nothing from Maul reaches them.
Allergen conflict flagged on line 3 — see the account.

PLACED
Thu 27 Aug lunch — Kjúklingasúpa (Spíran)
Sat 29 Aug dinner — Lasagna (Alles) — replaced Chili Con Carne
Today's dinner — Grænmetiskarrý (Spíran) — same-day dinner

NOT PLACED
Thu 21 Aug lunch — same day; same-day lunch is never placed automatically.
Still open.
Fri 22 Aug dinner — no service at this location that weekday.

OWED A REPLY
Three orders are in and they have no way of knowing — no confirmation is
sent and their notifications are off. The same-day lunch and Friday
requests both need an answer.
```

What each section is for:

- **The header line** is the only metadata that stays. It names the skill so nobody mistakes the
  comment for a colleague's note, and names **the person who confirmed the run** — that's the
  accountability that matters, not the timestamp Front already stamps on the comment.
- **WHO** — the identity resolution, because it's the riskiest inference in the run and the one nobody
  can check later without redoing it. Give the address they wrote from, the account it resolved to,
  the confidence, and *how* it matched. Then only the account facts that change how someone replies:
  notifications off, service paused, a flagged allergen conflict.
- **PLACED** — one line per order: day, sitting, dish, restaurant. **Always name a replacement** where
  `replacedSlots` came back non-empty; that's the single most surprising thing that can happen to a
  customer's week, and this is where it becomes discoverable. **Mark same-day dinners** as such, so
  whoever reads it knows a plate went on late.
- **NOT PLACED** — every flagged line and the reason in a few words. This is the section people
  actually come back for: it's the work still outstanding.
- **OWED A REPLY** — what the customer still doesn't know. Never omit this when an order was placed:
  Maul sends no confirmation, so a placed order that nobody mentions is invisible to them.

**Allergens are health data.** The user record carries `ConsentAllergensData`, and it is `false` on
plenty of accounts. When it's false, say a conflict was flagged and point at the account — don't
restate the specific allergen in a comment that outlives the run. When it's true, naming it is fine.

Two things to keep out: don't paste the raw `createOrder` payload (the human-readable line carries
everything a person needs, and the JSON dominates the comment), and don't name a Front message
template — the Front MCP can't list templates, so any name you write is unverifiable and will rot.

Write it as though it will be read by someone who wasn't in the chat, months from now, with the
customer on the phone. That's the actual audience.
