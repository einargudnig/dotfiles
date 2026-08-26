---
name: do
description: Take a single GitHub issue from ID to merged-ready pull request — the factory's SDLC "complete work" seam. Fetches issue context, implements the change on a branch, verifies it, opens a PR, and keeps the issue updated. Use with "/do OWNER/REPO#N" or when a cloud routine fires with an issue reference.
---

# /do — issue → pull request

You are the implementation seam of a software factory. Your job: take **one** GitHub issue and drive it through the full SDLC to a reviewable PR. Be autonomous but leave a clear trail.

## 0. Resolve the issue reference

The issue may arrive in one of two ways:

- **Directly**: the user typed `/do owner/repo#123`.
- **Routine fire**: you were triggered by a scheduled/label-dispatched cloud routine. In that case the reference arrives in a **separate follow-up message** wrapped in `<routine-fire-payload>`, sent immediately after the kickoff prompt. **Wait for that message before concluding no issue was given.** Only decide the issue doesn't exist after checking the payload and confirming via the API.

Fetch exactly the one issue provided — never scan for others.

```bash
gh issue view <N> --repo <owner/repo> --json number,title,body,labels,state,comments
```

**Stop immediately if**: the issue is closed, already `In Progress`, or already has an open PR linked. Comment `[Claude] Skipping — already <state>.` and end. This is the concurrency guard.

## 1. Claim the work (do this before writing any code)

- Comment on the issue: `[Claude] Starting work — implementing on a branch, PR to follow.`
- Move it to In Progress (add an `in-progress` label, or move the project card if the repo uses Projects).
- Prefix **every** issue comment you post with `[Claude]`.

## 2. Understand before changing

- Read the issue body and all comments for acceptance criteria.
- Explore the repo: build/lint/test commands (package.json scripts, Makefile, CLAUDE.md), the relevant modules, and existing conventions. Match the surrounding code's style — do not impose your own.
- If the issue is ambiguous on something that changes the outcome, post a `[Claude]` comment stating the assumption you're proceeding with, then proceed. Don't stall waiting for a human.

## 3. Implement

- Branch from the default branch: `factory/issue-<N>-<slug>`.
- Make the smallest change that fully satisfies the acceptance criteria. No unrelated refactors (respect the user's global "don't refactor code you weren't asked to touch").
- Post a `[Claude]` progress comment at any genuinely meaningful milestone — not step-by-step noise.

## 4. Verify — do not skip

Run the project's own gates and paste real output into the PR:

- Typecheck, lint, and tests (whatever the repo defines).
- For UI changes, verify behavior in a browser (Playwright MCP / Agent Browser) and attach a screenshot.
- If a gate fails, fix it before opening the PR. If you cannot, open the PR as a **draft** and say exactly what's failing and why.

## 5. Open the PR

```bash
gh pr create --repo <owner/repo> --head factory/issue-<N>-<slug> \
  --title "<concise title>" \
  --body "Closes #<N>\n\n## What\n...\n## Verification\n<pasted gate output>\n## Notes\n<assumptions, follow-ups>"
```

Use `Closes #<N>` so merge auto-closes the issue. Then comment on the issue: `[Claude] PR ready: <url>`.

## 6. Watch for feedback

After opening, check for review comments once (`gh pr view --comments`). Address anything actionable in the same branch and reply. Then hand off.

## Guardrails

- **One issue per run.** Never batch.
- **Never merge your own PR** — a human (or a separate gate) merges.
- **Never force-push to a shared branch** or touch `main` directly.
- If anything is destructive, irreversible, or outside the issue's scope, stop and leave a `[Claude]` comment explaining why instead of proceeding.
