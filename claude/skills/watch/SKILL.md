---
name: watch
description: Invoke when given a YouTube or X/Twitter video link (or asked to "watch this"). Pulls the transcript, then reports highlights ranked by what Einar personally finds interesting, with timestamps. Not for reading articles or PDFs — use /read.
metadata:
  version: "1.0.0"
---

# Watch: personalized video highlights

Watch a video and report only what *he* would care about. This is not a summary.
A summary tells you what the video said; this tells you what changed for you.

## 1. Get the transcript

```bash
~/.claude/skills/watch/scripts/fetch-transcript.sh "<url>"
```

Prints an output dir containing `meta.json` and `transcript.txt` (deduped,
`[MM:SS]`-stamped blocks). Read both.

- Exit code 3 = no caption track and `mlx-whisper` isn't installed. Show the
  user the install line the script printed and **stop** — don't install a dep
  for them.
- X/Twitter videos never have captions, so they always take the slow
  transcribe path. Say so before starting on one.
- Private/age-gated video: yt-dlp fails. Report the actual error, don't retry blind.

`meta.json` chapters, if present, are the author's own segmentation — use them
to orient, never as the highlight list.

## 2. Load taste

Read `references/interest-profile.md` — the stable profile.

Then run **one** `concierge` agent with the video's actual topics, e.g.
"What have I written or decided about Durable Objects storage and D1 migrations?"
This is the step that makes the report personal rather than generic. Skip it only
if the video is clearly off-topic from anything he works on.

## 3. Rank

Score every candidate against the profile. Cut anything that's merely true.
Ask of each one: *does this change a decision, a plan, or a belief he holds?*

Explicitly look for **conflicts** — the video asserting something his vault notes
contradict. Those lead the report.

## 4. Report

```
{title} · {duration} · {uploader}
Verdict: {one line — worth watching in full / skim these bits / skip}

## Highlights

**{claim, as a statement — not "he talks about X"}** [12:04](url&t=724s)
{why it matters to you specifically, 1-2 sentences}

...

## Conflicts with your notes        (omit if none)
- {claim} [34:10] — contradicts [[note-name]], where you decided {X}

## Worth chasing                     (omit if none)
- {tool / paper / repo mentioned}, [08:31]
```

Timestamp links: YouTube supports `&t=NNNs` (or `?t=` on `youtu.be`). X/Twitter
has no deep links — print bare `[MM:SS]` there.

Keep it tight. If nothing clears the bar, say the video had nothing for him —
that's a valid and useful result.

## Notes

- Long videos are fine — a 3h transcript is ~40k tokens, well within budget.
- If the user names a focus ("watch this for the pricing bits"), that overrides
  the profile's ranking for this run.
- Offer to `/memento` anything genuinely new. Don't write to the vault unasked.
