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
```

Then open `http://mac-mini:3000` on the MacBook (or any tailnet device,
including the iPhone).

- **No change to the server** — it stays on `127.0.0.1`.
- **Same port number**, so `:3000` maps to `:3000`.
- **Tailnet-only** (your devices). This is `tailscale serve`, never
  `tailscale funnel` — funnel is the public internet.
- Survives reboots; a fresh `tserve <port>` replaces the entry for that port.

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

- Your own dev server, any port, want the cleanest URL → **`tserve <port>`**
- Want zero Tailscale config and don't mind rebinding → **`--host 0.0.0.0`**
- One-off, or a non-HTTP protocol → **`ssh -L`**
