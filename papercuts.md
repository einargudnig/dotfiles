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
