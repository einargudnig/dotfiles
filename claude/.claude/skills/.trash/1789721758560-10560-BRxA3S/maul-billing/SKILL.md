---
name: maul-billing
description: "Explain and navigate Maul's billing — snapshots, billrun, accounts, staggered periods, delivery discounts and the customer statement in app.maul.is. Use for \"why is this customer billed this way\", \"what period does X use\", \"what does Deluxe mean\", \"where do I change a delivery discount\", \"what does the customer actually see\", \"is this snapshot approved\". Read-only; never approves, declines, invoices or edits terms."
---

# Maul billing — explain and navigate

This skill answers questions about how Maul bills and where to look. It does **not** change
anything. Deeper detail, including the full field inventory and the open questions, is in the
project doc `claude/billing-surface-map.md` (`project_read` it when the answer needs more than
what is here).

Observed 2026-09-03. There is no billing tool on the Maul MCP, so everything below is reached
by reading pages in a browser.

## The model in one paragraph

Billing is **snapshot-based, not live**. A billrun produces one immutable **billing snapshot**
per *account* per *billing period*. Snapshot IDs are ULIDs. Staff triage snapshots in
`admin.maul.is/billrun`; the customer-facing rendering of the same snapshot lives in
`app.maul.is/billing`. Admin does not render statements itself — its "View →" links point out
to `app.maul.is`.

Two consequences that cause most of the confusion:

1. **Periods are staggered.** Each account has a `PERIOD START (DAY OF MONTH)`, so
   `1–31 Jul`, `22 Jul – 21 Aug`, `28 Jul – 27 Aug` and `10 Jul – 9 Aug` all coexist. There is
   no shared month boundary. Some period starts are driven by the *customer's* payroll cut-off
   (Reykjafell: "launavinnslu 23 hvers mánaðar").
2. **Terms live on the account, not the company.** One company can carry many accounts — Alp
   has six. Always ask *which account*, never just *which company*.

## Where each thing lives

| Question | Look here |
|---|---|
| What are this customer's terms? | `admin.maul.is/accounts/<company>/<account>` |
| What's in the queue / what's this snapshot's status? | `admin.maul.is/billrun` |
| What does the customer see? | `app.maul.is/billing/a/<account>` then `/…/<snapshotId>` |
| Which menu plan does a site have? | `admin.maul.is/locations/<slug>/edit` → `PLAN`, `DEFAULT MENU` |
| Delivery-discount consistency across the estate | `admin.maul.is/delivery-discounts` |

There is **no invoice register in admin** — `/invoices` is a 404. Invoices exist only as the PDF
on the customer statement, produced by an external accounting system.

### Account fields (`/accounts`, 552 rows, filterable Active/Inactive)

Billing terms: invoice email · registration number (kennitala) · period start (day of month) ·
delivery discount % (stored as `BillingDeliveryDiscount`) · electronic invoices yes/no ·
billing comments. Plus billing address, billing contact (name/email/phone), linked company and
locations, and an audit trail.

There is **no price, rate card, plan or currency amount on the account.** The only structured
lever is the delivery discount.

### The billrun queue

Columns: `ACCOUNTS` · `ORDERS` · `COMMENT` · `STATUS` · `PERIOD` · `MENU` · `DELIV DISCOUNT` ·
`REFERENCE` · `ACCOUNT NO`. Three stacked tables (Draft / Approved / Declined), each paginated
independently, over a date-range filter. Entry point from the admin home: the **Billing drafts**
card, amber while any snapshot waits.

State machine, as the UI offers it:

| Status | Can move to | Row actions |
|---|---|---|
| Draft | Approved, Declined | View |
| Approved | Declined | Create invoice, View |
| Declined | — (terminal in the UI) | View |

`Create invoice` appears only on Approved rows with **no** `ACCOUNT NO`; rows that already have
one show only View. *(Inferred from which rows show the button — not confirmed against code.)*

## The customer statement

| Route | Renders |
|---|---|
| `/billing` | period list for your own account (`Yfirlit reikninga`) |
| `/billing/list` | the **latest statement detail** for your own account (`Yfirlit viðskipta`) |
| `/billing/<snapshotId>` | one statement detail |
| `/billing/a/<account>` | period list for another account (admin-scoped) |
| `/billing/a/<account>/<snapshotId>` | one statement detail, another account |

