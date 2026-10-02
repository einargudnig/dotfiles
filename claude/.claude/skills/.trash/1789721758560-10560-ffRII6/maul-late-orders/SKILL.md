---
name: maul-late-orders
description: Handles customers who email the shared maul@maul.is inbox asking Maul staff to place a food order for them. Confirms each sender against their Maul account, tags the thread "Seinpöntun", resolves every requested dish against that day's real menu and sitting, and flags what a person must decide — same-day lunch, allergen conflicts, orders covering more than the sender, no service that weekday, paused accounts, doubtful dates. Produces a numbered HTML review board; staff pick a fulfilment path once in chat and that answer alone authorises Claude to place the orders through the Maul MCP and comment the decisions internally in Front. Same-day dinner rides the batch; same-day lunch never does. Translation is delegated to maul-front-translation; the customer-facing reply to maul-late-order-reply-drafts — hand off to it after every run, since Maul notifies nobody when staff order for someone. Use for "check the inbox for order requests", "build the late orders list", or any request to run the daily order-inbox scan.
---

# Maul late orders

Maul customers email the shared `maul@maul.is` inbox asking staff to place their lunch/dinner order —
usually because they forgot, are new, or want a last-minute change. This skill finds those emails,
confirms each customer against the Maul system, tags the conversation, translates it for staff, resolves
what they asked for against the actual menu, and hands the operator one review page to approve from.

## Why this shape

The inbox is busy, and most of it is *already-handled* order requests (a teammate replied and archived
it) or unrelated things — invoices, driver questions, job inquiries, auto-replies, marketing. So the
core judgment per email is **is this a customer asking us to place or adjust an order, and does it
still need action?** — not "does it mention food."

Second: **the address someone emails from is not always their account email.** People write from a
personal Gmail while their Maul account is under their work address. Ordering under the wrong account
puts a meal on someone else's desk, so always confirm the address against the Maul system before
treating it as ground truth, and be explicit about anywhere you had to guess.

Third: **customers describe dishes loosely and often omit the sitting.** "Turkey schnitzel" or just
"Vegan" has to be resolved against the real menu for that location, date and sitting before anyone can
act. Doing that up front — and flagging what *doesn't* resolve — turns a list of emails into a list of
orders.

## The human-in-the-loop boundary

Front writes (tagging, translation comments) happen automatically — additive, internal, harmless if the
scan over-includes slightly. **Order placement never happens without the operator saying so.**

