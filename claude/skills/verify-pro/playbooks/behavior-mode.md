# BEHAVIOR mode playbook

Verify a stated feature works end-to-end, regardless of what's in the diff.

## Step 1 — Define "works"

Restate the behavior in concrete observable terms. Bad: "auth works". Good: "user can log in with email/password, sees the dashboard, and a session cookie is set."

If the user's statement is fuzzy, ask one clarifying question. Behavior verification with fuzzy criteria is the #1 source of false PASS verdicts.

## Step 2 — Map the path

List the layers the behavior touches:
- UI surface (which route/component)
- Client-side state/handlers
- Network calls (which endpoints)
- Server route handler
- Database read/write
- Side effects (emails, queue jobs, third-party APIs)

State the path. This becomes the verification checklist.

## Step 3 — Walk the path

For each layer:

| Layer | Check |
|-------|-------|
| UI | Render the page in dev server, see the element exists and is interactable |
| Client | Trigger the action, watch for client-side errors in console |
| Network | Inspect the request via browser devtools or Playwright network capture — correct method, payload, status |
| Server | Check server logs or response — handler ran, returned expected shape |
| DB | If safe, query directly to confirm the write/read happened |
| Side effects | Confirm the side effect fired (log line, queued message, test inbox) |

Skip layers that don't apply to the current behavior.

## Step 4 — Negative path

For at least one obvious failure case (invalid input, missing auth, network failure), confirm the behavior degrades correctly. Single check, not exhaustive.

## Step 5 — Apply lessons

For each loaded lesson, run its `verification_step`. Behavior lessons often encode "the thing that looks fine but isn't" — pay extra attention to hits here.

## Step 6 — Verdict

Same scale as DIFF mode (PASS / FAIL / INCONCLUSIVE). Behavior mode is more likely to land at INCONCLUSIVE when an external dependency is unavailable; say so explicitly.

## Stuck risk

BEHAVIOR mode is the easiest mode to get falsely stuck in because "the feature looks broken" can mean many things (real bug, dev env misconfig, stale data, your own misunderstanding). The stuck-detection rules in SKILL.md should account for this.
