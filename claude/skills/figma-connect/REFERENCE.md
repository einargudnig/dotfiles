# Reference — desktop server and debugging

For engineers. Non-technical users should not need this file.

## When the desktop server is actually the right choice

Only two reasons to prefer `http://127.0.0.1:3845/mcp` over the remote server:

- You need **unsaved local edits** — the remote server reads saved file state
- Your org blocks the hosted endpoint

Requires a Dev or Full seat on a paid Figma plan, the Figma desktop app running, and the file
open. It serves only the currently open/selected file — a pasted link's file key is ignored, the
`node-id` is used to pick a node **inside the open file**. So a link to a file nobody has open
silently resolves against the wrong document.

Enable: Figma desktop > Figma menu (upper-left) > Preferences > **Enable Dev Mode MCP Server**.

## Diagnosing the "enable Dev Mode MCP Server" message

That message is a **client-side fallback**. The MCP client prints it whenever it fails to
handshake, regardless of cause — so it does not mean the server is off. Check the server itself
before acting on it:

```bash
lsof -nP -iTCP:3845 -sTCP:LISTEN
```

Listening means Dev Mode MCP is on and the client is stale, not the server. Reconnect the
connector or restart the app; the instructions in the message are then misleading.

## Talking to the desktop server directly

Useful when the connector is stale but you need design data now. Streamable HTTP, so it needs an
`initialize` handshake and the returned `mcp-session-id` on every later call:

```bash
U=http://127.0.0.1:3845/mcp
H=(-H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream')
SID=$(curl -s -D /tmp/h -o /dev/null -X POST $U "${H[@]}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"cc","version":"1"}}}'
  grep -i '^mcp-session-id' /tmp/h | tr -d '\r' | cut -d' ' -f2)
curl -s -X POST $U "${H[@]}" -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' >/dev/null
curl -s -X POST $U "${H[@]}" -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_metadata","arguments":{"nodeId":"0:1"}}}' \
  | sed 's/^data: //' | grep '^{'
```

Tools exposed: `get_metadata`, `get_design_context`, `get_screenshot`, `get_variable_defs`,
`get_motion_context`, `get_figjam`.

## Node ids

`?node-id=1-2` in a URL is `1:2` in every tool argument — hyphen in URLs, colon in the API.
Branch URLs (`/design/:fileKey/branch/:branchKey/:name`) use the **branch** key as the file key.

## Cost note

`get_metadata` on a whole page can return hundreds of thousands of characters. Get the page's
top-level frames first, then request the one frame you care about.