The split: the artifact is where a human *reads*, chat is where they *commit*. Every line lands in the
artifact as a numbered proposal; the operator picks a fulfilment path in chat, and on the Maul path that
choice is itself the authorisation. That one answer is the gate, so it has to be an informed one — the
question names the count, the exclusions and the replacement conflicts (Step 10b). Don't build approval
controls into the artifact (its sandbox can't reach MCP tools anyway), and don't stack a second
confirmation on top of the operator's answer, which just teaches them to click through without reading.

**This is a deliberate departure from the Maul house pattern of a separate confirm step before any
write, and it should stay that way.** `createOrder` has been exercised enough at Maul that the risk
worth guarding against is no longer the tool misfiring — it's an operator waved through two prompts who
read neither. So the fulfilment choice *is* the ask. If a later edit reintroduces a scope question or a
go/no-go step after 10b, it is undoing this on purpose, not fixing an oversight.

## References — read these when you reach them

- `references/review-artifact.md` — the artifact's JSON shape, per-status fields, what the build script
  derives, and verification URL construction. Read at Step 9, and again for 10b's Chrome path.
- `references/order-writes.md` — the `createOrder` call shape and its traps: `replace: true`, ordering
  past the cutoff, the silent-replacement duplicate check. Read before the first write of a run.
- `references/line-statuses.md` — the reasoning behind each held-back status. Read while classifying.
- `references/front-comment.md` — the decision comment's template and section rules. Read at Step 11.

## Step 1 — Determine the scan window

Compute "now" in `Atlantic/Reykjavik` (Iceland doesn't observe DST, but stay explicit rather than
assuming UTC = local). Normally scan back **48 hours**; on **Monday** scan back to last **Friday 12:00** local, so weekend
emails aren't missed.

```bash
TZ=Atlantic/Reykjavik date "+%A %Y-%m-%d %H:%M"
```

## Step 2 — Pull candidate conversations from Front

The shared inbox is `🇮🇸 Maul` (`inb_at3e`) — confirm with `mcp__Front_MCP__list_inboxes` if that ID
ever looks stale.

Call `mcp__Front_MCP__search_conversations` with `filters.inboxId` set to it and `filters.after` set to
the window-start **date** (the API only takes day granularity, so expect extra conversations at the
edges and filter precisely by timestamp yourself). Use `scope: "all_inboxes"` so restricted-inbox
membership doesn't limit results. Paginate with the returned `cursor` until `updatedAt` is older than
your window start — results are roughly newest-first but not perfectly sorted, so keep going a little
past the first out-of-window result rather than stopping at it.

Narrow before reading anything in depth:

- Skip `status: "archived"` — in this inbox that means a teammate already resolved it.
- Keep `status: "open"` whether or not it's assigned. An assigned-but-open conversation may be someone
  mid-handling it; including it is harmless and better than missing a live request.
- Subjects are often Icelandic: "Pöntun", "Panta mat", "Gleymdi að panta" (forgot to order), "Bæta við
  pöntun" (add to an order), "Matarpöntun". Strong signals, but read the body before deciding —
  "Fyrirspurn um þjónustu" (service inquiry) and "Feedback from customer" share vocabulary and aren't
  order requests.

## Step 3 — Read each candidate and judge intent

`mcp__Front_MCP__read_conversation` for the inbound message. Use judgment, not a keyword list: the goal
is separating a customer who wants an order placed *now* from someone asking a general question.

- **Is a request:** "I forgot to order for tomorrow, can you open ordering for me?", "Can I order X for
  dinner tonight?", "My order went to the wrong place, can you sort tomorrow and Friday?", "Can you add
  a dish to my order?"
- **Is not (exclude silently):** service/pricing questions, invoice threads, driver/staffing questions,
  feedback not asking for a new order, auto-replies, calendar invites, onboarding questions about future
  events with no current-week order attached.
- **Already handled:** if the newest inbound message is a thank-you and a teammate's reply above says
  it's placed ("þetta er komið"), it's done — exclude it even though the conversation reopened.
- **Genuinely unsure:** keep it in (better a surplus line than a hungry customer) and flag it in the
  report. But on a borderline case — catering weeks out, no current-week menu implication — exclude:
  this skill's output is a same-week order.

## Step 4 — Add an English translation as an internal comment

**Owned by `maul-front-translation` — invoke it rather than translating here.** It holds the standard:
the `AI translation for Jennie` label, the Icelandic name beside the English, uncertain items marked,
one comment per conversation.

Two things you must supply when calling it, because a general translation skill can't know them:

- **The named things that matter here are dish names.** They're what gets matched against a menu in
  Step 8, so an English email asking for *"Kjúklingasúpa on Tuesday"* still needs a comment.
- **Translate every conversation you kept in Step 3**, whatever confidence Step 6 gives the customer —
  the translation is what helps whoever handles the Low and No-match cases by hand.

Record `translated` and `translationScope` (`"full"` or `"dishes"`) on the customer for Step 9.

> **If `maul-front-translation` isn't in the session, don't skip the step** — do it inline to those
> rules (`Kjúklingasúpa — chicken soup`, translate literally rather than resolving to a menu item, mark
> uncertainty `— unclear`, one `mcp__Front_MCP__add_comment` per conversation) and say in your report
> that you did it inline because the skill was missing, so someone can install it.

## Step 5 — Extract the sender's email

`mcp__Front_MCP__read_message` on the inbound message for `recipients.from[0].handle` — the conversation
list gives a display name, not always the address.

On forwarded threads (`FW: ...`) the original customer's address is usually recoverable from the quoted
"From:" line. Use whichever address belongs to the customer placing the order, not a teammate's.

## Step 6 — Validate the email against the Maul system

The step most likely to silently produce a wrong result if skipped. Do it for every candidate.

1. `mcp__Maul_mcp__getUserByEmail` with the Step 5 address.
2. **Resolves** → that's the confirmed account email. Keep the whole record: `LocationId`, `DietType`
   and `Allergens` for the next steps, `EmailNotificationsOn` / `SmsNotificationsOn` for the check
   below, `PauseServiceDateRanges` for Step 8.
3. **Doesn't resolve** → they emailed from an address that isn't their Maul account. Don't drop them.
   Try the local part as a name search (`jonas` from `jonas@ashb.is`), the signature or greeting, and
   their company if inferable — `mcp__Maul_mcp__listUsers` takes `search` and `companyId`. Look for
   exactly one strong match.
4. **Rate confidence honestly.** *High* — unique name match, company lines up, no ambiguity. *Low* — a
   plausible match with multiple candidates, weak name signal, or no company confirmation. *No match* —
   nothing plausible in the system.
5. **Only High confidence reaches the orderable list** (a direct `getUserByEmail` hit counts as High).
   Low and No-match go to the report's manual-handling section; the risk of ordering under the wrong
   account outweighs the convenience.

### Check whether they can be reached at all

`getUserByEmail` returns `EmailNotificationsOn` and `SmsNotificationsOn`. Flag the customer when either
is `false`.

This matters more than it looks. Maul sends **no confirmation when an order is placed on someone's
behalf**, so the customer's only signal is a human replying in Front. If their notifications are off too
they receive nothing from Maul at all — no reminder before the window closed, no word after. Two
consequences:

- **It's very likely why they wrote in.** Someone who never gets the reminder will keep missing the
  window and keep emailing. The fix is a sentence in the reply, not another late order next week.
- **The Front reply stops being optional.** For a both-channels-off customer it is the only thing
  between them and turning up to no lunch. Say so when you list the conversations awaiting a reply.

Record `"notifications": {"email": false, "sms": false}` as the system reports it, not only the false
ones. Don't change the setting and don't tell the customer it changed — it's theirs to set and this
skill has no tool for it.

Dedupe by the **resolved** account email, not the sender address: one account emailing twice from two
addresses is one customer with two sets of lines. Display names and account names differ more often than
you'd expect (married name, transliteration, preferred first name) — not a red flag when the address
matched directly, but note it so the operator isn't surprised.

## Step 7 — Tag genuine late-order conversations

For every conversation you're keeping (including uncertain ones), check `tagIds`. If it lacks
"Seinpöntun", add it with `mcp__Front_MCP__tag_conversation` (`addTags: ["tag_ydhxe"]` — confirm with
`mcp__Front_MCP__list_tags` if it ever looks wrong; tag IDs aren't guaranteed stable). Don't touch
conversations you excluded in Step 3.

## Step 8 — Resolve each request against the real menu

Every requested dish becomes a *line*: one customer, one date, one sitting, one dish. A single email
often produces several. Resolve each against the actual menu before showing it to anyone.

```bash
python3 scripts/get_week_label.py              # ISO week containing today
python3 scripts/get_week_label.py --offset -1  # previous week
```

Requested dates are usually in the **current** ISO week. `mcp__Maul_mcp__getLocation` (with
`LocationId` from Step 6) gives the two things that matter: `DefaultMenu`, the location's blueprint menu
ID (`muninn`, `freyja-b`); and `ActiveDays`, which weekdays it gets Lunch and Dinner at all — a location
with `Lunch: [6,7]` has weekend-only service, which immediately tells you what "tomorrow" means.

Then `mcp__Maul_mcp__listBlueprintMenus` for the ISO week, filtered to the entry matching
`(BlueprintMenuId, MealTime)`. Each `Menu` item carries `Date`, `MealTime`, `RestaurantName`,
`ShortDescriptionByLang.is`/`.en`, `DietTypes`, `Allergens` and `MenuItemId`.

> **Two API traps, both of which return nothing useful rather than erroring.**
> `mcp__Maul_mcp__listMenus` ignores its `limit` and applies `locationId` only to the page it already
> fetched, so filtering by a real location commonly returns `filtered: 0`. `mcp__Maul_mcp__listLocations`
> mishandles `companyId` the same way — use `search` instead. Go through `listBlueprintMenus` plus the
> location's `DefaultMenu`; it's the only reliable path. Both calls also return responses large enough
> to spill to a file — parse that with `python3`/`jq` rather than re-reading it whole.

**Classify each line:**

- `matched` — exactly one dish on that date + sitting matches. Record the Icelandic and English names
  plus **all five fields the write call needs**: `RestaurantId`, `MenuItemId`, `MenuId`, `MealTime`,
  `Date`. Every one is on the menu item you just matched — don't reconstruct them later from the dish
  name. `RestaurantId` is the slug (`spiran`), not the `RestaurantName` you display (`Spíran`);
  `MenuId` is the blueprint menu the dish came from (`muninn-b`), not the location's `DefaultMenu` root
  (`muninn`).
- `ambiguous` — real but underspecified: no sitting given and both have a candidate, a diet named
  ("Vegan") rather than a dish, an unreadable screenshot carrying the choice. Record every plausible
  option with the same five write fields on each, so a resolved ambiguity is placeable without
  re-querying.
- `not_on_menu` — nothing that day matches. Don't guess a substitute; the customer needs a reply.
- `no_service` — the location doesn't get that sitting that weekday, per `ActiveDays`. Distinct from
  `not_on_menu` on purpose: "we don't serve dinner at your office on Fridays" is a different reply from
  "that dish isn't on Friday's menu". Check `ActiveDays` before concluding a dish is missing.
- `allergen_clash` — see below; never placed on a batch answer.
- `other_people` — the request covers someone besides the sender. See below.
- `service_paused` — the date falls inside a `PauseServiceDateRanges` entry. See below.
- `same_day` — **today's lunch**, or a date already **past**. Set it regardless of whether the dish
  matched, and keep whatever dish fields you resolved. Carry a short `flagReason` ("today's lunch",
  "date already past"). **Today's dinner is not `same_day`** — see below.

### The two rules that decide what can be placed

Full reasoning for every held-back status — paused service, requests covering other people, mistyped
dates — is in **`references/line-statuses.md`; read it while you classify.** Two of them are load-bearing
enough to state here as well, because Step 10 enforces them:

**Same-day: dinner is fine, lunch is not.** Dinner can still be added on the day, so a today-dinner
line resolves normally, is *not* `same_day`, counts in "ready to place" and rides the batch — place it
promptly and name it in your report so ops can tell the kitchen. Today's **lunch** is already cooked,
counted and on a van, so it is `same_day` and never placed by a run; nothing upstream will stop you,
because `createOrder` runs with FoodServiceProvider privileges and accepts today's date, and
yesterday's, without complaint or error. Your own date check is the only thing between a customer's
email and a phantom order. Flag it rather than dismissing it — lunch can occasionally still be arranged
if someone rings the kitchen, and the point of the rule is that the decision belongs to a person.

Work out "today" from the real current date in **Atlantic/Reykjavik** — check with `date` rather than
assuming the container clock or reusing a date from earlier in the run. A run spanning midnight will
otherwise flag the wrong lines and get the lunch/dinner split wrong too.

**An allergen overlap stops the line.** Compare the customer's `Allergens` from Step 6 against every
matched dish's. Any overlap makes the line `allergen_clash`, and that is **never placed as part of a
batch** — it needs an explicit, line-specific yes of its own. A warning printed next to a line the
operator is confirming in bulk is not a safeguard; it's something to click past, and this is the one
flag where the cost of being wrong isn't an annoyed customer. Don't resolve it in either direction: a
customer may know their profile is out of date or that they tolerate a trace amount, and that's theirs
to state, not yours to assume — and equally not yours to refuse on their behalf. Surface both facts
(what the dish contains, what their profile says) and let a person ask.

A held-back line is not a failure of the scan and must not be buried. The customer wrote in, the
request is real, and someone has to decide today whether it can still be filled.

## Step 9 — Build the review artifact

Write the resolved data to `data.json` and build the page. **`references/review-artifact.md` has the
JSON shape, the per-status fields and what the script derives — read it now.**

**The artifact never places orders.** It carries no JavaScript at all: artifact code runs in a sandbox
that deliberately cannot reach MCP tools (connector tokens never enter it), so a "place order" control
there would be theatre. Its job is to make the operator's read fast and the decision obvious.

Deliver the HTML with `SendUserFile`. If a desktop is connected, also call
`mcp__remote-devices__create_artifact` with the returned `file_uuid` so the operator can reopen it later.

## Step 10 — Confirm in chat, then place the orders

**Every run ends with this offer — not optional, not conditional on the operator asking.** Placing the
orders is the one genuinely consequential thing this skill does, so the run finishes by putting that
decision in front of them rather than going quiet after delivering a file. Don't bury it in prose; make
it a real `AskUserQuestion`.

The operator answers **one question and no more** (10b): how they want the eligible lines fulfilled.
Picking "place them through Maul" *is* the authorisation — place them on that answer and don't ask
again. A run that asks twice about the same batch trains the operator to click through without reading,
which is exactly the failure a confirmation exists to prevent. The price of collapsing it to one
question is that the one question has to carry everything — the count, what "all" leaves out, the
replacement conflicts, the doubtful dates. Do that work *before* you ask, not after.

"One question" governs **the batch**. A line the skill held back (10d) was never in the batch and never
joins it, so a later per-line yes/no about one of those is not the second confirmation this rule
forbids — it's a different decision, raised by the operator, on its own terms.

### 10a — What's eligible

A line is automatically fulfillable only when **both** halves are certain: we know *who* and *what*.

- **Who** — the customer resolved at **High** confidence in Step 6. Low and no-match never reach this
  step; ordering under a guessed account puts a meal on a stranger's desk.
- **What** — the line came back `matched`, and only `matched`. An `ambiguous` line becomes eligible
  once the operator names the sitting. `not_on_menu`, `no_service`, `service_paused`, `allergen_clash`
  and `other_people` never are — the first three because there's nothing to order, the last two because
  a person has to answer a question first.
- **When** — **today's dinner is eligible** and rides the batch like any other line; say so when you
  ask, since the operator may expect otherwise. Today's **lunch** and any **past** date are `same_day`
  and never automatically eligible. State the `same_day` count when you ask, so "all N" is visibly not
  "everything in the artifact".

Everything else is reported for manual handling, never swept into a batch.

### 10b — Ask how they want it fulfilled — this is the gate

Two fulfilment paths, and the operator picks; some days they'd rather eyeball each order in the Maul UI
than have it placed for them.

- **Place all N through Maul** — `createOrder` per line, on this answer. Put the count in the option
  itself, so what they're authorising is legible without reopening the artifact.
- **Open the tabs in Chrome** — one impersonation tab per customer (deduped by account email, not per
  line), pointed at the verification screen with that customer's eligible lines already selected, so
  they confirm a prefilled selection instead of hunting the menu grid. URL shape in
  `references/review-artifact.md`.
- **Neither — just the artifact** — nothing placed, nothing opened. Say plainly that the artifact and
  the Front conversations are untouched, so they can come back and confirm later.

An operator can always answer something narrower — "all except line 7", "just Arnar's". Honour it
exactly; never place a line they excluded, and never widen a narrowed answer.

**Because this is the only question, it has to carry what they need to answer it well.** The count goes
in the option label ("Place all 11 through Maul") and everything else in the question body — never in a
message before the widget, where it scrolls away, and never spread across the option descriptions,
which read as competing paragraphs rather than one brief. In the body, in this order:

- **What "all" excludes** — the lines needing a decision, with the `same_day` count named separately.
- **The replacement conflicts.** Run the `listUserOrders` check (`references/order-writes.md`) *before*
  asking, and name every line that would replace an existing dish, with both dishes: "line 7 replaces
  Arnar's Chili Con Carne for Sun dinner with Lasagne". That's the one outcome an operator would want
  to veto, and with a single question this is the only place they can.
- **Any `dateWarning` line's two readings** — the customer's written date next to the resolved one.
  This is the moment a typo gets caught, and it costs one clause.
- **Anything for today** — name the today-dinner lines, since they go in with the rest.

These are exceptions, not a manifest: on a normal run they're a handful of lines and the body stays
short. **Never list the clean matched lines** — that's what the artifact is for, and padding the
question with rows nobody needs to act on is how the flagged ones get skimmed past. If the exceptions
genuinely run long, compress each to one line (`#7 replaces Arnar's Chili Con Carne (Sun dinner) with
Lasagne`) and point at the artifact by row anchor. Never drop an exception to make it fit — drop words,
not lines.

**Offer only the paths that exist in this session.** Check before asking: `mcp__Maul_mcp__createOrder`
is usually deferred rather than preloaded, so `ToolSearch` for it by name — "not in my tool list" is not
"not in this session". For tabs, `mcp__remote-devices__Control_Chrome__open_url` when the desktop bridge
is connected, otherwise the `mcp__claude-in-chrome__*` tools. Genuinely absent → drop that option and
say the artifact's per-customer links are the manual route. If only one path exists, say which and why
the other doesn't, rather than silently narrowing the choice. If neither does, skip to reporting.

On the **Chrome** path, opening the tabs is the end of it: report which customers got one, and note
that nothing has been ordered — opening a tab orders nothing, and they're about to confirm each
selection on the verification screen anyway. On the **Maul** path, that same answer is the go-ahead:
place them (10c) and don't ask again.

### 10c — Place them

One `createOrder` call per confirmed line, using the customer's confirmed account email from Step 6 and
the line's write fields from Step 8. **Read `references/order-writes.md` first** — it holds the call
shape and the traps, including why `replace: true` is never correct here.

- Never call `createOrder` before the operator's 10b answer — the artifact on its own is not
  authorisation, and neither is a line simply being eligible.
- Never place a line the operator excluded, or one for a customer below High confidence.
- Never place `ambiguous` — the operator names the sitting first, at which point it's a normal matched
  line. Never place `not_on_menu`, and don't offer a substitute on your own initiative.
- **Never place `allergen_clash` on a batch answer, ever.** It takes the customer's own yes, relayed
  line by line (10d) — either already in the operator's instruction, or in answer to a question that
  names the allergen and says the customer's own profile flags it.
- **Never place `other_people`, `no_service` or `service_paused`.** None can be satisfied by a
  `createOrder` call — one needs a second account, one needs a different day, one needs the customer to
  say whether they're actually here that week.
- **Never place `same_day` as part of any batch** — today's lunch or a date already gone — and never
  let one ride on an "all of them" answer. Today's lunch is already made or delivered; placing it
  creates an order the kitchen never sees. Those go through 10d, one at a time. **Today's dinner is not
  in this category** and is placed with the rest.
- Report per line, not as a single pass/fail: a batch where line 9 fails and the rest succeed needs to
  say exactly that, because the operator now has one customer to chase and ten to leave alone.
- **List the lines you placed, one row each**, so they can check the batch against what they
  authorised: `#4 · Arnar Jónsson (arnar@x.is) · Kjúklingasúpa · Spíran · Wed 19 Aug · Lunch`. Mark the
  replacements and any today-dinner lines.
- After a successful placement the conversation still needs a reply. Don't send it — say which
  conversations are waiting on one, customers with notifications off at the top of that list, and hand
  the drafting to `maul-late-order-reply-drafts` (see the hand-off at the bottom of this file).

### 10d — Fulfilling a line that was held back

Two kinds can still be placed after a person looks at them: `same_day` (today's lunch) and
`allergen_clash` once the customer has confirmed. Both take the same route — the operator raises it,
names the line, and answers a dedicated yes/no. (`other_people` and `no_service` have no such route: no
answer makes `createOrder` able to fill them.)

`same_day` doesn't mean "refused" — it means "a person decides". Sometimes the answer is yes: the
operator rings the kitchen, there's room on the van, and the customer gets their lunch. The skill's job
is to make that a deliberate act rather than something that happens by accident inside a batch.

- **Never fold it into a batch, and never offer it as an option** in the 10b question. Do surface the
  flagged lines when you report, naming each one — that's how the operator knows there's a call to
  make. Surfacing is not prompting: you name them and stop, and the instruction has to come from them.
  What you must never do is *infer* that instruction from a blanket answer — if their wording could be
  read as covering a held-back line, ask about that line specifically rather than assuming either way.
- **The instruction must name the line** — "place line 7, I've spoken to the kitchen". A blanket "yes,
  place them all" or "go ahead" **never** covers a same-day-lunch line, however emphatic.
- **A named instruction is the authorisation — place it and don't ask again.** "Place line 7, I rang
  the kitchen" names the line and gives the reason; re-confirming it is the same double-prompt this
  skill removed from the batch flow. Ask only when the wording *doesn't* settle it: a blanket answer
  that might be reaching for a held-back line gets one dedicated yes/no naming what makes that line
  unusual — "Line 7 is today's lunch, which isn't placed automatically because the kitchen has already
  cooked and counted. Place it anyway?" — and only an explicit Yes proceeds.
- **The allergen line is the one exception**, because what's missing isn't the operator's permission but
  the *customer's*. If the operator has already relayed it ("Anna says place it anyway"), that's enough
  — place it. If not, ask once, and ask for the customer's word rather than theirs: an operator's "yes,
  place it" on its own never clears an allergen flag. Any question you do ask must name the allergen and
  say the profile flags it — "Line 4 is Kjúklingasúpa, which contains gluten; Anna's profile lists
  gluten. She's confirmed she wants it?"
- **On the Chrome path**, build a verification URL carrying that single line rather than adding it to
  the customer's normal tab, so nothing else can be confirmed alongside it by accident.
- **Report these placements separately** from the clean batch, naming the line and the day — ops needs
  those visible, not blended into a success count.
- A date genuinely **in the past** deserves a flat no rather than a prompt: no arrangement with the
  kitchen produces yesterday's lunch. Say so and move on to the reply the customer needs.

## Step 11 — Post the decision comment to Front

The artifact lives in one chat and is gone in a week; the Front conversation is where the next person
picks this up. Every conversation the run touched gets **one internal comment recording what was
decided**, posted after the placing step — or after a "just the artifact" answer, because the record
matters either way.

**`references/front-comment.md` has the template and the section rules, including the
`ConsentAllergensData` rule for naming an allergen in a comment that outlives the run. Read it before
posting.**

## Step 12 — Report back: terse and scannable

Keep it short. Don't narrate steps you took or restate this skill's logic back to the user.

- One line: candidates found, order lines resolved, translation comments added (splitting full from
  dish-name-only), decision comments posted, over what window.
- Point at the artifact rather than restating its proposals. The placed-lines list from 10c stays —
  the artifact holds what was *proposed*, only the report records what *happened*. What doesn't belong
  is the board row by row, the `createOrder` payloads, or the Front comments you just posted.
- Don't list or explain the conversations you excluded as clearly-not-a-late-order.

Then, **only if any exist**, a called-out section for each of:

- Dish names flagged `— unclear` in Step 4, so someone who reads Icelandic can settle them.
- Customers who didn't make the artifact because confidence wasn't High — the sender's original
  address, the probable account email if you found one, and whether it was Low or no match at all.
- **Today's dinner** lines, proposed or placed, so ops can tell the kitchen a late plate is coming.
  These are placed like any other line, so the point is visibility, not a decision.
- `same_day` lines — today's **lunch**, or a date already past: which customer, which day, what they
  asked for. Each is a decision somebody has to make today and the run has deliberately not made it.
- Customers whose notifications are off — name them, say which channels, and mark the both-off ones as
  needing a reply rather than merely deserving one.
- `allergen_clash` and `other_people` lines — these need a person to go back to the customer with a
  question, and they're the easiest to lose.
- Lines that came back `not_on_menu`, `no_service`, `service_paused` or `ambiguous`, and conversations
  where you were genuinely unsure it was a late-order request at all.

Step 10's offer, not the report, is what the run builds to: report, then ask how they want it fulfilled
— and on the Maul path place on that one answer, without asking again. The Step 11 comments go up once
that's settled: the report is the last thing you write, not the last thing you do. Close by offering the
customer replies (below).

## Hand off — the customer still doesn't know

A placed order is not a finished job. `createOrder` notifies nobody, so at the end of a successful run
every customer in the batch is where they were before they emailed: no idea whether anyone read it. The
ones who most need a reply have notifications off — nothing else reaches them at all.

This skill does not write to customers. **`maul-late-order-reply-drafts` owns that job**: one Front
draft per conversation, in the customer's own language, never sent. Hand off to it as the last act of
the run rather than drafting replies here — it knows the tone for each outcome (plain confirmation,
itemised readback, needs-a-decision), applies the ordering-window rule (dinner same-day until 16:00,
next-day lunch before 16:00 the day before, lunch never same-day), and appends the notification-settings
reminder for customers with email or SMS off.

Offer it explicitly once the report is out — "want me to draft the replies?" — and name the
conversations it would cover, including the ones where the answer is a *question* (allergen conflicts,
`other_people`, `same_day` lunch) rather than a confirmation. Those need a reply just as much as the
placed lines, and are the easiest to lose.

## Notes on environment

Opening tabs needs a browser control path — `mcp__remote-devices__Control_Chrome__open_url` (desktop
bridge) or the `mcp__claude-in-chrome__*` tools. In a plain cloud session run from a browser **neither
exists**, and there is no workaround: the session's own Chromium is inside the sandbox, so a tab opened
there is invisible to the operator and carries none of their Maul cookies — driving it would look like
progress while placing nothing. Say so plainly and point at the artifact's per-customer **Open
verification** links: same preselected `ms` parameters, they work everywhere, and one click per customer
is most of what tab-opening was buying.

The same applies to `createOrder`: presence is a per-session fact, not a given. Check, then offer. Never
report an action as done because the skill file says the capability exists.
