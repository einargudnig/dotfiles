# The org-model databases

Six databases, all reachable from `13 Roles`. Both `13 Roles` and `14 Responsibilities` sit
in **Maul ehf.** (`b06e5d52627c4471b9e23e133e7850a5`) under `10-19 Culture`
(`00d1d76cf2994f59a634fa8b2f3b0f1e`), even though most of the work they describe happens in
Maul í Reykjavík.

| Database | Page ID | Data source | Rows (Aug 2026) |
|---|---|---|---|
| 🎭 13 Roles | `e60e2f4b16f34169b88362d713383893` | `collection://59706e9a-a619-4643-b8a7-75cf875bea03` | 32 |
| 👩‍👦 14 Responsibilities | `c08a68a6f557462cb301775128df7393` | `collection://53fba645-a4f7-4246-aa96-08d9228fc9c6` | 107 |
| 🎭 Starfsmenn - Hlutverk og ábyrgðir | `1a0615df4178431b9948225459434b41` | `collection://bd1bea57-2b6e-47d0-b1c7-85b4f0c4de20` | 38 |
| 93.01 Asset Database Global | `5787d1677b97403fbc77e219fce4d94c` | `collection://c5262d3e-3979-4252-b7b3-d87e34dc854a` | 143 |
| 🧹 Skipulag þrifa MASTER - 47.01 | `8196fbd652144a0ead734999342a0989` | `collection://901321fb-c730-4e77-8b60-67954d66688a` | 17 |
| Þrifaskráning - 47.01 (cleaning log) | `2f4ca54d24e3808184aae244ddb58a72` | `collection://2f4ca54d-24e3-8021-8d90-000bea452083` | — |

Fetching a database returns its `collection://` data sources; queries and row creation need
the data source ID, not the page ID.

## 13 Roles

Titles are `13.NN <Title> Role`. The trailing "Role" is inconsistent — four rows omit it, one
is bilingual (`13.41 Box Wizard Role - Kassahirðir`). Match on the number or a substring.

| Property | Type | Notes |
|---|---|---|
| `Name` | title | `13.NN <Title> Role` |
| `Role Description` | text | empty on 10 rows |
| `Person` | person | **empty on all 32 — never use it** |
| `Actor` | relation → Starfsmenn | the real assignment |
| `Backup` | relation → Starfsmenn | the cover; empty on 10 rows |
| `Manages` / `Managed by` | self-relation | the org hierarchy |
| `👩‍👦 14 Responsibilities` | relation → 14 Responsibilities | the walk starts here |
| `Responsible for Asset` | relation → 93.01 Assets | |
| `Skipulag þrifa - 47.01` | relation → þrif master | populated on one role only, and it looks accidental — 15 of 17 master rows are linked to `13.10 Country Manager Role`. The þrif master's own `Ábyrgð` property is the intended place for this |
| `Tags` | multi-select | JD category names as free text: `30 Customers`, `40 Customer Service`, `41 Delivery`, `42 Menus`, `44 Accounting`, `45 Quality`, `50 Product`, `53 Organizational Design`, `63 Planning`, `71 Marketing`. These have drifted from the live category titles — `50 Product` versus the real `50 Product Design`. Renaming a category means editing this list by hand |
| `Team Using` | multi-select | RVK / CPH / Global; the three views filter on it |

Categories in use: 13.10, 13.30, 13.40, 13.41, 13.42, 13.44, 13.45, 13.50, 13.52, 13.53,
13.63, 13.70, 13.71. All 32 numbers are valid.

## 14 Responsibilities

Titles are `14.NN <Verb phrase>` — `14.40 Perform Restaurant Check-in Meetings - Samráðsfundur`.
Mostly English, some Icelandic. Only six properties, and **none of them links to the process
page**:

| Property | Type | Notes |
|---|---|---|
| `Name` | title | |
| `Description` | text | empty on most rows; sometimes names a number in prose |
| `Text` | text | empty on most rows; sometimes holds a raw Google Docs or Retool URL |
| `Tags` | multi-select | one option, `Kassaútkeyrsla`, used on one row |
| `🎭 13 Roles` | relation → 13 Roles | the owning role |
| `🧹 Skipulag þrifa MASTER - 47.01` | relation | used on one row |

Around 78% of rows have neither `Description` nor `Text` filled in. The substance is in the
title and in the mentioned page.

**The process link is an `@` mention in the row body**, rendered by the API as
`<mention-page url="https://app.notion.com/p/<id>"/>`, usually after `see` or `Sjá`. A worked
example:

```
13.40 Restaurant Account Manager            946e7c7b26644a359091ca50cbd6dcb2
  └─ 👩‍👦 14 Responsibilities → 10 rows, including
     14.40 Perform Restaurant Check-in Meetings - Samráðsfundur
                                              361ca54d24e380b0b44ec3e30dd898ce
       body: "see @30.06 Samráðsfundir með veitingastöðum - Check-ins"
       → 361ca54d24e38025815dc64b919b89f2
         (Maul í Reykjavík ▸ 30-39 Viðskiptavinir ▸ 30)
```

Other confirmed hops, which show the numbers don't line up:

