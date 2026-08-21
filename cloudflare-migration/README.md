# Vercel → Cloudflare migration

Moving personal projects off Vercel onto Cloudflare, with infrastructure
defined in TypeScript via [Alchemy](https://github.com/alchemy-run/alchemy).

## Decisions

| Decision | Choice | Why |
|---|---|---|
| IaC | Alchemy | TypeScript-native, Cloudflare is its strongest provider, covers what wrangler doesn't (zones, DNS, Access, cross-project wiring) |
| Alchemy track | **v2 beta** (`alchemy@next` + `effect@next`) | Infrastructure-as-Effects. Avoids doing the v0→v2 migration later. Accepted cost: beta, thin docs, Effect becomes a dependency of infra *and* app code |
| Layout | `alchemy.run.ts` per app repo + one central repo for account-level resources | App and infra deploy together. Zones, DNS, shared buckets, Access apps live centrally so they aren't owned by whichever project claimed them first |
| Order | Inventory → pilot → generalize → fold into `newproj` | Writing IaC before the inventory means writing it twice |

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

## Phases

- [ ] **1. Inventory** — [`inventory.md`](./inventory.md). One row per Vercel
      project. Must happen on a machine with Vercel access (see note below).
- [ ] **2. Pilot** — one project end to end. Least critical, but with a real
      custom domain so DNS cutover gets exercised. Plain wrangler first as a
      baseline, then wrap in Alchemy so it's clear which problems belong to
      Cloudflare and which to Alchemy.
- [ ] **3. Central repo** — zones, DNS, shared R2, Access, email routing.
- [ ] **4. Migrate the rest** — ordered by the difficulty column from phase 1.
- [ ] **5. Fold into dotfiles** — a `cloudflare` overlay for `newproj` so new
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
- Any Next.js? It's the one framework where the migration is real work rather
  than an adapter swap. The `newproj` presets suggest you've already moved to
  TanStack Start, but older projects may not have.
