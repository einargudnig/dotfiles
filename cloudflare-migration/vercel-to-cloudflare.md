# Vercel → Cloudflare feature mapping

Difficulty is for the *migration*, not the feature. **Assumes no project lands
on Next.js** — Next projects are rewritten rather than lifted, which removes
this file's hardest rows (see `README.md`, "This is two migrations, not one"). Numeric limits are
deliberately absent — check `claude/skills/cloudflare/references/` and the
Cloudflare docs, which is what that skill tells you to do anyway.

## Hosting

| Vercel | Cloudflare | Difficulty | Notes |
|---|---|---|---|
| Static site / SPA | Workers static assets (`assets.directory`) | trivial | Prefer Workers static assets over Pages for anything new — full routing control, and Pages is where Cloudflare's attention isn't |
| Vite + React SPA | Workers static assets | trivial | Serve via `env.ASSETS.fetch(request)` |
| Hono API | Workers, natively | trivial | This is Workers' home turf |
| Astro | `@astrojs/cloudflare` adapter | easy | Well-trodden |
| TanStack Start | Nitro cloudflare preset | easy | Vite/Nitro-based, adapter swap |
| Edge Functions / middleware | Worker | easy | Closest runtime match Vercel has to offer |
| Serverless Functions (node) | Worker + `nodejs_compat` | medium | Compat covers a lot, not everything — no filesystem writes. Audit what the handler imports |
| **Next.js (App Router)** | *rewrite — see `inventory.md`* | n/a | Not being lifted. No project ends up on Next, so OpenNext never enters the picture |

## Data

| Vercel | Cloudflare | Difficulty | Notes |
|---|---|---|---|
| Vercel Blob | R2 | easy | Clean equivalent, and egress is free |
| Vercel Edge Config | Workers KV, or Flagship for flags | easy | |
| Vercel Postgres (Neon) | Keep Neon, add Hyperdrive | easy | Hyperdrive pools connections and caches non-mutating reads. Needs `nodejs_compat`. Lower-risk than a D1 rewrite |
| Vercel Postgres → D1 | D1 | hard | Only if the app is small and you *want* SQLite. Otherwise keep the existing Postgres |
| Vercel KV (Upstash Redis) | Workers KV | **medium — semantics differ, and the one that survives the rewrite** | KV is eventually consistent with a read-cache TTL; Redis is not. Anything using it as a lock, counter, or rate limiter needs Durable Objects instead. Read this row twice |

## Runtime features

| Vercel | Cloudflare | Difficulty | Notes |
|---|---|---|---|
| Cron Jobs | Cron Triggers | easy | UTC only; ~15min propagation after deploy; at-least-once, so handlers must be idempotent |
| `waitUntil` | `ctx.waitUntil` | trivial | Same idea |
| Streaming / SSE | Supported | easy | Watch CPU-time limits on long streams |
| Image Optimization (`next/image`) | Build-time transform → R2, or Cloudflare Images | easy → medium | Off Next there's no `/_vercel/image` to replicate. Pre-transform at build and serve static from R2 where you can; Cloudflare Images only where transforms must be dynamic (its pricing model is the line item most likely to change your bill) |
| ISR / on-demand revalidation | Cache API, or KV for shared cache | medium | **The requirement survives the rewrite even though the feature doesn't.** A page that was ISR still has a freshness requirement — it just becomes an explicit caching decision instead of a framework default. Capture the requirement in the inventory |
| Regions / function region pinning | Smart Placement | easy | Different model — you don't pick a region, Cloudflare places the worker relative to your backend |
| Analytics / Speed Insights | Web Analytics | easy | Free, privacy-preserving, and measures different things. Don't expect the graphs to line up |
| Vercel Firewall | Cloudflare WAF | easy | Strictly an upgrade |

## Platform

| Vercel | Cloudflare | Difficulty | Notes |
|---|---|---|---|
| Env vars / secrets | Worker secrets, or Secrets Store | easy | Alchemy wraps secrets so they don't land in state in plaintext |
| Preview deployments | Per-branch Alchemy stage | medium | The piece with no turnkey equivalent. PR open → deploy stage, PR close → destroy it. Skip the teardown half and you accumulate dead Workers |
| Git-connected builds | GitHub Actions (Workers Builds exists, but) | easy | With Alchemy the deploy is `alchemy deploy` from Actions — using Workers Builds too would mean two systems deploying the same Worker |
| Custom domains | Workers routes / custom domains | medium | **The zone must be in your Cloudflare account.** This is the real cutover step and the one with user-visible downtime if fumbled |
| Deployment rollback | Workers version rollback | easy | |

## Traps

Things that don't appear as a row in any table but cost an afternoon:

- **Worker bundle size limit.** Compressed. Much less of a threat off Next, but
  still worth checking early on anything with heavy server-side dependencies.
- **CPU time, not wall time.** Awaiting a slow API doesn't count against you;
  a heavy synchronous loop does. Different mental model from Vercel's timeouts.
- **No filesystem writes.** Anything writing to `/tmp` needs R2 or a DO.
- **`nodejs_compat` is broad but not total.** Check the actual import list.
- **Alchemy state.** Local file state plus a CI deploy means orphaned resources
  and a manual reconcile. Use `Cloudflare.state()` from the first commit.
- **Framework defaults you no longer get for free.** Next supplied caching,
  image handling and route-level revalidation as defaults. On TanStack Start or
  Astro each becomes a decision. That's a feature — it's also how requirements
  go missing during a rewrite.

## Cutover sequence

Per project, once it deploys clean:

1. Deploy to `*.workers.dev` and verify properly — not just a 200 on `/`.
2. Move the zone to Cloudflare DNS if it isn't already. Wait out propagation.
3. Drop the record's TTL well ahead of the switch.
4. Point the record at the Worker. Leave the Vercel deployment up.
5. Watch for a few days — errors, latency, anything using a feature from the
   hard-difficulty rows above.
6. Only then delete the Vercel project.

Step 4 is the reason the pilot needs a real domain: everything up to it is
reversible, and it's worth having done once on something that doesn't matter.
