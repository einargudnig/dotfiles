---
name: maul-front-translation
description: Post an English translation of a customer's message into a Front conversation as an internal comment, labelled "🤖 AI translation" so nobody mistakes it for something a person wrote. Triggers on anything in the thread that a non-Icelandic-speaking teammate can't act on — a message in Icelandic, or an English message that names things (dishes, products, place names) in Icelandic. Use when asked to "translate this thread", "add a translation comment", "what does this email say", or when another Maul skill routes a conversation here before staff have to act on it. Never replies to the customer and never changes the conversation — it adds one internal comment.
---

# Maul Front translation

Not everyone handling Maul's shared inboxes reads Icelandic. Anything a teammate has to act on has
to exist in English somewhere in the thread. This skill puts it there as an internal Front comment —
invisible to the customer, purely a staff aid.

## The test is not "what language is the email in"

It's **"can a non-Icelandic speaker act on this?"** Those are different questions, and the gap
between them is where this goes wrong.

An email written in fluent English asking for *"Kjúklingasúpa on Tuesday and Plokkfiskur on
Wednesday"* is, for the purpose that matters, an untranslated email. The nouns are the operative
part — they're what gets looked up, matched, ordered, or acted on. Getting the surrounding sentence
in English and the nouns not is the failure this skill exists to prevent.

So check the message body **and every named thing in it** — including names inside an English
sentence, in a quoted forward, in a subject line, in a bullet list, or transcribed from a
screenshot.

| What you find | What to post |
| --- | --- |
| Body not in English | Full translation, named things included |
| Body English, named things in Icelandic | Just those, each as `Icelandic — English`, with whatever context they carry (day, quantity, sitting) |
| Body and named things already English | Nothing. Don't add a redundant comment. |

## Who the comment comes from

The comment is posted under the Front identity of whoever is running the skill — it is that person's
comment, not a bot's. `mcp__Front_MCP__add_comment` already attributes it to the authenticated
teammate; there is no shared or system account involved and none should be used.

Two consequences worth holding onto:

- Anyone reading the thread sees a named colleague's avatar next to machine-translated text. That is
  exactly why the label line below is non-negotiable — the name says who ran it, the label says a
  machine wrote it.
- If you are unsure which identity you are acting as, check with `mcp__Front_MCP__get_my_identity`
  before the first comment rather than after. A run posted from the wrong account cannot be
  reattributed afterwards.

Address the comment to nobody in particular. It is written for whichever teammate picks the thread
up, so don't @mention a person, don't write it to a named colleague, and don't assume who will read
it.

## Rules for the comment

- **Always start with the literal line `🤖 AI translation`** on its own line, then a blank line, then
  the translation. This label exists so nobody mistakes machine translation for something the
  customer or a teammate actually wrote. Never omit it, never reword it, never personalise it.
- **Keep the Icelandic beside the English, never replacing it.** Staff match what the customer wrote
  against a system — a comment that says only "chicken soup" has thrown away the string they need.
  `Kjúklingasúpa — chicken soup`, in that order, every time.
- **Translate faithfully, not as a summary.** Keep dates, names, quantities and hedges intact even
  where the phrasing only loosely maps to natural English. A customer's "ég held" ("I think") is
  doing work; don't tidy it into certainty.
- **Translate literally, and don't resolve.** Render what the customer wrote, not what you think they
  meant. If a downstream step later matches the name to an official one that reads differently,
  that's normal and belongs in that step's output — don't go back and rewrite the comment.
- **Mark what you can't translate confidently.** A restaurant's own coinage, an unfamiliar compound:
  put it in verbatim with `— unclear` rather than guessing. A wrong translation is worse than an
  untranslated string, because it reads as certainty. List those back to whoever invoked the skill.
- **One comment per conversation.** More than one inbound message needing translation gets combined
  into a single comment, each under its own short heading.
- **Don't translate the same thread twice.** Before commenting, check the conversation timeline for
  an existing comment starting `🤖 AI translation` — or the older `AI translation for Jennie`, which
  still exists on threads translated before the label changed — and skip the conversation if one is
  there. This matters most on scheduled runs that sweep the same pool of open conversations daily.
- Post with `mcp__Front_MCP__add_comment`. The body is plain text with automatic @mention
  resolution — don't rely on markdown rendering.

## Two shapes

Full translation, for a message written in Icelandic:

```
🤖 AI translation

"Hi, I forgot to order lunch for tomorrow — could you add me to the order? I'd like the chicken
soup (Kjúklingasúpa)."
```

Names only, for a message written in English that names them in Icelandic:

```
🤖 AI translation

Email is in English; dish names are Icelandic. Dishes only:

Tue 25 Aug, lunch — Kjúklingasúpa — chicken soup
Wed 26 Aug, dinner — Plokkfiskur — traditional fish stew (mashed fish, potato, onion)
```

## What this skill does not do

It never replies to the customer, never tags, assigns, archives or snoozes, and never edits the
conversation. One internal comment is the whole job. Anything else belongs to the skill that called
this one.

## Reporting back

Say which conversations got a comment and which kind (full or names-only), and list any `— unclear`
items so someone who reads Icelandic can settle them. When a calling skill needs a flag for its own
output, `full` / `names` / `none` is the distinction that matters.
