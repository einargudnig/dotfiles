---
name: maul-detrack-split-job-collection
description: Assign Maul's restaurant collections (pickups) to drivers in the Detrack web dashboard, and add helper drivers to big collections without breaking the jobs or the portion count on the on-time dashboard. Use whenever ops asks to assign collections or pickups to drivers, plan the day's driver routes, "duplicate" or "split" a collection, add a helper for a large restaurant, move a collection to another driver (e.g. "Tokyo Sushi is now for Óskar"), check or verify that the day's collections and helper jobs are set up correctly, or anything like "assign the collections, use each driver once, and double the ones over 70 portions", even if Detrack or the dashboard is not named.
---

# Assigning restaurant collections in Detrack

Ops asks for this most mornings, usually in one line such as:

> Can you assign the collections to drivers, make sure to only use each driver once, and duplicate the collections with more than 70 portions and assign someone to help.

The work happens in the Detrack web dashboard (Jobs → Collections for the day) through the browser.
Everything there also feeds the on-time dashboard (on-time.maul.is), which counts portions from the Pieces column.
"Duplicate" in the request means "add a helper job", and how you create that job matters a lot, so read "Adding a helper" before touching anything.

## Telling the jobs apart

The Collections tab mixes several kinds of job. Only two matter here:

- **Restaurant collections** made by Maul's backend: D.O. No. like `C-Lunch-<restaurant>`, zone `RESTAURANT-COLLECTION`, Pieces = the restaurant's portion count.
- **Helper jobs** made by ops: D.O. No. like `DET6418909878` (Detrack picks it), company name like `Indian Food Box með Jakob`, Pieces empty.

Leave `D-BOX-…` jobs (zone `BOXES`, restaurant box deliveries) and `C-Dinner-…` jobs alone unless ops asks about them.

## Start by checking what is already there

This skill often runs on a day that is partly or fully done: ops made some helpers by hand, an earlier run was interrupted, or ops just wants to be sure.
Creating jobs without looking would give a restaurant a second helper and a driver a second pickup.
So before asking anything or changing anything, read the day's Collections list (all pages, it is paginated) and take stock.
If the list offers a larger page size, pick the largest so there are fewer pages to read.

For each lunch collection (`C-Lunch-…`) work out:

- **Main driver:** the collection's own Assign To. Blank means unassigned.
- **Helper:** a `DET…` job whose company name is the restaurant's name followed by "með".
  Ops types these freely (`eldhúsið okkar með Yassin`, `cibo amore með Róberti Lauf`), so compare loosely, ignoring case and accents.
  Use the address to confirm a match, but never match on address alone: two restaurants can share one (Eldabuskan and Matarkompaní are both at Hlíðasmári 8).
  The name after "með" should be the collection's main driver, not the helper's own driver (see "Moving a collection to another driver").
- **Needs a helper:** Pieces is more than 70.

Then put every collection in one of three groups:

- **Done:** it has a main driver, and if it needs a helper it has exactly one, assigned, with a `DET…` number, empty Pieces, and the main driver's name after "með".
- **Missing:** no main driver, or it needs a helper and has none, or its helper has no driver, or its helper's name still has a previous main driver after "með" (the collection was moved and the helper was not renamed).
- **Looks wrong:** a helper whose D.O. No. does not start with `DET` (like `C-Lunch-indianfoodbox-2` or `matstodin-pickup-2`), a helper with Pieces filled in, two helpers for one restaurant, or a helper on a collection that is now 70 portions or fewer because orders changed.
  Also mention any driver on more than one job; ops sometimes does that on purpose (two restaurants at one address), so it is a question, not an error.

What happens next depends on what you found:

- **Everything is done:** say so and stop. Show the summary table and change nothing, for example:
  > All 23 lunch collections have a driver, and all 13 over 70 portions have a helper set up correctly. Nothing to change.
