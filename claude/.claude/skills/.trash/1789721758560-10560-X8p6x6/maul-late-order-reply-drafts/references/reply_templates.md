# Reply shapes

Front has no API to list or fetch saved canned-response templates, so nothing
here can literally be "the Ekkert mál template" pulled from Front — that name
is unverifiable from a tool call and will drift out of sync with whatever
staff actually have saved there. What follows is the same three tones Jennie
described, written out so a draft matches the voice Maul customers already
get, in both languages. Treat every line here as a starting point you adapt
per line, not text to paste verbatim — the placeholders in `[brackets]` are
exactly the parts that must change every time.

Keep the whole reply short. These are late-order emails, not newsletters —
one screen, no headers, no bullet lists. Sign off simply; don't invent a
named sender ("Bestu kveðjur, Maul teymið" / "Best, the Maul team") unless the
conversation shows a teammate signing their own name, in which case match
that.

## 1. Confirmed & placed — house style (default for any line placed with no issues)

**As of 2026-08-28, this is Jennie's standing house template** for every line that
placed cleanly (all `matched`, no `same_day`/cutoff issue, nothing flagged) — it
replaces the old free-form "plain"/"itemised" split below. Use it verbatim,
whether it's one line or several; don't itemise the dish back to the customer
unless they specifically asked for a description of what was booked (see the
optional readback line at the bottom).

**Icelandic**

```
Hæhæ,

Ekkert mál, þetta er komið!

Þú getur skoðað pöntunina þína inn á [Maulinu](https://app.maul.is/orders) þínu hvenær sem er.

Okkur þætti ótrúlega vænt um að heyra hvað þér finnst um þjónustu okkar. Þú getur skilið eftir umsögn á Google með því að smella á þennan hlekk.
https://g.page/r/CUY4tbTlcV1dEAE/review

Kær kveðja
```

**English**

```
Hi!

Yes, no problem — this is in.

You can view your order anytime in your [Maul account](https://app.maul.is/orders).

We'd really love to hear what you think of our service — you can leave us a review on Google by clicking this link.
https://g.page/r/CUY4tbTlcV1dEAE/review

Best regards
```

**Optional itemised readback** — if the customer named a specific dish (the
"Er hægt að panta lýsingu" case) and Jennie wants it read back so they can
catch a mismatch before it's cooked, insert one short line per date/meal/dish
right after the "þetta er komið" / "this is in" line, before the Maulið
paragraph:

```
[Réttur] í [hádegi/kvöldmat] hjá [veitingastaður]
```
```
[Dish], [lunch/dinner] at [restaurant]
```

This is optional dressing on top of the house template, not a replacement for
it — the greeting, the Maulið link, and the review ask still belong in every
confirmed reply.

## 2. Needs a decision — can't be placed as asked, or needs the customer's word first

This is the case Jennie means by "tweak the responses as best fit" — these
are never a flat yes or no from a template; they're a genuine question back
to the customer, worded around the *specific* reason the line can't go
through cleanly. Never claim something is booked when it isn't, and never
flatly refuse without either an alternative or a question, because most of
these have a plausible fix, just not the one they asked for.

Pick the paragraph that matches the reason (from the decision already
recorded — see SKILL.md Step 2) and drop it into the house-style
greeting/sign-off ("Hæhæ," / "Hi!" ... "Kær kveðja" / "Best regards") —
**not** the "þetta er komið" / "this is in" line from shape 1, since nothing's
confirmed yet, and skip the Maulið-link/review-ask paragraph for the same
reason. Combine paragraphs if one customer has more than one kind of issue;
keep each to its own short paragraph.

**Two things every "needs a decision" reply must do, per Jennie (2026-08-28):**

1. **Always name the specific date** the line in question is for — every
   paragraph below already has a `[Dagsetning]`/`[Date]` slot; don't drop it
   even for a single-line reply where it might feel repetitive with the
   subject line.
2. **When the reason is that the order can't be placed exactly as asked
   because of *where* it should be delivered** (see the new
   `wrong_location` case just below), explicitly ask the customer to confirm
   the delivery location before anything is placed — don't guess and don't
   place under the account's default location silently.

**Delivery location doesn't match the account** (`wrong_location`) — the
sender's Maul account is registered at one location, but they've asked for
delivery somewhere else (this comes up with multi-station accounts, e.g.
Slökkviliðið staff on a rotating shift). Confirm which one before placing —
placing under the account default when they explicitly asked for somewhere
else risks the food going to an empty building.

- IS: "[Réttur] er ekkert mál — en aðgangurinn þinn er skráður á [skráð
  staðsetning], ekki [umbeðin staðsetning]. Áttu við að pöntunin fyrir
  [dagsetning] fari á [umbeðin staðsetning] í staðinn? Láttu mig vita og ég
  klára þetta strax."
- EN: "[Dish] is no problem — but your account is registered at [account
  location], not [requested location]. Do you mean for the order on [date]
  to go to [requested location] instead? Let me know and I'll get it sorted
  right away."

**Dinner cutoff passed today** (`dinner_cutoff_passed`)

- IS: "Því miður er nú liðið á tíma til að panta kvöldmat fyrir í dag — pöntun
  þarf að berast fyrir kl. 16:00 sama dag. Get ég boðið þér [réttur] fyrir á
  morgun í staðinn, eða hringir þú í eldhúsið til að athuga hvort enn sé
  hægt að bæta við?"
