# Inventory

One row per Vercel project. Fill this in before writing any infrastructure —
the difficulty column is what orders the migration, and the "hard bits" are
what determine whether a project is an afternoon or a weekend.

## Summary table

| Project | Repo | Framework | Domain(s) | DNS today | Runtime | Hard bits | Difficulty | Target |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

- **Runtime** — node / edge / static-only. Edge and static are near-free moves;
  node functions need `nodejs_compat` and a look at what they actually import.
- **Hard bits** — from [`vercel-to-cloudflare.md`](./vercel-to-cloudflare.md).
  ISR, image optimization, and Vercel KV are the three that usually hurt.
- **Difficulty** — trivial / easy / medium / hard, using the same file's ratings.
- **Target** — Workers static assets / Workers (SSR) / Workers + D1 / delete.

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
- Runtime:            node | edge | static
- Domains:            (apex? www? subdomains? wildcards?)
- DNS zone lives at:  Cloudflare | Vercel | other
- Env vars:           count, and which are secrets vs config
- Data:               Postgres / KV / Blob / Edge Config / none — and where it
                      actually lives (Neon? Upstash? Supabase?)
- Cron jobs:          schedules + what they do
- Uses ISR / on-demand revalidation:      y/n
- Uses next/image or Vercel image opt:    y/n
- Uses middleware:                        y/n
- Preview deploys matter:                 y/n
- Analytics / Speed Insights in use:      y/n
- Traffic (rough):
- Still alive?        yes | archive | delete
```

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

`vercel.json` is the highest-signal file: crons, rewrites, headers, regions and
function config all live there, and every one of them needs a Cloudflare
equivalent.

## What to do with the result

Sort by difficulty ascending. The pilot is the easiest project that still has a
real custom domain on it — easy enough that failures are Alchemy's fault rather
than the app's, real enough that DNS cutover gets rehearsed before it matters.