The route names are inverted relative to what they render — `/billing/list` is the *detail*.
The menu item `REIKNINGAR` points at `/billing/list`, so a customer lands on the detail and
clicks `Skoða fyrri tímabil` to get up to the list.

A statement shows: total orders · weekday split (`Hádegismatur` / `Kvöldmatur`) · weekend split ·
total deliveries banded **1–12 / 13–22 / 23+ (`ókeypis heimsending`, free delivery)** ·
per-employee order counts · two CSV exports · and, on periods that have been invoiced, a
`Reikningur` PDF.

**It carries no monetary amount at all** — no unit price, delivery charge, VAT or total. When
someone asks "what does the customer see for this period", the answer is counts, not money. The
whole surface is still banner-flagged beta ("Reikningayfirlitið er í beta — Tölur geta enn
breyst").

The per-employee table includes **kennitölur**. Never repeat those in a report, a summary or a
chat answer; say how many employees ordered, not who they are.

## Vocabulary — four names for roughly one thing

| Seen in | Term |
|---|---|
| billrun `MENU` column | `Basic` / `Deluxe` |
| location edit form `PLAN` | `Basic` / `ByDiet` |
| location `DEFAULT MENU` | `variety-a`, `variety-b` (vs `freyja`, `huginn`, `muninn`, `thor`, …) |
| account billing comments | `Úrvalsseðill` |

Every `Deluxe` row observed also mentions `Úrvalsseðill` in its comment, so they are almost
certainly the same offer — but the mapping is written down nowhere in either UI. Say so rather
than asserting the equivalence.

## The comment field is where the real deal lives

The structured model has one lever; the actual commercial terms sit in free text that no
calculation reads. Real examples worth knowing, because they explain apparent contradictions
between a stored discount and what a customer believes:

- weekday/weekend split rates ("50% virka, 15% helgar") — the column can only show one
- flat ISK delivery prices ("2.600 kr … 3.900 fyrir Gufunes") — not expressible as a %
- a different legal entity paying ("Greiðandi er Fagkaup")
- renamed entities and mid-relationship kennitala changes
- branch required in the invoice reference

So: **when a stored discount and a customer's expectation disagree, read the comment before
concluding either is wrong.**

## `/delivery-discounts` — a proposal tool that writes nothing

Its own banner: the proximity rule and tiers are a starting proposal, not agreed policy, and
nothing on the page writes back. Only one figure on it is real billing data: **Billed now**, the
average stored delivery discount (37.9% when observed).

Useful for one thing in particular: it identifies locations billed at **conflicting discounts at
the same address** (43 when observed, spreads as wide as 0–100% across 12 accounts). Treat those
as drift to investigate, not as intended pricing.

## Known defects — mention these rather than working around them

1. **`/billing/a/arta` crashes** with `Error code: PARSE`, reproducibly, while other accounts
   render. The document request returns HTTP **200**, so it is a data-parse failure on the
   snapshot payload, not a fetch failure.
2. **The period list behaves three different ways** across accounts: some list several periods,
   some one, and `reykjafell` says `Engin yfirlit fundust` despite having a snapshot that renders
   fine at its ULID. Whatever filters that list is not visible in the UI, and "approved only"
   does not explain it.
3. **The period list is not chronological** — it appears to sort on creation date, descending.
4. **The CSV month label uses the period's start month**, which on staggered periods is usually
   the wrong word: `31 May – 27 Jun` is labelled `maí 2026`.
5. **Period gaps** appear under "last 12 months" with no explanation.
6. **Retool still writes to accounts** (`Updated … admin-web/retool`), so admin-web is not the
   only writer of billing terms.

## Boundaries

This skill reads and explains. It must not:

- approve, decline or bulk-change any snapshot status
- press `Create invoice`, or download an invoice PDF
- press `Create Snapshot`
- submit any account or location edit form — even with the dry-run box checked
- state a monetary amount for a period; the statements do not carry one

If the answer requires a change, stop and say what needs changing, which account and which
field, and let a person do it in admin. The account edit form defaults to
"Dry run (validate + simulate, don't actually write)" — point that out as the safe way to check
a change, but do not run it.

## Answering well

Name the account, not just the company. Give the period as actual dates, never "last month".
When an inference is doing work, say which — the `Deluxe`/`Úrvalsseðill` mapping, what
`Create invoice` does, and why a period list is empty are all unconfirmed. And when a stored
figure looks wrong, check the comment field before calling it a bug.