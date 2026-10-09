---
name: mail-invoices
description: Find invoices, receipts and bills in the personal Gmail (einargudnig@gmail.com) via the spark CLI, including Icelandic ones (reikningur, kvittun, greiðsla). Use when the user asks to find invoices/receipts, "what did I pay for", subscription spend, or needs a receipt for a vendor or month.
metadata:
  version: "1.0.0"
  requires:
    bins: [spark]
---

# Mail invoices

Read-only. Never move, label, or archive unless explicitly asked.
CLI reference: the `use-spark` skill. Spark Desktop must be running.

## 1. Scope

Default window: last 30 days. Honor a month, vendor, or range the user names
(`after:2026/09/01 before:2026/10/01`, `from:vercel.com`).

## 2. Search — cast wide, then dedupe by message ID

```bash
ACC=einargudnig@gmail.com
F="newer_than:30d"   # replace with the window
# 1. User-curated label (manually curated, most reliable)
spark emails "$ACC:invoices" --filter "$F" --page-size 50
# 2. Keyword sweeps, Inbox + Archive (English + Icelandic).
#    Most receipts are auto-archived, so Archive matters more than Inbox.
for dir in "$ACC" "$ACC:Archive"; do
  for q in invoice receipt "payment received" subscription renewal \
           reikningur kvittun greiðsla greiðslukvittun; do
    spark emails "$dir" --filter "$F subject:$q" --page-size 50
  done
done
# 3. Semantic catch-all
spark search "invoice or receipt for a payment" --in "$ACC" --filter "$F"
```

Exclude: marketing that merely mentions "invoice", shipping notices without
an amount, password resets, failed-payment *marketing*. Keep failed/declined
payment notices — flag them.

## 3. Extract

For each hit, `spark thread <id>` and pull: vendor, date, amount + currency,
invoice/receipt number, whether a PDF is attached. If the amount is only in
the PDF, say "in attachment" — don't guess. `spark thread --download-attachments <id>`
only when the user asks for the files.

## 4. Report

Table sorted by date desc:

| Date | Vendor | Amount | Ref # | PDF | ID |

Then: totals per currency, recurring vendors (same vendor ≥2× → likely
subscription), anything flagged (failed payment, unusual amount, duplicate
charge, not under the `invoices` label — offer to label it if the user wants).