- **Something is missing:** take only the missing items through the check-in below. Never recreate anything that already exists.
- **Something looks wrong:** list each one with what is wrong and ask ops what to do.
  Put any helper without a `DET` number first and say it plainly: the backend will delete it at its next run, within 15 minutes, so ops should replace it now.
  Do not delete or edit those jobs yourself: a driver may already be on the way, and deleting their job strands them.

## Check with ops once before changing anything

Ops knows things Detrack does not: who is on shift, who is running late, which restaurant needs an extra hand today.
So for whatever the scan found missing, put the drivers and the plan to ops in **one** message, and change nothing in Detrack until ops says go.
One message matters: every question is a wait for ops to reply, and that wait is most of the time this job takes.

**Who is on shift: Sling.**
Sling is the rota and the source of truth for who is on duty.
Open the day view for all locations, e.g. https://app.getsling.com/shifts?mode=day&tab=alllocations&date=2026-10-06 (change the date).
The page only draws the rows on screen, so scroll down and read the page text after each scroll until you have as many shifts as the **SHIFTS** count in the header.
Lunch drivers have a shift of about 9:45 AM - 12:15 PM as **Driver • Maul Reykjavík** or **Driver on Maul car**.
Ignore **Dinner driver - weekdays** shifts (5:30 - 7:00 PM) for lunch, people with 0h and no shift, and anyone with **Time off** or unavailable.
If Sling shows a banner offering to change the time zone, leave it alone.
Ops is logged in there already; if Sling will not open or asks for a login, say so and ask ops for the driver list instead.

Sling has full names (`Kári Kristjáns`, `Jakob Bystrom`, `Haukur Darri Darri Pálsson`), while Detrack's **Assign To** list has short ones (`Kári Kri`, `Jakob`, `Haukur`).
Match on the first name plus as much of the second as Detrack shows, because several drivers share a first name (`Róbert Laufdal` and `Róbert Orri`, `Dagur Ingi` and `Dagur Örn`, `Tumi Fannar` and `Tumi Þorvars`).
Mention any match you are unsure of rather than guessing, and any Sling driver you cannot find in Detrack at all.

**The plan.**
Work out the assignments from the Sling drivers, following the rules below, and send everything together, for example:

> For lunch on Tue 6 Oct, Sling has 24 drivers on shift. Here is the plan:
>
> | Restaurant | Portions | Driver | Helper |
> |---|---|---|---|
> | Indian Food Box | 151 | Jakob | Kári Kri |
> | Mí Bowls | 27 | Rúnar | - |
>
> Rename: `Tokyo Sushi með Astra` becomes `Tokyo Sushi með Óskari`, because Óskar now has Tokyo Sushi.
> On shift but not used: Agnes, Bartek.
> Not sure: Sling's "Róbert" could be Róbert Lauf or Róbert Orri in Detrack - I picked Róbert Lauf.
>
> Go ahead, or anything to change?

If ops did not name a day, use the next working day's lunch and say so in the same message rather than asking first.
Make the changes in Detrack only after ops says go, and apply any edits they ask for first.

## The assignment rules

- Work on the lunch collections for the day ops confirmed.
- Give each driver at most one job, counting helper jobs too.
  A driver who is already the helper on one restaurant must not get a second one.
- A collection with more than 70 portions gets one helper job, assigned to a second driver.
- A helper job's name always names the collection's main driver, whoever the helper itself is assigned to.
- If a collection is so large that one helper clearly is not enough, or there are not enough drivers to follow these rules, stop and ask ops rather than guessing.

## Adding a helper

Create the helper as a **new collection with Add Collection**. Never duplicate or copy the original job.

Fill it in the way ops does by hand:

- **D.O. No.:** do not type anything here, not even a number that looks tidy like `matstodin-pickup-2`.
  Leave it empty (it shows "Auto-generated") so Detrack assigns a `DET…` number itself.
  This is the one field that decides whether the job survives; see below.