- EN: "Unfortunately the window to order tonight's dinner has closed — orders
  need to come in before 16:00 the same day. Can I put you down for
  [dish] tomorrow instead, or would you like us to check with the kitchen
  whether tonight can still be squeezed in?"

**Lunch requested for today** (`lunch_same_day`) — lunch is never same-day,
regardless of the time the email arrived, so don't offer to check with the
kitchen here the way you would for dinner.

- IS: "Því miður er ekki hægt að panta hádegismat fyrir sama dag — pöntun
  fyrir hádegi þarf alltaf að berast fyrir kl. 16:00 daginn áður. Á ég að
  setja þig inn fyrir á morgun?"
- EN: "Unfortunately lunch can't be ordered for the same day — a lunch order
  always has to come in by 16:00 the day before. Shall I book you in for
  tomorrow instead?"

**Lunch cutoff passed (asked for tomorrow, but after today's 16:00)**
(`lunch_cutoff_passed`)

- IS: "Því miður er núna liðið á tíma til að panta hádegismat fyrir á morgun
  — pöntun þarf að berast fyrir kl. 16:00 daginn áður. Á ég að setja þig inn
  fyrir [næsti mögulegi dagur] í staðinn?"
- EN: "Unfortunately the window for tomorrow's lunch has just closed —
  lunch orders need to be in by 16:00 the day before. Shall I book you in
  for [next available day] instead?"

**Date already in the past** (`date_in_past`) — don't offer a same-day fix;
just note it and ask what they'd like instead.

- IS: "[Dagsetning] er því miður liðin. Viltu að ég setji þig inn fyrir
  einhvern annan dag?"
- EN: "[Date] has already passed, unfortunately. Would you like me to book
  you in for a different day?"

**Not on that day's menu** (`not_on_menu`)

- IS: "[Réttur] er því miður ekki á matseðlinum [dagsetning]. Í boði [hádegi/
  kvöldmat] er [aðrir réttir ef við á] — segðu til ef eitthvað af því
  hentar, eða ef þú vilt sjá matseðilinn."
- EN: "[Dish] isn't on the [date] menu, unfortunately. [Other options if
  relevant] — let us know if one of those works, or if you'd like to see
  the full menu."

**No service that day/location** (`no_service`)

- IS: "Því miður er ekki [hádegi/kvöldmat] í boði hjá [staðsetning] á
  [vikudagur]. Er í lagi að skoða annan dag?"
- EN: "Unfortunately there's no [lunch/dinner] service at [location] on
  [weekday]s. Would another day work?"

**Allergen conflict** (`allergen_clash`) — name the allergen and the fact
their profile flags it; never place it without them saying so explicitly in
their reply.

- IS: "[Réttur] inniheldur [ofnæmisvaldur], sem er skráð í ofnæmisupplýsingum
  þínum hjá okkur. Viltu samt fá þennan rétt, eða á ég að finna annan
  valkost fyrir þig?"
- EN: "[Dish] contains [allergen], which is on file as something you're
  allergic to. Would you still like this dish, or should I find you a
  different option?"

**Covers more than the sender** (`other_people`)

- IS: "Pöntun er alltaf bundin við einn reikning, svo ég get því miður ekki
  sett fleiri en þig sjálfa/n á sömu pöntun. Ef [nafn] er með Maul aðgang má
  ég endilega bæta þeirra pöntun við sér — og ef þau eru gestur getum við
  stofnað gestaaðgang fyrir þau."
- EN: "An order is always tied to one account, so I can't add anyone else
  onto yours, unfortunately. If [name] has their own Maul account I can add
  their order separately — and if they're a guest we can set up a guest
  account for them."

**Service paused for that date** (`service_paused`)

- IS: "Samkvæmt okkar kerfi er þjónustan þín í fríi frá [upphafsdagur] til
  [lokadagur], sem nær yfir [umbeðin dagsetning]. Viltu að við tökum fríið
  af fyrir þennan dag, eða er þetta rétt og pöntunin átti ekki að fara inn?"
- EN: "Our records show your service is paused from [start] to [end], which
  covers [requested date]. Would you like us to lift the pause for that
  day, or is the pause correct and this order wasn't meant to go in?"

**Ambiguous — meal sitting or dish unclear** (`ambiguous`)

- IS: "Til að klára pöntunina vantar mig að vita hvort þú átt við [valkostur
  A] eða [valkostur B] fyrir [dagsetning]. Láttu mig vita og ég klára
  þetta strax."
- EN: "To finish this off, could you confirm whether you meant [option A]
  or [option B] for [date]? Let me know and I'll get it sorted right
  away."

## Notification reminder — append when notifications are off

Append this as its own short paragraph, after the main body and before the
sign-off, whenever the account's `EmailNotificationsOn` or `SmsNotificationsOn`
is `false`. It is the single highest-leverage sentence in the whole email for
a customer who keeps missing the ordering window: it's the fix that stops
this from happening again, not just an FYI.

**Icelandic**

```
Ábending: þú getur kveikt á tilkynningum í tölvupósti og/eða SMS svo þú fáir
áminningu áður en pöntunartíma lýkur og getir pantað sjálf/ur næst — það er
gert undir stillingum hér: https://app.maul.is/settings
```

**English**

```
Tip: you can turn on email and/or SMS notifications so you get a reminder
before the ordering window closes and can order for yourself next time —
you can switch these on under settings here: https://app.maul.is/settings
```

If only one channel is off, it's fine to say so specifically ("kveiktu á
SMS tilkynningum" / "turn on SMS notifications") rather than mentioning both
— but the settings link is the same either way, so always include it.
