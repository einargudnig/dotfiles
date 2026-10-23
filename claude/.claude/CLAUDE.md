# Global Instructions

## Communication
- Respond in English unless I write in Icelandic, then Icelandic.
- Direct and concise. No preambles. Don't summarize what you did unless asked.

## Code
- TypeScript by default. `const` + arrow functions. Early returns over nesting.
- Small functions, composition over inheritance. Clear names (db/api/url fine).
- Run the project's lint/typecheck/test before declaring done.
- Small focused commits. Don't bundle unrelated changes.
- Don't add comments restating code. Don't refactor untouched code. Ask before adding deps.
- Don't create README/docs unless asked.

## Stack
- `~/work/` — **Maul**, food delivery. React Router v7, React, TS, Tailwind. Work machine only.
- `~/personal/` — React/Next.js, TS, Node.
- Cloudflare: use the project's `wrangler.jsonc` and its own wrangler; `cf` only where installed.
- Tasks: Taskwarrior + Things 3 via todo-sync (/todo). Notes: Obsidian (/done, /memento).

## Machine reality
- Read `~/MACHINE.md` when present. It records what this host actually has, and what
  is missing, so you don't plan around a checkout or vault that isn't there.
- Before using a tool, checkout, vault, or CLI: verify it exists (`command -v`, `test -d`).
  If it's missing, say so in one line and continue without it. Never simulate a save,
  recall, sync, or deploy.
- On a new machine, run `~/dotfiles/scripts/doctor.sh` before trusting any of the above.

## Workflow
- New feature/architecture → /think first. Bug → /hunt for root cause, don't guess-and-check.
- Picking up prior work → /continue-work.
- **For anything about what I know, decided, or wrote — consult the `concierge` agent before answering.** It searches my Obsidian vault. Never say "I don't know" about my own work without checking.

## MCP servers
- Global stdio servers start once per session, so only servers used near-daily stay global. Others go in the project's `.mcp.json` or local scope.
- Servers used across many projects run once as a shared HTTP service (launchd), not per session. No `npx -y`/`@latest` for long-lived servers: pin and install.

## Browser
- Default: `playwright` (headless). Use `playwright-headed` only when I explicitly ask to see the browser or need visual cues.
- Both are shared launchd services (`com.einargudjonsson.playwright-mcp[-headed]`); each session gets an isolated context, so no logins persist.

## Shell
- `fd` not find, `rg` not grep, `ast-grep`/`sg` for AST edits, `tree` for structure.
- `fd` skips symlinks by default — add `-L` when a dir may contain symlinked entries.
