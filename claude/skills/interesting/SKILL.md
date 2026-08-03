---
name: interesting
description: Invoke to publish something to the /interesting page on einar-os — a link, a fact, or an idea worth sharing. Writes an MDX entry in Einar's voice and verifies it builds. Not for blog posts or deep dives, and not for private notes (use /memento for those).
metadata:
  version: "1.0.0"
---

# Interesting: publish to einar-os/interesting

Repo: `~/personal/einar-os` · Page: `/interesting` · Content: `content/interesting/*.mdx`

This is a **public** page. Anything added here goes live on the next deploy —
the collection has no `draft` field. Private thoughts belong in the vault via
`/memento`, not here.

## 1. Get the substance

| Input | What to do |
|-------|-----------|
| A URL | Fetch it — use `/read` or WebFetch. **Never write a blurb from the URL alone.** |
| A raw fact or thought | Use it as given; verify anything factual you're unsure of. |
| "that thing we just discussed" | Pull from conversation context. Confirm which thing if ambiguous. |
| A `/watch` highlight | Reuse the claim and link with the `&t=` timestamp intact. |

## 2. Write it

One file: `content/interesting/{kebab-case-slug}.mdx`. The filename is never
used as a slug or key — it's for humans browsing the directory.

```mdx
---
title: Octopuses have three hearts
date: 2026-06-05
url: https://www.scientificamerican.com/article/octopus-hearts/
tags:
  - biology
---

Two pump blood to the gills, one to the body — and the body one _stops_ when
they swim. That's part of why they prefer crawling: swimming is genuinely
exhausting for them.
```

**Frontmatter rules** (schema is in `velite.config.ts`, collection `interesting`):

- `title` — required, ≤120 chars, unquoted plain YAML.
- `date` — required, bare `YYYY-MM-DD`, unquoted. Today unless he says otherwise.
- `url` — optional. Omit the key entirely when there's no source; don't write `url:` empty.
- `tags` — optional, YAML block list. Existing vocabulary is tiny (`podcast`,
  `biology`) and free-form. Reuse an existing tag when one fits; invent sparingly.
- **Never write `code` or `metadata`** — Velite derives those. Writing them breaks the build.

## 3. Voice

The body is 1-3 sentences. Read both existing entries before writing; match the
better one.

- **Lead with the thing itself, not with your reaction to it.** "Two pump blood
  to the gills, one to the body" — not "I found this fascinating article about…".
- **Concrete mechanism over adjectives.** *Why* it's true or *how* it works beats
  "amazing" and "top notch".
- Plain declaratives. `_italics_` for a single load-bearing word, sparingly.
- No hedging, no "definitely check it out", no summary of what the link contains.
- If the only honest thing to say is "this was fun", say that in one short line
  and stop. Don't inflate.

The reader already knows he thinks it's interesting — it's on a page called
`/interesting`. Spend the sentences on substance.

## 4. Verify

```bash
~/.claude/skills/interesting/scripts/verify.sh "<exact title>"
```

Rebuilds the Velite layer and confirms the item is in the collection, echoing
back the parsed date, url, and tags. A frontmatter violation fails here with the
full Velite log — fix and rerun. `npm run check` (oxlint + tsgo) does **not**
cover content files, so this is the only real gate.

Then report the file path and the parsed fields.

## 5. Stop

Do **not** commit, push, or deploy unless asked. The working tree often carries
unrelated changes — if he does ask, stage only the new file by path, never `-A`.

## Gotchas

- **`content/links/` is a different collection that renders on `/notes`, not
  `/interesting`.** Its schema is similar but requires `description`. Never put
  an interesting item there.
- The `interesting` files use YAML block-list tags; the rest of the repo uses
  inline `tags: [a, b]`. Match the collection (block), not the repo.
- `url` is validated as `s.string()`, not `s.url()` — a malformed URL builds
  fine and breaks silently in the browser. Check it yourself.
- Items sort by `date` descending. A backdated entry won't appear at the top;
  `verify.sh` warns when that happens.
- Deploys to Vercel (not Cloudflare, despite the stale `.wrangler/` dir).
