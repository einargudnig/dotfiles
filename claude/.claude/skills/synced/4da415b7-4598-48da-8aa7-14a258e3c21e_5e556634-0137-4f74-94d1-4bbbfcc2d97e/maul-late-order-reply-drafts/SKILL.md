---
name: maul-late-order-reply-drafts
description: "Writes the customer-facing reply for late-order emails in the shared maul@maul.is Front inbox, as a Front draft — never sent, always left for a human to review and send. Picks the right tone: plain confirmation, itemised readback when the customer named specific dishes, a needs-a-decision reply for anything not placed (cutoff passed, allergen conflict, no service, covers someone else, ambiguous sitting), or guidance for a customer who simply forgot to place their own order for the current (already-active) week. Applies Maul's ordering-window rule precisely — dinner same-day until 16:00, next-day lunch before 16:00 the day before, lunch never same-day — and appends an email/SMS notification reminder (https://app.maul.is/settings) whenever either is off. Use when staff want draft replies for late-order threads, most naturally right after maul-late-orders / late-order-scan-2 / late-orders-scanner, but also standalone on conversations tagged Seinpöntun."
---

# Maul late-order reply drafts

Resolving and placing a late order isn't the end of the job — the customer still doesn't know
whether it went through, because Maul sends no confirmation email when staff place an order on
someone's behalf. This skill writes that missing reply: one Front draft per conversation, in the
customer's own language, saying plainly what happened and what (if anything) they need to answer.
It never sends anything — a human reviews every draft before it goes out.

## Division of labour with the scan/placement skills

`maul-late-orders` (and its siblings `late-order-scan-2`, `late-orders-scanner`) already do the
hard part: confirm the sender's account, resolve each dish against the real menu, place the orders
a human approved, and record the outcome as an internal Front comment. That skill's own notes say
it deliberately doesn't encode Maul's precise ordering-window cutoffs and defers to "a dedicated
time-rules skill" for that detail — **this is that skill.** It owns two things the scan doesn't:
turning a recorded decision into the actual words a customer reads, and knowing exactly when
today's dinner or tomorrow's lunch stops being orderable.

So the normal flow is: run the scan/placement skill first, let staff confirm what gets placed, and
then run this one to draft the replies for everything that run touched. This skill also works cold
— pointed at conversations already tagged **Seinpöntun** with no scan run in the current session —
by reading back the decision from Front itself (Step 2).

## What this skill never does

- **Never sends a message.** Every output is a Front draft (`create_draft`), always left for a
  person to read and send.
- **Never places, changes, or cancels an order.** If a line hasn't actually been decided yet — no
  `matched`/placed outcome and no clear "not possible" reason — say so and hold that conversation
  rather than drafting a reply that gets ahead of the facts.
- **Never invents a menu item, price, or policy.** Every dish name, date, and reason in a draft has
  to trace back to something Step 2 actually found — the resolved order lines, the account's
  notification flags, or the cutoff check in Step 3.

## Step 1 — Find the conversations that need a reply

**If the user named specific conversations, customers, or "the ones from the run we just did,"**
use exactly those — skip straight to Step 2.

**Otherwise**, find candidates yourself:

1. Confirm the `Seinpöntun` tag ID with `mcp__Front_MCP__list_tags` if `tag_ydhxe` ever looks stale.
2. Call `mcp__Front_MCP__search_conversations` with `filters.tags: ["tag_ydhxe"]`, `filters.status:
   "open"`, `scope: "all_inboxes"`. These are the late-order threads that haven't been archived yet.
3. For each, call `mcp__Front_MCP__read_conversation` and look at the timeline:
   - An **outbound message from a teammate** newer than the most recent inbound customer message
     means someone already replied by hand — drop it, nothing to draft.
   - An **active draft already on the conversation** (visible on the first page of
     `read_conversation`, or check `mcp__Front_MCP__list_drafts`) means a reply is already staged —
     drop it too, and just mention it exists when you report back. Don't overwrite someone else's
     draft.
   - Otherwise, it's a candidate.

## Step 2 — Work out what was actually decided

You need, per conversation: which lines were placed (with dish/date/meal/restaurant), which weren't
(and why), the account's notification flags, and the customer's language. Get this the cheapest
reliable way available, in this order:

1. **Same-session `data.json`** — if `maul-late-orders` (or a sibling) just ran in this
   conversation and wrote a `data.json`/review artifact you still have, read the resolved lines
   straight from it. This is the richest source (exact dish names in both languages, restaurant,
   confidence, notification flags) and needs no extra tool calls.
