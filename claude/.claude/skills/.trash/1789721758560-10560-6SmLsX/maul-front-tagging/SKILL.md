---
name: maul-front-tagging
description: Add (or remove) tags on Front conversations at Maul — one thread or a whole batch. Resolves the tag name you used to the real tag in Front's 129-tag multilingual list, shows you exactly which conversations it matched, and waits for one yes before writing anything. Use whenever the ask is about labelling threads in Front — "tag this as a complaint", "put Seinpöntun on that email", "tag everything from Icelandair this week as Leads", "find the threads about the late delivery and tag them", "remove the Invoice tag from these", "label the negative reviews in the shared inbox" — or when another Maul skill needs conversations tagged and doesn't own the tagging itself. Also use when someone asks what tags exist, which tag is the right one for something, or why a thread carries the tag it does.
---

# Front tagging

Tags are how Maul finds things again. A thread that should have carried `Seinpöntun` and didn't is
invisible to whoever sweeps for late orders next week — and a thread that got the wrong tag is worse,
because it shows up in a search where nobody expects it and quietly skews what people think they're
looking at. So the job here is not "call the tag tool". It's: work out exactly which conversations,
work out exactly which tag, show both to a human, then write.

Two facts about this workspace shape everything below.

**Front has no create-tag API.** The MCP server exposes `list_tags` and `tag_conversation` and
nothing that makes a new tag. If the right tag doesn't exist, you cannot conjure it — you offer the
closest existing one, or you hand it back for someone to create in the Front UI and re-run. Never
silently substitute a near-match for the tag that was asked for.

**Tag names here are a trilingual pile.** 129 tags across Icelandic, Danish and English, many
near-synonyms of each other (`Afpanta`, `Niðurfelling` and `Gleymdist að fella niður?` all live in
cancellation territory; `Complaint`, `negative review`, `Maul :(`, `restaurant fail` and
`Kaldurmatur` all live in unhappy-customer territory). A confident guess between those is a coin flip
that lands in Maul's reporting. When two candidates are both plausible, ask — it costs one message
and saves a cleanup.

## Step 1 — Settle which conversations

Three ways the ask arrives. Take whichever fits and don't over-engineer.

**A conversation ID or a Front link.** `cnv_xxx` is what the tool needs; a Front URL usually contains
it. If you were handed a link with no `cnv_` in it, or an ambiguous reference like "that email from
Jennie", resolve it with `search_conversations` and confirm which thread you landed on before
tagging — a wrong thread is the most expensive mistake available here.

**A description to search for.** Use `search_conversations`. Four things about that tool bite:

- `scope` defaults to `my_conversations`, which is *not* the shared inboxes. Anything about
  maul@maul.is, "the shared inbox", or another teammate's threads needs `scope: "all_inboxes"`
  (broadest) or `"my_workspace"`. Getting this wrong returns a thin, plausible result set that looks
  like a complete answer and isn't. The result echoes `resolvedScope` — read it.
- **Search one keyword at a time.** Multi-word queries behave as though ANDed and collapse to zero
  ("delivery cold late" → nothing), while single words match loosely enough to pull in threads with
  no real connection (`late` returns Icelandic late-*order* threads; `bílstjóri` returns threads with
  no driver content). Try the Icelandic word and the English word separately — customers write in
  both — and treat single-word hits as candidates to read, not as answers.
- `filters.after` / `filters.before` filter on **updated** date, not sent date. A thread from March
  that someone replied to yesterday is inside `after: 2026-08-20`. So a date filter gives you a
  superset, never a subset: nothing in range is missed, but touched-only old threads come along. When
  the ask is about when something *arrived*, check the message dates in the results.
- Results carry subject, status, assignee, `tagIds` and `updatedAt` — **no snippet and no sender.**
  So a judgement is either subject-only or a full `read_conversation`; there's no cheap middle tier,
  and `read_conversation` truncates long message bodies, so a genuinely borderline thread costs a
  further `read_message`. Budget for that, and say in your list which threads you opened and which
  you judged from the subject alone. (Exception: in the 🇮🇸 Feedback inbox the subject usually *is*
  the whole customer message, so opening those adds nothing.)

