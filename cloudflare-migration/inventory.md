# Inventory

One row per Vercel project. Fill this in before writing any infrastructure —
the difficulty column is what orders the migration, and the "hard bits" are
what determine whether a project is an afternoon or a weekend.

## Summary table

| Project | Repo | Framework now | Kind | Target framework | Domain(s) | DNS today | Hard bits | Effort |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

- **Kind** — `lift` (already non-Next: adapter swap only) or `rewrite`
  (currently Next). This is the column that schedules the work. The pilot comes
  from the `lift` set.
- **Target framework** — see the preset mapping below.
- **Hard bits** — from [`vercel-to-cloudflare.md`](./vercel-to-cloudflare.md).
  With Next gone, Vercel KV is the main one left; plus any caching requirement
  that ISR was quietly satisfying.
- **Effort** — for `lift`, the platform move only. For `rewrite`, be honest that
  it's the app rewrite plus the platform move, and size it accordingly.

Be willing to write **delete** in that last column. Some of these are dead and
migrating them costs more than they're worth.

## Per-project capture

Copy this block per project. Anything you can't answer in 30 seconds is worth
looking up now rather than discovering mid-cutover.

```
### <project>

- Repo:
- Framework + version:
- Build command / output dir:
- Kind:               lift | rewrite
- Target framework:   (rewrites only — see preset mapping)
- Runtime:            node | edge | static
- Domains:            (apex? www? subdomains? wildcards?)
- DNS zone lives at:  Cloudflare | Vercel | other
- Env vars:           count, and which are secrets vs config
- Data:               Postgres / KV / Blob / Edge Config / none — and where it
                      actually lives (Neon? Upstash? Supabase?)
- Cron jobs:          schedules + what they do
- Uses ISR / on-demand revalidation:      y/n
  ↳ if y: what's the actual freshness requirement? (survives the rewrite)
- Uses next/image or Vercel image opt:    y/n
- Uses middleware:                        y/n
- Preview deploys matter:                 y/n
- Analytics / Speed Insights in use:      y/n
- Traffic (rough):
- Still alive?        yes | archive | delete
```

## Rewrite targets

Off Next, use the presets already defined in `scripts/newproj.md` rather than
inventing a per-project answer:

| Next project shape | Target | Preset |
|---|---|---|
| Full-stack React, SSR, routing, server functions | TanStack Start | `tanstack-start` |
| Content site, blog, mostly static + markdown | Astro | `astro` |
| Client-rendered dashboard, no SSR needed | Vite + React SPA | `vite-react` |
| API routes only, no UI | Hono | `hono` |

Two notes:

- **"Mostly static" is more projects than you think.** A Next app doesn't imply
  a need for SSR — plenty were Next because Next was the default. Check whether
  each one actually needs a server before picking `tanstack-start`; a SPA or an
  Astro site on Workers static assets is dramatically less to maintain.
- **Every one of these presets already targets TS7 + oxc.** The rewrite lands
  the toolchain at the same time, which is part of why it's worth doing rather
  than lifting the Next app across.

## Collecting it

Run locally — Vercel is unreachable from the web sandbox.

```sh
vercel projects ls              # the master list
vercel domains ls               # what's pointed where
vercel dns ls <domain>          # if the zone is still on Vercel DNS
vercel env ls <project>         # per project
```

Confirm flags with `vercel <cmd> --help` before trusting them; the CLI's
subcommand names have shifted between major versions and these are from memory,
not from a live check.

For anything the CLI doesn't surface — cron schedules, ISR usage, image
optimization — the repo is the better source:

```sh
rg -l 'vercel\.json|next\.config|"crons"' .
rg -n 'unstable_cache|revalidate|next/image|@vercel/(kv|blob|postgres|edge-config)' .
```

For Next projects specifically, the useful question isn't "what does it use" but
**"how much of it is actually server-rendered"** — that decides SPA vs Astro vs
TanStack Start, and it's the difference between a day and a fortnight:

```sh
rg -c 'use client' app/ src/          # client components
rg -l 'generateStaticParams|export const dynamic' app/
rg -l 'app/api/' -g '!node_modules'   # API routes → Hono, or Worker handlers
```

`vercel.json` is the highest-signal file: crons, rewrites, headers, regions and
function config all live there, and every one of them needs a Cloudflare
equivalent.

## What to do with the result

Split by **kind** first, then sort by effort ascending within each.

The pilot is the easiest `lift` project that still has a real custom domain on
it — easy enough that failures are Alchemy's fault rather than the app's, real
enough that DNS cutover gets rehearsed before it matters. Deliberately not a
`rewrite`: a concurrent framework change would make every pilot failure
ambiguous between "Alchemy v2 isn't ready" and "the rewrite is wrong."

Then, before scheduling any rewrite, ask whether the project is worth one. A
rewrite is the most expensive line in this plan, and "delete" is a legitimate
answer for anything that's been untouched for two years.
