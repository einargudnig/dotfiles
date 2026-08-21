---
name: figma-connect
description: Set up the Figma connector in Claude and pull real design content (screenshots, structure, colors, spacing, code) from a pasted Figma link. Use when someone pastes a figma.com link, asks how to connect or set up Figma in Claude, says Figma isn't working or asks them to enable Dev Mode, or wants Claude to look at, describe, or build from a design.
---

# Figma in Claude

Two Figma servers exist. **Always use the remote one** — the desktop one needs the Figma app
running with the right file open, and is the source of nearly every "Figma isn't working" report.

| | Remote (use this) | Desktop (avoid) |
|---|---|---|
| Address | `https://mcp.figma.com/mcp` | `http://127.0.0.1:3845/mcp` |
| Figma plan | all seats and plans | Dev/Full seat, paid plans only |
| Figma app open? | no | yes, with the file open |
| Works from a pasted link? | yes | no — only the open file |

## Setup (once per person)

1. On claude.ai: **Customize > Connectors** > **+** > **Add custom connector** > paste
   `https://mcp.figma.com/mcp` > **Add**
2. Click **Connect** on the Figma connector, and sign in to Figma in the window that opens
3. Paste a Figma link into a chat and ask for something (see below)

Do this on claude.ai even if you mostly use the desktop app — same account, so the connector
shows up in both. Free plans allow only one custom connector; Pro and Max allow more.

On a Claude **Team or Enterprise** workspace an owner must add it once for everyone first
(Organization settings > Connectors > **Add** > hover **Custom** > **Web** > paste the URL >
**Add**), after which members only do step 2. In **Claude Code** it is one command instead:
`claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp`

## Using it

Paste the link **with the layer selected in Figma** — the `?node-id=` on the end is how Claude
knows which frame you mean. A link with no `node-id` points at a whole page and returns a lot
of noise.

Ask for what you actually want; each maps to a different capability:

- "What does this look like?" / "describe this screen" → renders a screenshot
- "What are the colors and spacing?" → variables and design tokens by name
- "Build this" / "turn this into a component" → reference code, then adapted to the codebase
- "What's in this frame?" → the layer tree, for finding the right node id in a big file

## When it doesn't work

| Symptom | Cause | Fix |
|---|---|---|
| Claude says to enable Dev Mode MCP Server in the Figma app | It reached the desktop server, not the remote one | Set up the remote connector above; it needs no Figma app |
| "Cannot access" / empty result | You lack access to that Figma file | Ask the file owner for view access — Claude only sees what you can see |
| Claude describes the wrong screen | Link had no `node-id`, or the wrong layer was selected | Select the exact frame in Figma, copy the link again |
| Your latest edits are missing | Remote server reads saved file state | Save in Figma, or use the desktop server (see [REFERENCE.md](REFERENCE.md)) |
| Worked yesterday, stub message today | Stale connector session | Reconnect the connector, or restart the app |

Never tell a non-technical user to enable Dev Mode, open a port, or restart anything as a first
step. The remote connector removes all of that.

For the desktop server, unsaved-edit access, and raw HTTP debugging: [REFERENCE.md](REFERENCE.md)
