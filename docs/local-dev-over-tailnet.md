# Opening the mini's local servers from the MacBook

Both machines are already on Tailscale, so the mini has a name —
**`mac-mini`** (FQDN `mac-mini.tail5588b1.ts.net`). What does *not* work by
default is that dev servers bind `127.0.0.1`, which nothing but the mini itself
can reach. Bridge that one of three ways.

## 1. `tserve` — Tailscale Serve (recommended)

```sh
# on the mini
tserve 3000          # http://mac-mini:3000   -> 127.0.0.1:3000   (plain HTTP, same port)
tserve -s 3000       # https://mac-mini/      -> 127.0.0.1:3000   (TLS on 443)
tserve -t 5432       # mac-mini:5432          -> 127.0.0.1:5432   (raw TCP: db, gRPC, ...)
tserve -l            # what is currently exposed
tserve -x            # remove everything
tserve -f ...        # skip the safety checks (see the gotcha below)
```

Then open `http://mac-mini:3000` on the MacBook (or any tailnet device,
including the iPhone).

- **No change to the server** — it stays on `127.0.0.1`.
- **Same port number**, so `:3000` maps to `:3000`.
- **Tailnet-only** (your devices). This is `tailscale serve`, never
  `tailscale funnel` — funnel is the public internet.
- Survives reboots; a fresh `tserve <port>` replaces the entry for that port.

### Gotcha: same-port Serve only works with a `127.0.0.1` server

Serve binds `0.0.0.0:<port>` locally in order to accept tailnet traffic. It
therefore coexists only with a server bound to `127.0.0.1`. If the server binds
**all interfaces** (`*:PORT` — Expo/Metro, `vite --host 0.0.0.0`, …) then:

- it is **already reachable** at `http://mac-mini:<port>`, so you don't need
  `tserve` at all, and
- serving that same port would **steal the port from the server**, which then
  binds something else (or nothing) while your URL only ever 502s.

`tserve` now refuses both cases with a hint, and also refuses a port that
nothing is listening on yet. `-f` overrides when you know better.

## 2. Bind the server to the tailnet

No tunnel at all — the server itself listens where the tailnet can reach it,
then `http://mac-mini:PORT` just works.

| Tool | Start with |
| --- | --- |
| Vite | `vite --host 0.0.0.0` |
| Next.js | `next dev -H 0.0.0.0` |
| SvelteKit / Astro / Nuxt | `--host 0.0.0.0` |
| CRA | `HOST=0.0.0.0 npm start` |
| Python | `python3 -m http.server 8000 --bind 0.0.0.0` |
| Rails | `rails s -b 0.0.0.0` |
| Hugo | `hugo server --bind 0.0.0.0 --baseURL http://mac-mini:1313` |

`0.0.0.0` also exposes the port on the **LAN**. To keep it tailnet-only, bind
the Tailscale address instead:

```sh
vite --host "$(tailscale ip -4)"     # 100.126.200.82
```

## 3. SSH tunnel — the catch-all

Nothing installed, works for non-HTTP, lives and dies with the terminal:

```sh
ssh -N -L 3000:localhost:3000 mac-mini    # then http://localhost:3000
ssh -N -L 5432:localhost:5432 mac-mini    # Postgres, etc.
```

## Names

- Short (MagicDNS): `mac-mini`
- FQDN: `mac-mini.tail5588b1.ts.net`
- Tailscale IPv4: `tailscale ip -4`

## Rule of thumb

- Server stays on `127.0.0.1` (Vite / Next default) → **`tserve <port>`**
- Server binds all interfaces (`--host 0.0.0.0`, Expo/Metro) → **just open
  `http://mac-mini:<port>`**; do *not* `tserve` that same port
- Want tailnet-only and can't rebind → **`tserve -s <port>`** (HTTPS on 443)
- One-off, or a non-HTTP protocol → **`ssh -L`**