2. **The scan's own decision comment** — every run of `maul-late-orders` posts one internal comment
   per conversation titled `Maul late-order scan — decisions (confirmed by …)` with `WHO` / `PLACED`
   / `NOT PLACED` / `OWED A REPLY` sections (see that skill for the exact shape). Read it straight —
   it's prose, not JSON, so use judgment rather than a rigid parser: `PLACED` lines are confirmed
   fact, `NOT PLACED` lines carry their reason in a few words, `WHO` carries the notification flags
   and any allergen/pause caveat.
3. **Neither is available** — the conversation was tagged but never actually resolved (a scan hasn't
   run against it, or it's from before this skill's era). Don't guess a menu match yourself; say so
   in your report and suggest running `maul-late-orders` (or a sibling) on it first. The one thing
   you *can* still do without a scan is check notifications (`mcp__Maul_mcp__getUserByEmail`) and
   send a plain acknowledgement that the request was received and is being looked at — better than
   silence, but say plainly it's not a real confirmation yet.

**Determine the customer's language** from the original inbound message: if there's an
`🤖 AI translation` (or older `AI translation for Jennie`) comment marked as a *full* translation,
the customer wrote in Icelandic — reply in Icelandic. If the message reads in English, reply in
English. If it's genuinely mixed or you can't tell, default to Icelandic (Maul's working language)
and say in your report that you guessed.

## Step 3 — Re-check the ordering window yourself; don't trust a stale flag

`maul-late-orders` only flags a line `same_day` (today or already past) — a coarser signal than the
actual rule, and one that can go stale between when the scan ran and when you're drafting the reply
minutes or hours later. For **every** line, placed or not, run:

```bash
python3 scripts/check_cutoff.py --meal Lunch --date 2026-08-27
python3 scripts/check_cutoff.py --meal Dinner --date 2026-08-26
```

(omit `--now` — let it read the real clock; only pass it to test a hypothetical). It prints one JSON
object with a `status`:

- `ok` — still inside the window. `same_day_dinner: true` marks a same-day dinner that's still
  placeable — worth a slightly warmer, more immediate tone ("we've let the kitchen know") than an
  ordinary ahead-of-time order, but nothing to flag as a problem.
- `dinner_cutoff_passed` / `lunch_cutoff_passed` / `lunch_same_day` / `date_in_past` — the line isn't
  (or can't be) placed for timing reasons. Use the matching paragraph in
  `references/reply_templates.md` §3, filling in the specifics.

If a line already came back `matched`/placed from Step 2 but the cutoff check now says the window
has since closed, trust the recorded decision for what to tell the customer (it *was* placed) —
the cutoff check here is only for lines that weren't placed, to give the precise, correctly-worded
reason instead of a vague "too late." Don't second-guess an already-placed order.

This check doesn't apply to Step 5's shape 3 (forgot to order for the current week) — that's not
about a specific date's ordering window, it's about self-service being closed once a week goes
active. Skip straight to composing that reply.

## Step 4 — Check the notification settings

If you didn't already get this from Step 2's source, call `mcp__Maul_mcp__getUserByEmail` for the
confirmed account and read `EmailNotificationsOn` / `SmsNotificationsOn`. Whenever **either** is
`false`, the draft gets the reminder paragraph from `references/reply_templates.md` (the
`https://app.maul.is/settings` one) — this is the actual fix for a customer who keeps having to
email in instead of ordering themselves, so don't treat it as optional trivia. Say which channel(s)
are off if only one is.

## Step 5 — Pick the shape and write the draft

Open `references/reply_templates.md` for the full text of each shape, in Icelandic and English:

1. **Confirmed & placed** — Jennie's standing house template ("Hæhæ, Ekkert mál, þetta er komið!" /
   "Hi! Yes, no problem — this is in.", with the Maulið link and the Google-review ask) is the
   default for every line placed with no issues, whether it's one line or several. Don't itemise
   the dish back to the customer unless they specifically asked for a description of what was
   booked — that's an optional insert, not a separate shape.
2. **Needs a decision** — anything not placed. Pick the paragraph matching the *specific* reason
   (cutoff passed, lunch same-day, allergen conflict, no service, not on menu, covers someone else,
   service paused, ambiguous sitting, **or the delivery location doesn't match the account** — see
   `wrong_location` in the reference) — never a generic "sorry, can't do that." This is the case
   Jennie means by "tweak the responses as best fit": word the actual question or alternative that
   fits this customer's situation, using the template paragraph as a starting point, not a script to
   recite. Always name the specific date the line is for, and when the issue is *where* the order
   should be delivered, explicitly ask the customer to confirm the location rather than placing
   under the account's default. If a customer has both placed and not-placed lines, combine shape 1
   with shape 2's relevant paragraph(s) in one email — don't send two drafts for one conversation.
3. **Forgot to order — asking if they can still order for the current week** (`forgot_to_order_week`)
   — a customer missed placing their *own* order in time and is now asking, after the fact, whether
   they can still order for a week that's already active (self-service ordering closes once a week
   goes live). This is not a specific dish/date needing a placement decision like shape 2 — it's
   pointing them to look at what they missed and offering to place it for them since they can no
   longer do it themselves. Use this exact wording (Jennie's standing template as of 2026-09-02):

   **Icelandic**
   ```
   Hæhæ
   Ekkert mál, við græjum það. Þú einfaldlega ferð inn á þinn aðgang inn á maul.is (http://maul.is/),
   smellir á Maulseðill og flettir eina viku til baka og skoðar það sem er í boði.
   Við bendum þó á að þú getur ekki lagt inn pöntun sjálf/ur þar sem vikan er nú þegar virk en
   endilega sendu okkur bara línu með því sem þú vilt panta og við græjum þetta fyrir þig.
   ```

   **English**
   ```
   Hi!
   No problem, we'll sort that out for you. Just log into your account at maul.is, click on
   Maulseðill, and use the back arrow to step one week back to see what was on offer.
   Just a heads-up that you won't be able to place the order yourself since that week is already
   active — just send us a quick note with what you'd like and we'll take care of it for you.
   ```

   **What the back-arrow control looks like** (from a screenshot Jennie supplied 2026-09-02): on the
   Maulseðill page, the week's date range is shown at the top with a `<` / `>` pair of arrows next to
   the "Sjá núverandi viku" ("see current week") button — the `<` on the left of that pair steps back
   one week. If a customer seems unsure where to click, describe it in words rather than assuming
   they'll find it: "the small back arrow (‹) next to the 'Sjá núverandi viku' button, above the
   menu table."

   Keep this to the greeting/sign-off house style ("Hæhæ," / "Hi!" ... "Kær kveðja" / "Best
   regards") like shape 2 — skip the "þetta er komið"/"this is in" line and the Maulið-link/review-ask
   paragraph, since nothing's confirmed yet. Still append the notification reminder (Step 4) if
   either channel is off — it's exactly the fix that prevents this from happening again.

Keep the reply short — a screen, not a report. One line per date/meal for multiple lines, no tables,
no restating the whole review artifact. Match the greeting style already used in the thread if a
teammate has replied to this customer before (check the timeline); otherwise a plain "Sæl/Sæll
[name]," / "Hi [name]," opener is safe.

## Step 6 — Create the draft (never send)

For each conversation, call `mcp__Front_MCP__create_draft`:

- `conversationId`: the conversation's `cnv_…` ID — this replies on the existing thread, so you
  don't need `channelId` or `to`.
- `body`: the composed text from Step 5.
- `bodyFormat: "plain"` — preserves line breaks and handles Icelandic characters without needing any
  HTML.
- `shared: true` — required; an AI teammate's draft has to be shared or the call is rejected, and an
  unshared draft would be invisible to whoever needs to send it anyway.

Do not set `to`/`cc`/`bcc` and do not call `send_message` or any send action, ever. One draft per
conversation — if Step 1 found an existing draft, you already skipped that conversation.

## Step 7 — Report back

Keep it short and scannable:

- One line: how many conversations got a draft, how many were skipped (already replied / already
  drafted), how many were held back because Step 2 found no decision to draft from.
- **Only if any exist**, the conversations where you guessed the customer's language — name them.
- **Only if any exist**, the `same_day_dinner: true` lines — worth knowing which drafts have that
  slightly different tone.
- **Only if any exist**, conversations that used shape 3 (forgot to order for the current week) —
  name them.
- **Only if any exist**, conversations that got a notification-off reminder — name them and which
  channel(s), same as `maul-late-orders` does in its own report.
- **Only if any exist**, conversations you left with a plain acknowledgement instead of a real
  confirmation because no scan had resolved them yet, and say so plainly rather than letting it read
  as done.
- Point at Front for review rather than pasting every draft body into the chat — the drafts
  themselves are the deliverable; a person reads and sends each one from there.

## Notes on environment

`mcp__Maul_mcp__getUserByEmail` and `mcp__Front_MCP__create_draft` are usually deferred rather than
preloaded — `ToolSearch` for them by name before assuming they're missing. If `create_draft`
genuinely isn't available in this session, say so plainly and don't imply a draft was created when
it wasn't; there's no fallback that still meets the "never send automatically" rule, so the run
stops there for that conversation rather than improvising a workaround.