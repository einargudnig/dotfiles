---
name: maul-detrack-split-job-collection
description: Assign Maul's restaurant collections (pickups) to drivers in the Detrack web dashboard, and add helper drivers to big collections without breaking the jobs or the portion count on the on-time dashboard. Use whenever ops asks to assign collections or pickups to drivers, plan the day's driver routes, "duplicate" or "split" a collection, add a helper for a large restaurant, check or verify that the day's collections and helper jobs are set up correctly, or anything like "assign the collections, use each driver once, and double the ones over 70 portions", even if Detrack or the dashboard is not named.
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

For each lunch collection (`C-Lunch-…`) work out:

- **Main driver:** the collection's own Assign To. Blank means unassigned.
- **Helper:** a `DET…` job whose company name is the restaurant's name followed by "með".
  Ops types these freely (`eldhúsið okkar með Yassin`, `cibo amore með Róberti Lauf`), so compare loosely, ignoring case and accents.
  Use the address to confirm a match, but never match on address alone: two restaurants can share one (Eldabuskan and Matarkompaní are both at Hlíðasmári 8).
- **Needs a helper:** Pieces is more than 70.

Then put every collection in one of three groups:

- **Done:** it has a main driver, and if it needs a helper it has exactly one, assigned, with a `DET…` number and empty Pieces.
- **Missing:** no main driver, or it needs a helper and has none, or its helper has no driver.
- **Looks wrong:** a helper with Pieces filled in, a copied job with a non-`DET` number (like `C-Lunch-indianfoodbox-2`), two helpers for one restaurant, or a helper on a collection that is now 70 portions or fewer because orders changed.
  Also mention any driver on more than one job; ops sometimes does that on purpose (two restaurants at one address), so it is a question, not an error.

What happens next depends on what you found:

- **Everything is done:** say so and stop. Show the summary table and change nothing, for example:
  > All 23 lunch collections have a driver, and all 13 over 70 portions have a helper set up correctly. Nothing to change.
- **Something is missing:** take only the missing items through the check-ins below. Never recreate anything that already exists.
- **Something looks wrong:** list each one with what is wrong and ask ops what to do.
  Do not delete or edit those jobs yourself: a driver may already be on the way, and deleting their job strands them.

## Check with ops twice before changing anything

Ops knows things Detrack does not: who is on shift, who is running late, which restaurant needs an extra hand today.
So for whatever the scan found missing, stop and ask at two points, and change nothing in Detrack until ops has answered both.

**1. Confirm the day and the drivers.**
Two places say who is working, and they answer different questions:

- **Sling** is the rota and the source of truth for who is on duty.
  Open the day view for all locations, e.g. https://app.getsling.com/shifts?mode=day&tab=alllocations&date=2026-10-06 (change the date).
  The page only draws the rows on screen, so scroll to the bottom before reading, and check you have as many shifts as the **SHIFTS** count in the header.
  Lunch drivers have a shift of about 9:45 AM - 12:15 PM as **Driver • Maul Reykjavík** or **Driver on Maul car**.
  Ignore **Dinner driver - weekdays** shifts (5:30 - 7:00 PM) for lunch, people with 0h and no shift, and anyone with **Time off** or unavailable.
  If Sling shows a banner offering to change the time zone, leave it alone.
  Ops is logged in there already; if Sling will not open or asks for a login, say so and fall back to Detrack alone.
- **Detrack → Vehicles** (https://app.detrack.com/dashboard/#/vehicles) lists every driver in the account, about 40, across several pages, so it is not a rota.
  Its **Connection** column shows who has the Detrack app open right now (On or Off).

Names are spelled differently in the two systems: Sling has full names (`Kári Kristjáns`, `Jakob Bystrom`, `Haukur Darri Darri Pálsson`), Detrack has short ones (`Kári Kri`, `Jakob`, `Haukur`).
Match on the first name plus as much of the second as Detrack shows, because several drivers share a first name (`Róbert Laufdal` and `Róbert Orri`, `Dagur Ingi` and `Dagur Örn`, `Tumi Fannar` and `Tumi Þorvars`).
Mention any match you are unsure of rather than guessing.

Build the driver list from Sling, use Detrack only to add a note, and ask ops in one message, for example:

> For today's lunch Sling has these drivers on shift:
> - Agnes, Atli, Auður Mjöll, Awad, … (on shift and online in Detrack)
> - Bartek (on shift, but not online in Detrack yet)
>
> Not in Sling but online in Detrack: Deja.
> Is this the right list? Anyone to add or leave out?

The two mismatches are worth pointing out because ops checks both every morning: a driver on shift who has not opened Detrack may not have started yet, and a driver in Detrack without a shift means Sling and Detrack disagree.
Only drivers ops confirms get jobs.
If ops did not name a day, ask in the same message (helper jobs are usually made the same morning, before the 10:40 pickups).

**2. Confirm the plan.**
Once you have the driver list, work out the assignments and show them before doing anything:

> | Restaurant | Portions | Driver | Helper |
> |---|---|---|---|
> | Indian Food Box | 151 | Jakob | Kári |
> | Mí Bowls | 27 | Rúnar | - |

Make the changes in Detrack only after ops says go, and apply any edits they ask for first.

## The assignment rules

- Work on the lunch collections for the day ops confirmed.
- Give each driver at most one job, counting helper jobs too.
  A driver who is already the helper on one restaurant must not get a second one.
- A collection with more than 70 portions gets one helper job, assigned to a second driver.
- If a collection is so large that one helper clearly is not enough, or there are not enough drivers to follow these rules, stop and ask ops rather than guessing.

## Adding a helper

Create the helper as a **new collection with Add Collection**. Never duplicate or copy the original job.

Fill it in the way ops does by hand:

- **D.O. No.:** leave it blank (the field shows "Auto-generated") so Detrack assigns a `DET…` number.
- **Company Name:** `<Restaurant> með <main driver>`, e.g. `Indian Food Box með Jakob` or `Tokyo Sushi með Jökli` (ops writes the driver's name in Icelandic dative; match that if you can, the plain name is fine if not).
- **Address:** the restaurant's address, same as the original job.
- **Date:** the same day. **Job Time:** 10:40, as ops uses for helper jobs.
- **Pieces:** leave it blank.
- **Assign To:** the helper driver.
- Leave zone and group empty.

Why it has to be done this way:

- Maul's backend checks Detrack every 15 minutes and **deletes any job in the restaurant collection group whose D.O. No. it did not create itself**, unless the number starts with `DET`.
  A copied job such as `C-Lunch-indianfoodbox-2` gets deleted, even when a driver is already on the way.
  A blank D.O. No. gets a `DET…` number, which the backend leaves alone.
- The on-time dashboard adds up Pieces across every collection.
  A helper job carrying the restaurant's count makes that restaurant count twice.
  On 6 Oct 2026 copied jobs pushed the dashboard to 2,576 portions instead of about 1,820.
  Do not put the helper's share in Pieces either: the original still holds the full count, so a share is counted on top of it.

Leave the original job's Pieces alone too.
The backend owns that number and keeps it in step with orders.

## Before you finish

1. Reload the Collections list and run the same check as at the start.
   Every collection you worked on should now be in the done group.
2. Tell ops the helper jobs will show up on the on-time dashboard waiting to be confirmed (they are manual jobs), and that they should confirm them as lunch pickups.
3. Report back in a short list: restaurant, portions, main driver, helper if any.
   Mention any collection you could not assign and why.