| Responsibility | Owning role | Process page |
|---|---|---|
| 14.40 Reply to grant requests | 13.40 Service Representative | 11.02 Styrktarbeiðnir |
| 14.40 Call restaurants that had issues | 13.40 Service Manager | 45.01 Atvikaskráning |
| 14.41 Prepare snowy days | 13.41 Depot Manager | 41.14 Snjómokstur |
| 14.46 Cleaning of thermoboxes | 13.41 Depot Operator | 47.01 Skipulag þrifa |

Rows with an empty body come back as `<blank-page>` — that means no process link exists, not
that the fetch failed.

## Starfsmenn - Hlutverk og ábyrgðir

The people directory, and the `Actor` target. 38 rows spanning current employees,
contractors, upcoming starters and past employees.

Safe to read: `Name`, `Full Name`, `Employment Status` (Current Employee / Contractor /
Upcoming / Past Employee), `Team Member` (Maul Reykjavík / Tiffin / Maul ehf.),
`Email Business`, `Job Percentage`, `Working Hours`, `First Month`, `Discord User Name`,
`Drive folder`, and the relations `🎭 13 Responsible for Roles`, `🎭 13 Backup for Roles`,
`93.01 Assets Responsibility`, `Þrifaskráning - 47.01`.

**Do not read into any output:** `SSN`, `Passport ID`, `Bank Account`, `Credit Card Number`,
`Address`, `Phone`, `WORK Phone`, `Email Personal`, `Union Membershipð`. Select the columns you
need rather than everything.

Also present: checkboxes `Privacy officer`, `Power of Attorney Holder`, `Is the best`, and a
`Spirit Animal` field. `Employment Status` is the one to check whenever a role looks owned —
an `Actor` who has left is the same as no owner, and it reads as a clean result.

## 93.01 Asset Database Global

143 rows. `Name`, `URL` (the property key is `userDefined:URL`), `Asset Category` (Software
Developed Inhouse / Hardware / Subscription / ZAP / Document / Form / License / Website / Tool
/ Agency), `Status` (Not started / In use / Archived), `Team Using`, `Owner` (relation →
Starfsmenn), `🎭 Role Responsible` (relation → 13 Roles), self-relations `Part of` / `Contains`
/ `Using Assets` / `Used By Assets`, `Billing Period`, `Monthly Cost` in ISK / $ / EUR / DKK,
`Credit Card` (last four digits as a multi-select), `Text`, `Tags`.

Useful here for "this person left — what's in their name", which is this skill's angle on the
register: the people and roles attached to an asset.

Questions about the *tools themselves* belong to `maul-assets`, which owns this database — what
a subscription costs, whether it's still in use, what breaks if it's cancelled, whether a tool
is registered at all. It also holds the trap list, including the fact that the cost fields are
four independent per-currency numbers and that `Part of` / `Contains` / `Using Assets` /
`Used By Assets` are four one-way relations rather than two inverse pairs.

## Skipulag þrifa MASTER - 47.01

17 rows, and **the title property is `Hlutur`, not `Name`** — a query that selects `Name` gets
nothing. Also `Svæði` (select: Þrifasalur, Dreifingarsalur, Hitakassar, Umbúðir fjölnota,
Bifreiðar, Bifreiðar verktakar, Dreifing, Skrifstofa, Kaffistofa, Snyrting, Geymsla), `Hvað`
(multi-select: Þrif að innan/utan, Sótthreinsun, Þurrkun, Skoðun, Mæling, Losun rusls,
Endurskipulagning), `Hvenær` (Við hverja notkun / Daglega / Vikulega / Mánaðarlega / Eftir
þörfum), `Hvernig` (text), `HACCP tenging` (multi-select), `Ábyrgð` (relation → 13 Roles),
`👩‍👦 14 Responsibilities`, and `Þrifaskráning - 47.01`.

`HACCP tenging` makes this a food-safety record as well as a rota, so treat it as
regulation-shaped — category 47 rather than 45, per `jd-placement`.

## Known defects, August 2026

Re-derive rather than quoting these; they're here so a gap doesn't read as a query mistake.

- **9 roles with no responsibilities**: 13.40 IT Support, 13.41 Restocking Operator, 13.41
  Supervisor of Maul's vehicles, 13.42 Menu Reviewer, 13.44 Financial Officer Global, 13.45
  Programmer, 13.52 Graphic Designer Local, 13.63 IT Manager, 13.71 Product Marketer Local.
- **1 role with no Actor**: 13.44 Financial Officer Global, which also overlaps `13.44
  Accountant Global Role`.
- **6 responsibilities with no role**, so unreachable from any onboarding walk — including
  `14.41 Assing routes to drivers` and two of the three copies of `14.40 Review weekly
  restaurant prep and document`.
- **Duplicates**: `14.40 Review weekly restaurant prep and document` ×3, `14.41 Manage drivers
  shifts in Sling` ×2, and `Send restaurant confirmation on Friday` existing both with and
  without its number.
- **Typos in titles**: `Assing routes`, `Assing Emails from main inbox`, `Relolve and escalate
  kitchen issues`.
- **The same task in two languages**: `14.41 Make sure everything is alright with restaurants`
  and `14.41 Athuga hvort það sé ekki allt ok hjá veitingastöðum`.
- **Unverified**: how many `Actor` links point at someone whose `Employment Status` is `Past
  Employee`. Worth checking first in any ownership audit — it's the gap most likely to be
  invisible.
