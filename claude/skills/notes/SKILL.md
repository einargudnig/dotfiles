---
name: notes
description: Invoke to publish a link to the public /notes page on einar-os — an article, tweet, or tool worth sharing. Writes a Velite `links` entry and verifies it builds. Not for private notes (use /memento) and not for blog posts or deep dives.
metadata:
  version: "2.0.0"
---

# Notes: publish a link to einar-os/notes

Repo: `~/personal/einar-os` · Page: `/notes` · Content: `content/links/*.mdx`

This is a **public** page. Anything added here goes live on the next deploy —
the collection has no `draft` field. Private thoughts belong in the vault via
`/memento`, not here.

## 1. Get the substance

| Input | What to do |
|-------|-----------|
| A URL | Fetch it — use `/read` or WebFetch. **Never write a description from the URL alone.** |
| A tweet | The tweet URL is fine as `url`. Describe the claim, not the tweet. |
| "that thing we just discussed" | Pull from conversation context. Confirm which thing if ambiguous. |
| A `/watch` highlight | Reuse the claim and link with the `&t=` timestamp intact. |
| A fieldtheory bookmark | `ft show <id>` for full text; use the original link, not the `t.co` wrapper. |

## 2. Write it

One file: `content/links/{kebab-case-slug}.mdx`. The filename is never used as a
slug or key — it's for humans browsing the directory.

```mdx
---
title: "Agentic coding is a trap"
url: "https://larsfaye.com/articles/agentic-coding-is-a-trap"
description: "The strongest case against the way most people use coding agents. Friction is where the learning happens, so removing all of it accrues cognitive debt you pay back later."
date: 2026-08-03
tags: [agents, dissent]
---
```

**Frontmatter rules** (schema is in `velite.config.ts`, collection `links`):

- `title` — required, ≤120 chars, quoted.
- `url` — **required**. Quoted. The canonical source, not a shortener or `t.co`.
- `description` — **required**, ≤300 chars. This is the whole entry; see Voice.
- `date` — required, bare `YYYY-MM-DD`, unquoted. Today unless he says otherwise.
- `tags` — optional, **inline array** (`tags: [agents, dissent]`).
- **No body.** This collection has no `s.mdx()` field — anything after the
  frontmatter is ignored. Everything you want to say goes in `description`.

## 3. Voice

The description is one or two sentences and it is the entire entry — there's no
body to expand into.

- **Lead with the claim, not the genre.** "Friction is where the learning
  happens" — not "a great article about agentic coding".
- **Say what it argues, not what it covers.** A topic list is not a description.
- Concrete mechanism over adjectives. No "must-read", no "check it out".
- If it's a dissent or a correction to something widely believed, say so — that's
  the most useful signal a link page can carry.

The reader can see the URL. Spend the 300 characters on why it's worth the click.

## 4. Verify

```bash
~/.claude/skills/notes/scripts/verify.sh "<exact title>"
```

Rebuilds the Velite layer and confirms the item is in the collection, echoing
back the parsed url, date, tags, and description length against the 300 cap.
A frontmatter violation fails here with the full Velite log — fix and rerun.
`npm run check` (oxlint + tsgo) does **not** cover content files, so this is the
only real gate.

Then report the file path and the parsed fields.

## 5. Stop

Do **not** commit, push, or deploy unless asked. The working tree often carries
unrelated changes — if he does ask, stage only the new file by path, never `-A`.

## Gotchas

- **`content/interesting/` is a different collection that renders on
  `/interesting`, not `/notes`.** It takes an MDX body and has no `description`.
  As of 2026-08-03 it's frozen — new links go to `content/links/`.
- `url` is validated as `s.string()`, not `s.url()` — a malformed URL builds fine
  and breaks silently in the browser. `verify.sh` warns; check it yourself too.
- `description` over 300 chars fails the build. Velite counts characters, not words.
- Links sort by `date` descending, sharing the page with the `learnings`
  collection behind tabs (`app/notes/notes-tabs.tsx`).
- Deploys to Vercel (not Cloudflare, despite the stale `.wrangler/` dir).
