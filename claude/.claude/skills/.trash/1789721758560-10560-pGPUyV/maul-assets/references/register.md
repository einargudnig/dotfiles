# The asset register, in detail

## Where it is

| Thing | ID |
|---|---|
| Database `93.01 Asset Database Global` | `5787d1677b97403fbc77e219fce4d94c` |
| Its single data source | `collection://c5262d3e-3979-4252-b7b3-d87e34dc854a` |
| `93 Asset Registration Global` — the category page that embeds it | `6fb30b335b704e36a0e9f120e949b6c3` |

Those last two are both called "93.01" in conversation and it causes confusion. The database is
canonical; the page merely embeds it. The database's parent is an untitled intermediate page
(`7938286b4a7a47dfa9f9bcf9547b8427`), which is why its breadcrumbs look wrong.

143 rows as of August 2026. Four views: **All**, **RVK**, **CPH**, and **Billing** — use Billing
for cost questions rather than filtering the full set yourself.

Queries and row creation need the `collection://` data source ID, not the database page ID.

## Schema

| Property | Type | Notes |
|---|---|---|
| `Name` | title | `93.x <Tool>` on 137 of 142; five rows carry no number |
| `userDefined:URL` | url | **The property key is `userDefined:URL`, not `URL`** — Notion reserves the plain name. Best-populated field, 69% |
| `Asset Category` | multi-select | Software Developed Inhouse, Hardware, Subscription, ZAP, Document, Form, License, Website, Tool, Agency |
| `Status` | multi-select | Not started / In use / Archived — **multi-select, not Notion's Status type**, so a row can legally be both `In use` and `Archived` |
| `Team Using` | multi-select | RVK / CPH / Global. Scopes the asset to an entity, not to a process |
| `Owner` | relation → Starfsmenn | The person |
| `🎭 Role Responsible` | relation → 13 Roles | The seat |
| `Part of` / `Contains` | self-relation | Composition |
| `Using Assets` / `Used By Assets` | self-relation | Dependency |
| `Billing Period` | select | Annually / Monthly / Quarterly |
| `Monthly Cost ISK` / `$` / `EUR` / `DKK` | number | Four independent fields — never sum across them |
| `Credit Card` | multi-select | Last four digits. **Never reproduce in any output** |
| `Text`, `Tags` | text / multi-select | `Text` populated on 3 rows of 143 |

**The four self-relations are not two inverse pairs.** `Part of` has 47 entries and `Contains`
14; `Using Assets` 49 and `Used By Assets` 42. They are four independent one-way fields, so a
mismatch is a real data gap rather than a display artefact — and a dependency walk has to read
both directions rather than assuming one implies the other.

## No property reaches a process page

Every relation target, checked: `Owner` → people, `🎭 Role Responsible` → roles, the four
self-relations → assets. One hop further: `13 Roles` reaches people, itself, `47.01 Skipulag
þrifa` and `14 Responsibilities`; and `14 Responsibilities` has no page relation at all. So the
asset → role → responsibility chain never reaches a numbered page as structured data.

Three things come closest, and none is a substitute:

1. **`13 Roles.Tags`** — a multi-select whose options are JD category names (`41 Delivery`,
   `44 Accounting`, …). A string-typed hint at a category, and already drifted from the real
   titles.
2. **`@` mentions and inline links in page bodies** — the only real mechanism, in either
   direction, and unenforceable.
3. **`Team Using`** — an entity, not a process.

## The current state of the join

Sixteen process pages that plainly depend on a tool were sampled in August 2026. Eight link the
register in some form, and no two use the same convention — one page, `41.02 Útkeyrsla -
verkefni`, uses four styles at once and includes a link to a deleted page.

| How the tool is referenced | Pages |
|---|---|
| `@` mention of the register row | 4 |
| Inline link to the row | 4 correct, 1 pointing at the wrong row |
| Pasted `notion.so/...` URL to the row | 1 |
| Raw external vendor URL | 9 |
| Named in plain prose, no link | 5 |
| Nothing, or blank page | 2 |

Raw vendor URLs are the de facto standard. That is the gap the convention closes, and it's why
any impact analysis has to state its confidence.

**Nothing points back.** Six rows were opened — Retool, Sling, Front, Regla, 1Password,
allweeksskjal — and not one links a numbered process page. Sling's body even lists its use cases
in prose without linking them. Treat the reverse direction as absent.

**Two worked examples to copy from:** `44.03 Reikningakeyrsla`
(`69ee6661b9444d379e77f9bbbf5dacec`) links Regla, 1Password and two document rows — the best in
the sample. `44.09 Rukka kort` (`199ca54d24e3802d802bec0a769d18a1`) uses a clean `@` mention of
the Teya row.

## Health baseline, August 2026

Re-derive these; they're here so a gap doesn't read as a query mistake.

- **Status:** In use 70 · Archived 12 · Not started 13 · **none at all 48 (34%)**
- **Ownership:** no `Owner` 33 · no `🎭 Role Responsible` 22 · **neither 9**
- **Cost:** 53 of 143 (37%) carry any monthly figure
- **URL:** 98 of 143 (69%)
- **`Text`:** 3 of 143
- **One row is entirely blank**; five rows carry no `93.x` number
- **Duplicates:** three exact-title pairs split only by `Asset Category` — the Cost Calculator
  rows exist as both `Form` and `Document`
- **Overlapping subscriptions worth a decision:** `93.70 Teya Portal` and `93.70 Teya b-online`;
  four AI subscriptions across `93.71 ChatGPT`, `Claude AI`, `93.45 Anthropic`, `93.45 Mistral AI`

## Known defects

**A parallel register tree exists.** `93 Eignaskráning Mauls í Reykjavík`
(`068b9e4e88284a318e9aa0e6df6e2710`) holds ordinary numbered `93.x` *pages* doing the register's
job: `93.41 Detrack samþættingarskjalið`, `93.23 Tölvur`, `93.23 Beinir S33` (93.23 twice),
`93.62 Alfreð`, `93.40 Like/Dislike skjal`. None is a row. This is the structural version of the
duplication problem and it needs a decision, not a tidy-up.

**Two records for one tool.** `93.43 EmailReminders_ScriptTool` is a plain page; `93.42
EmailReminders_ScriptTool` is a row — same tool, two numbers. `45.01 Google App Scripts`
(`2dad7021483049a996ad13c65a4b5852`) is a substantial page documenting the tool, duplicating row
`93.45 Google App Scripts` (`4974956f6c774199b07027188bfd3bcc`).

**Used but not registered:** Facebook Messenger (the actual driver-comms channel on `41.02` and
`46.03`; only a Facebook group and page have rows), Bruno, Playwright, GitHub Copilot (each has
its own page under Maul ehf. `45 Quality Processes` instead), Abaka the accounting firm, and
Alfreð the recruitment service.

**A live dependency on an archived asset:** Loom is `Archived`, and a Loom video is still
embedded in the `93.44 allweeksskjal` row.

**A mislink to look out for:** `45.01 Google App Scripts` labels a link "Detrack" but points at
`93.41 ElasticRoute with Detrack`, which is archived. A link that resolves is not the same as a
link that's right.

**A dead link:** `41.02` has a link labelled "detrack" to `71857186c8564775b7cdae24d84987e3`,
which no longer exists.

## Numbering inside the register

The `93.x` prefix on a row is a label within the register, not an address in the page tree, so
it doesn't follow the page-numbering discipline in `jd-numbering`. It should still be unique —
`93.10` is currently on two rows, `Around` (Archived) and `1Password Secrets Storage` (In use),
which is the workspace's clearest breach of the never-reuse rule and is on `1.05`'s open list.
