---
name: maul-dev-setup
description: "Check and repair a Maul developer's Claude Code setup on macOS — git, GitHub auth, repo access, commit identity, MCP servers and plugins. Use for \"set up Claude Code\", \"check my setup\", \"why can't I clone\", or when a new person's first session doesn't work."
---

# Maul dev setup — check and repair

Run this on a Mac where Claude Code is already installed and signed in. If this skill is running, those two are proven — don't re-check them.

The job is: find out what's missing, show the person one list, and fix it only after they say yes.

## Non-negotiables

- **Phase 1 is read-only.** Every command in the diagnose table is safe to run without asking. Run them all before saying anything.
- **One yes, then fix.** Show the full report first. Don't fix item 1 while item 4 is still unknown — the person decides on the whole picture.
- **Never touch existing credentials.** If an SSH key or `gh` token already exists, leave it. Don't regenerate, don't overwrite `~/.ssh/config`, don't run `gh auth logout`.
- **Don't guess the repo.** Ask which one they'll work in. Cloning the wrong repo wastes their time and disk.
- **Two attempts, then stop.** If a fix fails twice, report the exact error and what you tried, and tell them to ping Einar. Don't improvise around auth failures.

## Phase 1 — diagnose

Run all of these. Don't stop at the first failure; the person wants the whole picture at once.

| # | Check | Command | Pass looks like |
|---|---|---|---|
| 1 | macOS version | `sw_vers -productVersion` | 13.0 or later |
| 2 | Git installed | `git --version` | any version prints |
| 3 | Commit identity | `git config --global user.name; git config --global user.email` | name set, email is `@maul.is` |
| 4 | GitHub CLI | `command -v gh && gh auth status` | logged in, token has `repo` scope |
| 5 | SSH fallback | `ssh -T git@github.com` (exit 1 with a greeting = success) | greets them by username |
| 6 | Org membership | `gh api user/orgs --jq '.[].login'` | the Maul org appears |
| 7 | Repo access | `gh repo list <org> --limit 20` | the repo they named is listed |
| 8 | Repo cloned | `ls -d <path>/.git` | directory exists |
| 9 | Node toolchain | `node --version; command -v pnpm npm` | only if the repo has a `package.json`; match any `.nvmrc` or `engines` field |
| 10 | AWS CLI | `command -v aws && aws sts get-caller-identity` | only needed for serverless/deploy work — flag as optional |
| 11 | CLI alongside desktop | `claude --version` | optional; absence is not a failure |
| 12 | MCP servers | `claude mcp list` | report which are connected, don't judge |
| 13 | Repo context file | `ls <repo>/CLAUDE.md` | exists, or note that it doesn't |

For checks 7–9 and 13 you need to know the repo. Ask once, early: *"Which repo will you be working in?"* If they don't know, run `gh repo list <org>` and let them pick from the list. Don't pick for them.

For check 6, don't assume the org slug — take it from the `gh api user/orgs` output.

## Phase 2 — report

One table. Missing things first, working things collapsed to a single line at the bottom. For every failure give the one command that fixes it, so the person can do it themselves if they'd rather.

Separate genuinely blocking items from optional ones:

- **Blocking** — git, GitHub auth, repo access, repo cloned. Without these nothing works.
- **Worth fixing now** — commit identity (wrong email means every commit is misattributed and it's tedious to correct later), Node version mismatch.
- **Optional** — AWS CLI, the CLI alongside the desktop app, extra MCP servers.

Then ask: *"Want me to fix the blocking ones?"* Wait for an answer.

## Phase 3 — fix

Only after a yes. Fix in this order, because each depends on the last:

1. **Git** — `xcode-select --install`. This opens a GUI dialog; tell them to click Install and say when it's done. Don't poll in a loop.
2. **Commit identity** — `git config --global user.name "Full Name"` and `git config --global user.email "<them>@maul.is"`. Ask for the name rather than guessing it from the GitHub handle.
3. **GitHub auth** — `gh auth login` if `gh` exists, else `brew install gh` first. This is interactive and opens a browser. Hand it over: explain what they'll see, let them complete it, then re-run `gh auth status` to confirm. If they'd rather use SSH, `ssh-keygen -t ed25519 -C "<them>@maul.is"` then `gh ssh-key add` — but only if no key exists already.
4. **Repo access** — if the repo isn't in their list, that's a permissions change nobody can fix from this machine. Name the repo and tell them to ask Einar or Hrafnkell for access to the team that owns it. Don't try workarounds.
5. **Clone** — `gh repo clone <org>/<repo> <path>`. Ask where they keep code; default to `~/code/<repo>` if they have no preference.
6. **Node** — if the repo pins a version, install it with whatever manager is already on the machine (`nvm`, `fnm`, `mise`). Don't install a second version manager alongside an existing one.

## Phase 4 — plugins and MCP

Plugins can't be installed from a script — the marketplace is UI-only. List what they should install and let them do it:

- `commit-commands` — `/commit`, `/commit-push-pr`, `/clean_gone`
- `github` — PR and issue helpers

For MCP servers, report what `claude mcp list` returned and which of Maul's usual set is absent (Maul MCP, Notion, Asana, Front, Vercel, Cloudflare). Adding one is a config change — describe it, don't do it silently.

## Phase 5 — smoke test

One end-to-end proof, not a list of assertions:

```bash
cd <repo> && git checkout main && git status && git pull
```

Clean tree, on `main`, pull succeeds — that's the whole setup working: auth, access, and clone all at once. Then start a fresh Claude Code session in that directory and confirm it loads.

## Closing

State what was fixed, what's still outstanding and who owns it, and what to read next — the `49 AI Tooling` pages in Notion for the day-to-day workflow. Don't restate the parts that already worked.