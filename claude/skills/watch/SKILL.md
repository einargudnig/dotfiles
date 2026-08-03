---
name: watch
description: Invoke when given a YouTube or X/Twitter video link (or asked to "watch this"). Pulls the transcript, then reports highlights ranked by what Einar personally finds interesting, with timestamps. Not for reading articles or PDFs — use /read.
metadata:
  version: "1.1.0"
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

**Cap at 5-7.** Fewer is fine. Never pad. If the video genuinely has more than
7, say so in the verdict and still ship the best 7.

Explicitly look for **conflicts** — the video asserting something his vault notes
contradict. Those get their own section, and each one must name both the
timestamp and the `[[vault-note]]` it collides with.

## 4. Report

```
{title} · {duration} · {uploader}
Verdict: {watch in full | skim these bits | skip} — {one clause of why}

## Highlights

**{claim, as a statement — not "he talks about X"}** [12:04](url&t=724s)
{why it matters to you specifically, 1-2 sentences}

...

## Conflicts with your notes        (omit if none)
- {claim} [34:10] — contradicts [[note-name]], where you decided {X}

## Worth chasing                     (omit if none)
- {tool / paper / repo mentioned}, [08:31]

## Cut as noise                      (omit if the video was wall-to-wall signal)
{one short paragraph naming the bulk of the video that didn't make the cut}
```

Commit to one verdict. "Depends what you're after" is not a verdict.

Timestamp links: YouTube supports `&t=NNNs` (or `?t=` on `youtu.be`). X/Twitter
has no deep links — print bare `[MM:SS]` there.

**"Cut as noise" is not optional padding — it's what makes a short report
legible.** Four highlights from a 90-minute video reads as thin coverage until
you name the 86 minutes you deliberately dropped.

Keep it tight. If nothing clears the bar, say the video had nothing for him —
that's a valid and useful result.

## 5. Save

Save every report by default to:

```
~/personal/obsidian/second-brain/40 reference/videos/{lowercase video title}.md
```

Match the folder's existing naming — lowercase, spaces not dashes, no date
prefix (`goodbye useEffect.md`, `conductor framework.md`). Append ` - {channel}`
when the title alone is ambiguous.

Skip only if he says "don't save" or "just show me". Tell him the path.

Frontmatter follows `template1` (the folder's older notes predate it; new ones
still use it):

```yaml
---
Type: #type/work
Area: #area/{project if the video maps to one, else general}
Keywords: #keyword/{topic} #keyword/{topic}
Status: #status/active
Date Created: {YYYY-MM-DD}
---
```

Below the H1, before the verdict, record provenance:

```
source: {url}
{duration} · {uploader} · published {YYYY-MM-DD} · watched via `/watch`
```

**Link both ways.** Add a `## Related` section linking the vault notes the
concierge query surfaced — especially any note named in Conflicts. If this
session also produced a breadcrumb, link it there *and* add a line back to the
video note from the breadcrumb's `## Related`. A video note that links nothing
is a dead leaf.

If a real idea emerged that has no vault home, say so and offer `/memento` —
don't write a slip-box atom unasked.

## Notes

- Long videos are fine — a 3h transcript is ~40k tokens, well within budget.
- If the user names a focus ("watch this for the pricing bits"), that overrides
  the profile's ranking for this run.
- Offer to `/memento` anything genuinely new. Don't write to the vault unasked.