**An inbox sweep** ("tag everything in X matching Y"). Resolve the address to an inbox with
`list_channels` rather than matching an inbox *name* — maul@maul.is maps to the shared "🇮🇸 Maul"
inbox, and there is a separate personal inbox also called "Maul" that will silently return almost
nothing. Then search with `filters.inboxId` plus whatever narrows it; a filters-only search with no
`query` is the right shape for a sweep. Expect `heavy_read` rate-limit errors while paging a large
window — back off for a few seconds and continue; it's normal, not a failure.

Two things worth knowing before you start listing:

- **If more than about 25 conversations would actually get tagged**, stop and say so first. This
  counts the ones you'd write to, not the ones the search returned — a three-day sweep of a shared
  inbox routinely returns 150 threads of which one needs anything.
- **If the window has already been swept**, lead with that. Finding that 57 of 149 threads already
  carry the tag, applied by a colleague two hours ago, means the honest answer is "there's almost
  nothing to do here" — and that sentence is more useful to the person than a tidy list of one item.

**When nothing matches confidently, don't reach.** Say what you searched (terms, scope, window),
name the near-misses you found and why each was rejected, and ask for a link or a customer name. If
the person's stated window comes up empty and a plausible thread sits just outside it, widen the
search and name the gap explicitly — "the only gjafabréf thread is from 10 Aug, two weeks back, not
last week" lets them correct you in one word. Tagging the nearest-looking thread instead is the one
outcome nobody can undo by reading your report.

## Step 2 — Resolve the tag

`tag_conversation` takes tag **IDs** (`tag_xxx`), never names, so every request goes through
`list_tags` first. Search by keyword with `name_query` — it handles Icelandic characters fine — but
it matches the name only, so a tag whose *description* says what you're looking for won't surface
that way. When a keyword search comes back empty, pull the full list (`limit: 100`, then page with
`offset`) and read it before concluding the tag doesn't exist.

What to watch for in the results:

| Signal | What it means for you |
| --- | --- |
| `namespace: "Workspace: Maul"` | The shared tag. This is almost always the one you want. |
| `namespace: "Teammate: ..."` | A personal tag, invisible to everyone else. Two tags can share a name across namespaces (`CHAT` exists in both) — pick the workspace one unless the person explicitly asked for their own. |
| `parent_tag_id` set | It's a child tag. Applying a child does **not** apply the parent, and Maul's reporting often keys on the child (`Betalt Faktura` under `Godkendte Faktura`). Apply what was asked for; mention the parent if you think both are wanted. |
| `is_archived: true` | Retired. Don't apply it — say it's archived and ask what they want instead. |
| Exact name match | That settles *which tag they asked for*. It doesn't settle whether a second tag is wanted — see below. |

**Before applying a tag you haven't used before, look at what already carries it.**
`search_conversations` with `filters.tags: ["tag_xxx"]` costs one call and tells you what the tag
means *in practice*, which is not always what its name suggests. `Gjafabréf` sounds like a topic tag
for gift-certificate threads; all eleven conversations carrying it are complaint threads where a gift
certificate was given as compensation. Applying it to a supplier's question about gift certificates
would inject a second meaning into a tag Maul reports on. This check is cheap and it is the single
most decision-relevant thing you can find out. (`list_tags` returns no usage count, so this search is
the only way to get one.)

**An exact match doesn't close the question of a second tag.** When someone says "tag it as a
complaint" and volunteers that it was the restaurant's fault, `Complaint` is what they asked for and
`restaurant fail` is what they just told you. Apply the one they named, offer the other, and let them
decide — don't add it unasked, and don't stay quiet about it.

When nothing matches exactly, present the closest one or two candidates with what distinguishes them
(the `description` field, the parent, what already carries it), and ask which — or whether the tag
needs creating in Front first.

## Step 3 — Show the list, ask once

Before any write, lay out what you're about to do as a compact list — one line per conversation, and
the tag named plainly:

