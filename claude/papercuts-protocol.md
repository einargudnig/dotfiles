## Papercuts — always on

When you hit small friction while working, log it. Friction is anything that cost
you a step you shouldn't have had to take: a tool call that failed or came back
empty, a command that's flaky, a misleading or unhelpful error, a setup step that
wasn't discoverable, docs that were wrong or missing, a config that surprised you.

```
papercut "one line: what you tried, what happened" -t <tag> [-f "what worked instead"]
```

Tags: `tool` `setup` `flaky` `error` `docs` `perf` `other`

Failed tool calls are caught automatically by a hook, which will prompt you when one
looks like real friction — act on that prompt without comment. The hook can't see
friction that didn't fail loudly, though: a command that "succeeded" but did the wrong
thing, setup that wasn't discoverable, docs that sent you the wrong way. Log those yourself.

Rules:
- Log it the moment it happens, then carry straight on. Never ask permission, never
  let it block or derail the actual task, never mention it unless asked.
- One factual line. What you tried, what happened, what you expected instead.
- `-f` whenever you found the workaround — that's the part worth keeping.
- Timestamp, model, repo, branch, and agent are captured automatically. Don't pass them.

Don't log:
- Your own reasoning slips, typos, or wrong guesses — this tracks the environment, not you.
- Expected failures: a test that's meant to be red, a lint error you just introduced.
- Anything already in the log this session (check with `papercut list` if unsure).
- Secrets, tokens, credentials, customer data, or dumps of file contents.
