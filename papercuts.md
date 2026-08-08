# Papercuts

Small friction hit while working, newest last. Written by `papercut`.

## 2026-08-05 15:09 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
`ls -la` produced no output when chained with && in a compound Bash tool call; ran fine standalone
**Worked instead:** run ls as its own command

## 2026-08-05 15:22 +0000 · setup · claude-opus-5 · gigover@polish/untouched-surfaces · claude-code
PostToolUse hook configured for ~/.claude/hooks/papercut-detect.py but file does not exist; every MCP tool call returns a blocking hook error
**Worked instead:** create the file or remove the hook from settings.json

## 2026-08-05 15:27 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
gh gist create --secret fails; secret is already the default and only --public exists, but the flag's absence reads as 'gists are public by default'
**Worked instead:** omit the flag entirely; gh gist create is secret unless --public

## 2026-08-05 22:16 +0000 · tool · claude-opus-5 · gigover@master · claude-code
RemoteTrigger action:list returns has_more/next_cursor but ignores a cursor passed in body — got the identical 20 rows back, so paging past the first page is impossible from the tool
**Worked instead:** fall back to https://claude.ai/code/routines for the full list

## 2026-08-06 10:51 +0000 · docs · claude-opus-5 · dotfiles@master · claude-code
varlock vite docs claim @sensitive prevents secrets bundling into client code; plugin only guards HTML replacements. ENV.SECRET in client JS inlined plaintext with no build error
**Worked instead:** For client-only SPAs use import.meta.env + VITE_ prefix as the real boundary; varlock leak prevention is server-runtime only (patches ServerResponse)

## 2026-08-06 12:06 +0000 · tool · claude-opus-5 · gigover@master · claude-code
cp in Bash tool prompted 'overwrite?' and failed non-interactively; cp appears aliased to cp -i via the user profile
**Worked instead:** use 'command cp' or '\\cp' to bypass the alias

## 2026-08-06 16:56 +0000 · flaky · claude-opus-5 · gigover@hotfix/countdown-invalid-hook-call · claude-code
GitHub Actions jobs failed in 'Set up job' with 'Failed to resolve action download info: Service Unavailable'; looked like a lint/test failure but no code ran
**Worked instead:** gh run rerun <id> --failed