```
Adding "Kaldurmatur" (tag_EXAMPLE) to 4 conversations:

1. Maturinn var kaldur — Anna Jónsdóttir, 22 Aug — opened
2. Re: lunch today — bjarni@fyrirtaeki.is, 22 Aug — opened
3. Kalt í dag aftur — Sara M., 21 Aug — subject only
4. Fwd: cold food again — Jennie, 21 Aug — opened

Already carries the tag (skipping): 2 more matched but are already tagged.

Go ahead?
```

Then wait for a yes. One confirmation covers the batch — don't ask per conversation. The reason the
list comes first is that it's the only chance anyone gets to catch a search that quietly pulled in a
neighbouring thread; a bare "tagging 4 conversations, ok?" doesn't give them that.

Two cases skip the gate, because there's nothing to catch:

- **A single conversation you resolved with certainty** — they named the thread, you found exactly
  that thread, and the tag is an unambiguous existing one. Reading it back is friction. Note that a
  thread named by a detail that turns out not to match (a date with nothing in it) is *not* resolved
  with certainty, even when the tag is obvious.
- **Another Maul skill invoked this one** and already put its own list in front of the user. Don't
  make them confirm twice — apply and return what you did.

Removal is different. Taking a tag off destroys information about how the thread was classified, and
nobody notices it's gone. Always list removals and always ask, even for one conversation.

## Step 4 — Apply

One `tag_conversation` call per conversation, with `addTags` (and/or `removeTags`) as arrays of IDs.
Both can go in the same call when you're swapping one tag for another.

- **Check what's already there first.** `read_conversation` returns `tagIds`. A tag already present
  is a no-op — skip it and count it as already-tagged rather than reporting it as work you did.
- **Don't stop the batch on one failure.** If a conversation errors (deleted, moved, permissions),
  keep going and list it as failed at the end. Half a batch applied and no report is the worst
  outcome available.
- **Never touch anything else.** Not status, not assignee, not the inbox it sits in, and no reply.
  If the thread obviously needs one of those, say so in your report and leave it.

## Step 5 — Report

Say what changed, in a form someone can check:

- Which conversations got which tag, by subject.
- Which were already tagged, so nobody wonders why the count differs from the list.
- Which failed and why.
- Anything you noticed and deliberately didn't do — a thread that looked like it wanted a second tag,
  a near-match you passed over, a candidate you excluded from the sweep and why, an *existing* tag
  that looks wrong on a thread you were reading anyway.

That last line is what makes this trustworthy over time. A batch tagger that reports only successes
teaches people to check its work manually, which defeats the point of it. It's also how mis-tags get
found: the vegetarian-menu suggestion sitting under `Seinpöntun` only surfaces because someone
reading past the no-ops mentioned it — and then left it alone, because removals need their own yes.

## When someone just wants to know about tags

"What tags do we have for complaints?", "is there a tag for gift cards?", "why does this thread say
Leads?" — these are read-only and need no confirmation. Answer from `list_tags` and
`read_conversation`, group by parent where the hierarchy explains something, note the namespace when
a tag is personal rather than shared, and say what actually carries the tag when its name and its use
have drifted apart. Volunteering the near-neighbours is usually the useful part: someone asking about
complaints wants to know that `Complaint`, `negative review`, `restaurant fail` and `Maul :(` all
exist and that they're not the same question.

A two-part ask — "do we even have a tag for X? if we do, put it on Y" — is a lookup *and* a write in
one sentence. Answer the lookup first and plainly, then deal with the thread. Someone who asked
whether the tag exists wants to hear yes or no before they hear about a date mismatch.

## What this skill does not do

It doesn't reply to customers, add comments, assign, archive, snooze, move between inboxes, or change
status — `tag_conversation` is the only write it makes. It doesn't create tags, because Front's API
here can't. And it doesn't decide *policy* — if the question is which tag Maul *should* use for a new
kind of thread going forward, that's a conversation with Einar and probably a line in Notion, not a
batch of writes.
