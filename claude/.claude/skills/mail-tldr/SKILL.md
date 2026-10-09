---
name: mail-tldr
description: TL;DR of newsletters in the personal Gmail (einargudnig@gmail.com) via the spark CLI. Use when the user asks for a newsletter digest, "what did my newsletters say", "tldr my inbox reading", or a weekly roundup. Not for work mail or invoices.
metadata:
  version: "1.0.0"
  requires:
    bins: [spark]
---

# Mail TL;DR: newsletter digest

Read-only. Never archive, mark read, or unsubscribe unless explicitly asked.
CLI reference: the `use-spark` skill. Spark Desktop must be running.

## 1. Collect

Default window: `newer_than:7d`. Respect a window the user gives ("today", "since Monday").

```bash
ACC=einargudnig@gmail.com
# Curated — the ones the user chose to keep. Always cover these in full.
spark emails "$ACC:News-Letter-I-Like" --filter "newer_than:7d" --page-size 50
# Everything Spark classifies as newsletter — triage these.
spark emails "$ACC" --filter "category:newsletter newer_than:7d" --page-size 50
```

Drop from the second list: shop promos/sales, ESPN/fantasy, Toggl/app usage
reports, account notifications. Keep: writing with ideas (tech, React/web,
AI, business, finance, thinking/self-improvement), in English or Icelandic.

## 2. Read

`spark thread <id>` for each kept item. For many items, fan out reads in
parallel. Skip anything that turns out to be pure promo.

## 3. Report

Lead with the curated label, then the rest. One block per newsletter:

```
**<Newsletter> — <subject>** (<date>)
- 2–4 bullets: the actual ideas/claims/links worth knowing, not "this issue covers…"
→ Worth opening? yes/no + why, in a few words
```

End with **Top 3 this week** — the three items most worth the user's time.
Write in English; translate Icelandic content. Keep the whole thing scannable.
