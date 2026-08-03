# Interest profile — Einar

The stable half of personalization. The other half is a live `concierge` vault
query per video. Edit this file freely; it is the tuning knob for the whole skill.

## Active context (refresh when it drifts)

- **Maul** (`~/work/`) — food delivery. React Router v7, React, TS, Tailwind.
- **Personal** (`~/personal/`) — React/Next.js, TS, Node.
- Cloudflare migration off Vercel (5/7 done) — Workers, D1, KV, Durable Objects.
- Agentic coding pipeline / "software factory" — async PR-queue review, guardrail hooks.
- Knowledge system — Obsidian second-brain, breadcrumbs, slip-box, concierge.
- Icelandic-language and locale concerns show up across all of it.

## Signal — surface these

- **Contradicts or updates something he already decided.** Highest value in the
  whole skill. This is what the concierge query is for.
- **Non-obvious mechanism** — *why* something works, not that it exists.
- **Directly actionable in a named repo** — "this changes how Maul does X."
- **Sharp opinion with an argument behind it**, especially a dissenting one.
- **Numbers** — benchmarks, costs, limits, migration timings.
- **Failure modes and gotchas** — what bit the speaker in production.
- **Named prior art** — a tool, paper, or repo worth chasing.

## Noise — cut these

- Sponsor reads, intros, outros, subscribe pitches.
- Definitions of things he already uses daily (what a Worker is, what JSX is).
- Restated docs with no added judgement.
- Hype with no mechanism ("this changes everything").
- Basic-tier tutorial scaffolding.

## Ranking

Sort by *what it changes for him*, not by where it fell in the video.
A single highlight that overturns a prior decision outranks five good facts.

## Tuning

**Cap: 5-7 highlights.** Hard limit. If a video has more than 7 things worth
saying, that itself is the headline — say so and still pick the best 7. Fewer
than 5 is fine and often correct. Never pad to reach the cap.

**Verdict first.** Every report opens with a one-line call: watch in full /
skim these bits / skip. Commit to one; a hedged verdict is no verdict.

**Conflicts get their own section, and it must link both ways** — name the
video timestamp *and* the `[[vault-note]]` it collides with, plus a one-line
statement of what you decided there. A conflict with no link back is just an
opinion. (Bidirectional linking is manual for now — flag it, don't write it.)

**Always surface, regardless of the other rules:**

- Anything touching **Icelandic language, locale, collation, or currency
  handling** — rare enough that it's worth knowing about even in passing.
- **Cloudflare Workers runtime limits and pricing changes** — the migration is
  live, so these land on real decisions.
- **Agentic coding workflow** — how people structure, review, or guardrail
  AI-generated changes. Directly feeds the software-factory work.
- **Anything that would invalidate a dependency choice** — deprecations,
  maintainer changes, security advisories, a library going unmaintained.
- **Nordic / EU regulatory** items touching food delivery, payments, or
  gig-work classification.

**Never surface, even if otherwise on-topic:**

- Framework release-note recitals. If it matters, it'll show up as a conflict.
- "AI will replace developers" discourse in any direction.
