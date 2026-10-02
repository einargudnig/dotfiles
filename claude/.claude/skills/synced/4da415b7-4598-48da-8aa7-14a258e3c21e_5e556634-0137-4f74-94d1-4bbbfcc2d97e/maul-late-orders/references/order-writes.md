# Writing orders with `createOrder`

Read this before the first `createOrder` call of a run. The traps here are the ones that cost real
meals — none of them raise an error.

## The call shape, one line per call

```
mcp__Maul_mcp__createOrder({
  email: "<confirmed account email from Step 6>",
  items: [{
    RestaurantId: "<line.restaurantId>",   // slug, e.g. "spiran"
    MenuItemId:   "<line.menuItemId>",
    MenuId:       "<line.menuId>",         // blueprint menu, e.g. "muninn-b"
    MealTime:     "Lunch" | "Dinner",
    OrderDate:    "YYYY-MM-DD"
  }]
})
```

`items` accepts several dishes at once, but keep it one line per call anyway — a per-line call gives
a per-line result, which is what Step 10's reporting rule needs.

> **Never pass `replace: true`.** It is destructive in a way that is easy to under-read: it makes
> `items` the complete truth for the entire date range those items span, and **deletes every other
> order the customer has on those dates**. A single Saturday-dinner line sent with `replace: true`
> wipes that customer's Saturday lunch. The default (`false`, merge) is always what a late-order run
> wants. There is no case in this skill where `replace: true` is correct.

## Two behaviours an operator will not expect — say them in your report

- **It orders past the cutoff and for past dates.** The call runs with FoodServiceProvider
  privileges, so a closed menu is not a guardrail. Nothing will stop you placing a nonsense date;
  your date resolution in Step 8 is the only check that exists.
- **The customer is never notified.** No confirmation email goes out — Courier isn't configured for
  this service. Every placement leaves a Front conversation owing the customer a reply. List those,
  and say plainly that the customer currently has no idea the order exists.

## The duplicate check is mandatory, and the risk runs backwards

A customer gets **one dish per date + meal time**. Ordering into a slot they have already booked does
not create a second meal; it **silently replaces** the dish that was there. The swap comes back in
the response's `replacedSlots`.

So the failure mode is not double billing. It is a customer who wrote *"getiði bætt við"* — ambiguous
in Icelandic between *add a meal* and *swap this one* — meaning "add Sunday to my weekend" and losing
the Saturday dish they already had. Nothing errors; the meal just quietly changes.

Before placing, call `listUserOrders` for each customer and the relevant ISO week:

- **No existing order for that date + sitting** — safe to place.
- **An existing order for that date + sitting** — name it in the Step 10b question, with both dishes,
  framed as the replacement it is: *"Arnar already has Chili Con Carne booked for Sun dinner; line 7
  replaces it with Lasagne, it doesn't add to it."* The operator can exclude it in their answer. If
  they don't, place it and report the replacement. If they want the customer to end up with both,
  that is not possible in one slot — the answer is to reply to the customer, not to place anything.

Run this check **before** the 10b question, not after placing. The conflicts have to be visible while
the operator is deciding, because that answer is the only gate.

**Always relay `replacedSlots` from every response**, including where you expected the slot to be
empty. A non-empty `replacedSlots` you didn't predict means the duplicate check missed something —
say so plainly rather than reporting the line as a clean success.

> If `mcp__Maul_mcp__createOrder` genuinely isn't present in the session, don't stall the run: say so,
> offer the Chrome path instead, and never imply an order was placed when it wasn't.