- **Company Name:** `<Restaurant> með <main driver>`, e.g. `Indian Food Box með Jakob` or `Tokyo Sushi með Jökli` (ops writes the driver's name in Icelandic dative; match that if you can, the plain name is fine if not).
- **Address:** the restaurant's address, same as the original job.
- **Date:** the same day. **Job Time:** 10:40, as ops uses for helper jobs.
- **Pieces:** leave it blank.
- **Assign To:** the helper driver.
- Leave zone and group empty.

Why it has to be done this way:

- Every 15 minutes (08:00 - 19:45 UTC) Maul's backend compares Detrack with the orders and **deletes every job it did not create itself**, for today and the next six days, in any group.
  The only jobs it never touches are those whose D.O. No. **starts with `DET`**, plus completed jobs.
  So a helper numbered `matstodin-pickup-2` or `C-Lunch-indianfoodbox-2` disappears at the next run, even when a driver is already on the way, and a helper made the evening before is gone by morning.
  An empty D.O. No. gets a `DET…` number, which the backend leaves alone. That is why ops' own helper jobs have always survived.
- The on-time dashboard adds up Pieces across every collection.
  A helper job carrying the restaurant's count makes that restaurant count twice.
  On 6 Oct 2026 copied jobs pushed the dashboard to 2,576 portions instead of about 1,820.
  Do not put the helper's share in Pieces either: the original still holds the full count, so a share is counted on top of it.

Leave the original job's Pieces alone too.
The backend owns that number and keeps it in step with orders.

## Moving a collection to another driver

The name of a helper job says whose collection it helps with, so it has to follow the collection's main driver.
If Tokyo Sushi belongs to Astra, its helper is called `Tokyo Sushi með Astra`, whoever is assigned to help.
When ops moves Tokyo Sushi to Óskar, the helper must become `Tokyo Sushi með Óskari`.

So whenever a collection's main driver changes, whether in a full planning run or because ops asks in one line ("Tokyo Sushi is now for Óskar"):

1. Change Assign To on the `C-Lunch-…` job to the new main driver.
2. If the collection has a helper job, edit only its **Company Name** to `<Restaurant> með <new main driver>`.
   Leave the helper's Assign To, D.O. No. and Pieces as they are, and never delete and recreate it: that would give it a new number and could strand a driver already on the way.

Before doing it, check two things and mention them in the same message:

- If the new main driver already has another job that day, say which one, since each driver gets one job.
- If the new main driver is the helper on this same restaurant, the restaurant has lost its helper; ask ops who should help instead.

For a one-line request like this, skip Sling: show the change in one short message (for example "Tokyo Sushi: Astra → Óskar, and rename the helper to `Tokyo Sushi með Óskari`. Go?") and make it once ops says go.

## Working in the browser quickly

Most of the time in a run goes on browser round-trips, so keep them few:

- Read pages as text (page text or the accessibility tree), not screenshots.
  Take a screenshot only when the text does not tell you what you need, such as whether a dialog opened.
- Fill the Add Collection form fields directly by reference rather than clicking and typing into each one, and send several actions in one batch when your browser tools allow it.
- Do not re-read a page after each small change; read once when you need to know the result.

## Before you finish

1. Reload the Collections list and check only the jobs you created or changed; there is no need to re-read every page.
   Each helper's D.O. No. must start with `DET`, its Pieces must be empty, its name must have the main driver after "með", and each job must show the driver you assigned.
   If a helper's D.O. No. does not start with `DET`, it will be deleted within 15 minutes. Tell ops straight away, and offer to replace it with a correctly numbered one and delete the wrong one once they agree.
2. Tell ops the helper jobs will show up on the on-time dashboard waiting to be confirmed (they are manual jobs), and that they should confirm them as lunch pickups.
3. Report back in a short list: restaurant, portions, main driver, helper if any.
   Mention any collection you could not assign and why.
