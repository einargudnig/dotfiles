# Vercel → Cloudflare migration

Moving personal projects off Vercel onto Cloudflare, with infrastructure
defined in TypeScript via [Alchemy](https://github.com/alchemy-run/alchemy).

## Decisions

| Decision | Choice | Why |
|---|---|---|
| IaC | Alchemy | TypeScript-native, Cloudflare is its strongest provider, covers what wrangler doesn't (zones, DNS, Access, cross-project wiring) |
| Alchemy track | **v2 beta** (`alchemy@next` + `effect@next`) | Infrastructure-as-Effects. Avoids doing the v0→v2 migration later. Accepted cost: beta, thin docs, Effect becomes a dependency of infra *and* app code |
| Layout | `alchemy.run.ts` per app repo + one central repo for account-level resources | App and infra deploy together. Zones, DNS, shared buckets, Access apps live centrally so they aren't owned by whichever project claimed them first |
| Order | Inventory → pilot → generalize → rewrites → fold into `newproj` | Writing IaC before the inventory means writing it twice |
| Next.js | Being migrated off entirely | No project ends up on Next, so OpenNext, ISR and image optimization are all off the table |

### On the v2 choice

npm `latest` currently points at `2.0.0-beta.72` (2026-08-12). The v0 async line
(`0.94.0`, last published 2026-08-01) lives on at
[alchemy-run/alchemy-async](https://github.com/alchemy-run/alchemy-async) and is
what essentially every tutorial and blog post describes. **We are deliberately
off the documented path.** Consequences to plan around:

- Pin an exact beta version. `alchemy@next` moves weekly; an unpinned install
  will change the API under a project we haven't touched in months.
- Source of truth is the repo, not the web: `examples/` in
  `alchemy-run/alchemy` and `https://alchemy.run/llms.txt`.
- The pilot exists partly to find out whether v2 is actually usable yet. If it
  isn't, falling back to v0 is a real option and the inventory work is not lost.

The v2 shape, for reference (`examples/cloudflare-worker/alchemy.run.ts`):

```ts
export default Alchemy.Stack(
  "CloudflareWorkerExample",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const api = yield* Api;
    const bucket = yield* Bucket;
    return { url: api.url.as<string>(), bucket: bucket.bucketName };
  }),
);
```

Note `state: Cloudflare.state()` — remote state, not local files. Anything
deployed from CI must use it; local file state plus CI means orphaned resources.

## This is two migrations, not one

Nothing lands on Next.js. That removes every hard row from the feature mapping —
no OpenNext, no incremental cache, no `next/image`. What replaces it is a
framework rewrite per Next project, on top of the platform move.

**Rewrite directly onto Workers. Never rewrite on Vercel first.**

A rewrite is the one moment you get to choose primitives. Do it on Vercel and
you will reach for Vercel's — its KV, its image handling, its caching — and then
pay to undo them. Do it against Workers and the primitives you pick are the ones
you keep. Same work, done once.

The corollary is that **the pilot must be a project that is already non-Next.**
The pilot's job is to answer one question — is Alchemy v2 usable — and a
concurrent framework rewrite makes every failure ambiguous. Isolate the
variables: prove the platform pattern on a straight lift-and-shift, then apply
the proven pattern to the rewrites.

So each project is one of two kinds, and they get scheduled differently:

| Kind | Work | When |
|---|---|---|
| **Lift-and-shift** (already non-Next) | Adapter swap + `alchemy.run.ts` + DNS cutover | First. One of these is the pilot |
| **Rewrite** (currently Next) | Framework rewrite targeting Workers from the first commit | After the pattern is proven |

### What the rewrite doesn't eliminate

Dropping Next removes the *adapters*, not the *requirements*. A Next page that
used ISR still has a caching requirement; it just becomes an explicit choice
(Cache API, or KV) instead of a framework default. Capture that in the inventory
as a requirement, not as "solved by the rewrite" — this is exactly the kind of
thing that gets quietly lost in a framework change and shows up later as a
mysteriously slow page.

Worth noting the rewrite pays a toolchain dividend too: per `scripts/newproj.md`,
Next was the one preset that couldn't run TypeScript 7, which is why it was
dropped in favour of TanStack Start. Off Next, everything lands on TS7 + oxc.

## Phases

- [ ] **1. Inventory** — [`inventory.md`](./inventory.md). One row per Vercel
      project, classified lift-and-shift vs rewrite. Runs locally (see below).
- [ ] **2. Pilot** — one **already-non-Next** project, end to end. Least
      critical, but with a real custom domain so DNS cutover gets exercised.
      Plain wrangler first as a baseline, then wrap in Alchemy so it's clear
      which problems belong to Cloudflare and which to Alchemy.
- [ ] **3. Central repo** — zones, DNS, shared R2, Access, email routing.
- [ ] **4. Remaining lift-and-shifts** — apply the proven pattern.
- [ ] **5. Rewrites** — Next projects, targeting Workers from the first commit.
      Ordered by how much each one is actually worth keeping.
- [ ] **6. Fold into dotfiles** — a `cloudflare` overlay for `newproj` so new
      projects are born deployed, and an `alchemy` skill alongside the existing
      `cloudflare` / `wrangler` ones (retrieval-first, same shape — Alchemy
      moves too fast for baked-in knowledge).

## Note on collection

`vercel.com` and `api.vercel.com` are both blocked from the Claude Code web
sandbox's egress proxy. Inventory collection runs locally.

## Open questions

- Which projects are actually on Vercel? (~100 repos on the account, most are
  old learning repos — the deployed set is much smaller.)
- Are the domains already on Cloudflare DNS, or on Vercel/elsewhere? Custom
  domains on Workers need the zone in the Cloudflare account.
- Which projects are already non-Next? That set is where the pilot comes from,
  and if it's empty the plan needs rethinking.
- For each Next project: rewrite, or delete? A rewrite is the most expensive
  row in this whole plan. Some of them won't be worth it.
