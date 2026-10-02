# Judging the held-back statuses

Read this while classifying in Step 8, whenever a line is heading for anything other than `matched`.
It holds the reasoning behind each held-back status — the enforcement itself is in Step 10.

### Same-day requests — dinner is fine, lunch is not

The two sittings are not the same problem.

**Today's dinner: place it like any other line.** Dinner can still be added on the day, so it resolves
normally, counts in "ready to place", and rides the operator's batch. Two things anyway: place it
promptly rather than at the end of the run, and **name it in your report** ("line 3 is tonight's
dinner") so ops can tell the kitchen a late plate went on.

**Today's lunch: never as part of a run.** By the time anyone reads this inbox, today's lunch is
cooked, counted and on a van; placing it automatically creates a meal nobody is making. Nothing
upstream stops you — `createOrder` runs with FoodServiceProvider privileges, so a closed menu is not a
guardrail and it accepts today's date, and yesterday's, without complaint or error. Your own date check
is the only thing between a customer's email and a phantom order.

But **flag it rather than dismissing it.** Occasionally lunch can still be arranged if someone rings
the kitchen. The point of the rule is that the decision belongs to a person, not that the answer is no.

So for a **lunch** line dated today, or **any** line dated earlier:

- Mark it `same_day` with a `flagReason`, and resolve the dish anyway so the operator has something
  concrete to act on.
- It gets an amber **same day** pill and lands in the artifact's "Needs a decision" block.
- It is never counted in "all N lines", never in a batch, and never preselected in a verification tab —
  only `matched` lines get preselected, so it can't arrive pre-ticked in a tab opened for the whole
  customer.

Work out "today" from the real current date in **Atlantic/Reykjavik** — check with `date` rather than
assuming the container clock or reusing a date from earlier in the run. A run spanning midnight will
otherwise flag the wrong lines and get the lunch/dinner split wrong too.

A held-back line is not a failure of the scan and must not be buried. The customer wrote in, the
request is real, and someone has to decide today whether it can still be filled.

> Maul's precise cutoff times — how late tonight's dinner can be added, how late tomorrow's lunch — are
> being worked out separately and this skill deliberately doesn't encode them. It knows two things:
> today's **dinner** is placed like any other line, today's **lunch** is never automatic. Defer to a
> dedicated time-rules skill for the detail if one is in the session.

### Allergen conflicts stop the line

Compare the customer's `Allergens` from Step 6 against every matched dish's `Allergens`. **Any overlap
makes the line `allergen_clash`, and that is never placed as part of a batch** — it needs an explicit,
line-specific yes of its own.

A warning printed next to a line the operator is confirming in bulk is not a safeguard; it's something
to click past. This is the one flag where the cost of being wrong isn't an annoyed customer.

Don't resolve it in either direction. A customer may know their profile is out of date, or that they
tolerate a trace amount — that's theirs to state, not yours to assume. Equally, don't refuse on their
behalf. Surface both facts (what the dish contains, what their profile says) and let a person ask.

### Dates inside a paused service period

`getUserByEmail` returns `PauseServiceDateRanges` — periods where the customer switched service off,
typically a holiday: `[{"id": "…", "start": "2026-07-10", "end": "2026-07-29"}]`. ISO dates,
**inclusive both ends**, and the array holds historical ranges too — most of what you'll see is last
year's summer and irrelevant. Only a range actually covering a requested date matters. An overlap makes
the line `service_paused`; carry `"pausedRange": "2026-07-10 → 2026-07-29"` on it.

Don't place it, and don't assume the pause is stale — the two readings point opposite ways and only the
customer can settle it. Either they forgot to lift a pause and genuinely want lunch, or they're away
and something has produced a request they didn't mean. Ordering into a pause in the second case puts a
meal on an empty desk and a charge on their account while they're on a beach. This skill has no tool
for lifting a pause, so there's nothing to auto-fix even when the answer looks obvious.

### Requests that cover more than the sender

Watch for "order for me and Jón", "two portions", "one for our visitor tomorrow", "the whole team wants
the soup". `createOrder` places one order against **one account** — there is no quantity field that
feeds a second person, and two lines onto one account just replaces the first dish.

Mark those `other_people` and place nothing. The operator resolves who is actually eating: each named
colleague needs their own account (`getUserByEmail` / `listUsers`) and becomes their own customer with
their own lines; a genuine visitor needs a guest account, and `mcp__Maul_mcp__createGuestAccounts`
exists for exactly that — but creating one is an operator decision, never something a scan does.

The sender's own portion proceeds normally if separable — split it into its own `matched` line and flag
only the rest. Don't hold a whole email hostage to one unresolved colleague.

### Dates the customer probably got wrong

Customers mistype dates constantly — "Saturday, July 15th" in an August email whose subject says 15
August; a weekday that doesn't fall on the date given; "tomorrow" in a message that sat unread two
days. Trust the combination of subject, dish and the location's active days over a single typed date.

When the readings disagree, resolve to the likelier date **and put the discrepancy on the line** as
`dateWarning` — a short phrase naming both ("they wrote Saturday 15th; the 15th is a Friday").

The line stays placeable — most are obvious typos and holding them all would make the run useless — but
**the 10b question must show the customer's written date next to the resolved one** for any line
carrying a `dateWarning`, so the operator confirms against what the customer actually said. If both
readings are genuinely plausible that's not a warning, it's `ambiguous`: don't pick for them.

