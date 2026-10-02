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
- `~/work/` — **Maul**, food delivery. React Router v7, React, TS, Tailwind.
- `~/personal/` — React/Next.js, TS, Node.
- Tasks: Taskwarrior + Things 3 via todo-sync (/todo). Notes: Obsidian (/done, /memento).

## Workflow
- New feature/architecture → /think first. Bug → /hunt for root cause, don't guess-and-check.
- Picking up prior work → /continue-work.
- **For anything about what I know, decided, or wrote — consult the `concierge` agent before answering.** It searches my Obsidian vault. Never say "I don't know" about my own work without checking.

## Shell
- `fd` not find, `rg` not grep, `ast-grep`/`sg` for AST edits, `tree` for structure.
- `fd` skips symlinks by default — add `-L` when a dir may contain symlinked entries.

<!-- lifeos:begin -->
## LifeOS

Routing table: `~/.claude/LIFEOS/DOCUMENTATION/` (on-demand — see `ARCHITECTURE_SUMMARY.md`
for the map, `CoreComponents.md` for the component list). Constitutional rules live in
`~/.claude/LIFEOS/LIFEOS_SYSTEM_PROMPT.md` and load only via the `lifeos` launcher, not plain `claude`.

@LIFEOS/DOCUMENTATION/ARCHITECTURE_SUMMARY.md
# Identity imports — activated by ActivateImports.ts once the USER tree is populated.
# @LIFEOS/USER/TELOS/PRINCIPAL_TELOS.md
# @LIFEOS/USER/PRINCIPAL/PRINCIPAL_IDENTITY.md
# @LIFEOS/USER/DIGITAL_ASSISTANT/DA_IDENTITY.md
# @LIFEOS/USER/PROJECTS.md
# @LIFEOS/USER/CONFIG/OPERATIONAL_RULES.md
<!-- lifeos:end -->
