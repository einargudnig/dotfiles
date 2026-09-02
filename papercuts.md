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

## 2026-08-10 09:55 +0000 · tool · claude-opus-5 · gigover@refactor/api-layer · claude-code
git diff master...HEAD -- 'web/src/**' from the web/ package dir silently matched 0 files (git root is the monorepo parent) — scan returned empty, read as 'no findings' instead of 'no files'
**Worked instead:** prefix pathspecs with :/ to anchor at the git root, e.g. -- ':/web/src'

## 2026-08-10 13:20 +0000 · tool · claude-opus-5 · maul-admin@chore/vite-8 · claude-code
npm install vite@8.2.1 failed ETARGET 'no matching version before 8/3/2026' — registry has a date cutoff, so 'npm view <pkg>@latest' reports newer versions than are actually installable
**Worked instead:** use the version from 'npm outdated' (Latest column), which respects the same cutoff

## 2026-08-10 13:25 +0000 · tool · claude-opus-5 · maul-admin@chore/react-router-8 · claude-code
npm install ERESOLVE when bumping react-router + @react-router/dev together (peer react-router ^8.3.0); npm kept reporting 'Found: @react-router/dev@7.17.0' from the stale lockfile even after package.json pinned 8.3.0
**Worked instead:** rm -rf node_modules package-lock.json && npm install — deps are exact-pinned so the regenerated lockfile is deterministic

## 2026-08-10 14:49 +0000 · tool · claude-opus-5 · maul-admin@chore/toolchain-2026-08 · claude-code
git commit during a merge commits only the index — ran 'npm run format' after 'git add', so the reformatted file silently stayed out of the commit and CI's format gate failed while local format:check passed
**Worked instead:** re-stage after any formatter run: 'npm run format && git add -A' immediately before commit; verify the committed tree in a clean clone, not the working tree

## 2026-08-10 14:49 +0000 · tool · claude-opus-5 · maul-admin@chore/toolchain-2026-08 · claude-code
cp is aliased to 'cp -i' in this shell; a scripted 'cp backup dest' silently prompted and left the destination unchanged, nearly losing a concurrent edit I had backed up
**Worked instead:** use 'command cp -f' in scripts to bypass the alias

## 2026-08-10 16:12 +0000 · tool · claude-opus-5 · maul-agents@main · claude-code
scripted 'cp file.bak file.ts' restore silently no-op'd — cp is aliased to cp -i, so it prompted 'overwrite?' and left mutated sources in place
**Worked instead:** use /bin/cp -f (absolute path bypasses the alias) for non-interactive restores in scripts

## 2026-08-10 20:21 +0000 · docs · claude-opus-5 · dotfiles@master · claude-code
ourlifeos.ai/install 'For AI Assistants' section says to run 'bun Tools/DetectEnv.ts' etc. but never says where the source tree comes from -- no clone/download step, so Tools/ never exists in cwd. Steps 2-7 are unfollowable as written.
**Worked instead:** Ignore that section; install.sh is the current path -- it fetches the danielmiessler/LifeOS release tarball and drops the skill into ~/.claude/skills, then hands off to /LifeOS setup.

## 2026-08-10 20:28 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
LifeOS DeployCore.ts 'nested-dependencies' step runs bun install recursively under $configRoot; because ~/.claude/skills is a symlink into my dotfiles repo it installed node_modules + bun.lock into an unrelated user-owned skill (turnstile-spin/templates/worker), contradicting the 'additive, touches only the LifeOS tree' promise.
**Worked instead:** Snapshot mtimes before deploy, then 'find claude/skills -name node_modules -o -name bun.lock -newermt <t>' and rm the ones outside the payload tree.

## 2026-08-10 20:31 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
LifeOS Doctor.ts --hooks reports 'if: not on PATH — hook cannot start' for a working hook whose command begins with the shell keyword 'if'. Its interpreter check takes the command's first token literally, so any inline-shell hook starting with if/for/while/case is a false positive.
**Worked instead:** Verify by running the hook command directly; ignore the Doctor row. Only leading tokens that are real binaries (python3, bash, node) are meaningful there.

## 2026-08-10 20:36 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
LifeOS DeployComponents.ts --apply replaced ~/.claude/settings.json (a symlink into my dotfiles repo) with a regular file, silently severing the link; the repo copy was left orphaned with stale content while the live file diverged.
**Worked instead:** Check 'ls -l ~/.claude/settings.json' after any LifeOS apply step. Repair: fold the live file's content back into the repo copy, rm the regular file, re-create the symlink. Only the statusLine block had diverged.

## 2026-08-10 20:37 +0000 · docs · claude-opus-5 · dotfiles@master · claude-code
LifeOS CLAUDE.template.md 'deactivates' its 5 identity @-imports by prefixing '# ', but in markdown that is a heading, not a comment -- Claude Code's import parser still resolves the @path, so all 5 placeholder identity files load every session and ActivateImports.ts is effectively a no-op.
**Worked instead:** To genuinely defer an @-import, delete the line or wrap it in an HTML comment. Verify with a fresh session: imported files appear in the CLAUDE.md system-reminder expansion.

## 2026-08-10 21:13 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
LifeOS GenerateTelosSummary.ts hardcodes the author's own Context Filter ('human flourishing, Human 3.0 transition, AI augmentation strategies...') as an unconditional lines.push at line 582 -- it ignores the Context Filter section in the user's TELOS.md and writes the author's values into PRINCIPAL_TELOS.md, which loads via @-import every session.
**Worked instead:** Patch the deployed ~/.claude/LIFEOS/TOOLS/GenerateTelosSummary.ts to read the '## Context filter' section from TELOS.md. Re-check after every LifeOS upgrade -- the payload will overwrite the patch.

## 2026-08-12 06:06 +0000 · tool · claude-opus-5 · gigover@master · claude-code
node --test lib-test/ (directory arg) reported 'tests 1 / pass 0 fail' and exited 0 while discovering none of the 10 tests in it — a green build for zero tests
**Worked instead:** pass an explicit glob: node --test "lib-test/**/*.test.js"

## 2026-08-12 23:29 +0000 · tool · claude-opus-5 · sterkir-pabbar@master · claude-code
vercel env add <name> preview --value X --yes returns status=action_required/git_branch_required, and the command it suggests for 'all Preview branches' is byte-identical to the one just run — infinite loop
**Worked instead:** pass an explicit git branch as the third arg: vercel env add NAME preview master --value X --yes

## 2026-08-12 23:38 +0000 · docs · claude-opus-5 · sterkir-pabbar@master · claude-code
sanity hooks create is interactive-only (no --url/--filter flags), and the management API POST /v2021-10-04/hooks/projects/<id> has a top-level 'filter' field that rejects GROQ strings - the GROQ filter actually lives in rule.filter, undocumented in the error messages
**Worked instead:** POST with type:document, apiVersion, and rule:{on:[...],filter:'_type == "x"',projection:'{_id}'}; probe with filter:{} to reveal the real response shape

## 2026-08-13 08:36 +0000 · setup · claude-opus-5 · maul-admin@feat/admin-panel-asana-tasks · claude-code
npm run sls:admin:deploy fails resolving ${env:REGLA_WEB_SERVICE_URL} for dailyBillingSnapshotCron; services/admin/.env predates the billing cron and has no REGLA_* keys. Blocks any full admin deploy, not just billing.
**Worked instead:** sls deploy function --function getLocation deploys a modified existing handler without resolving the whole stack

## 2026-08-13 08:36 +0000 · setup · claude-opus-5 · maul-admin@feat/admin-panel-asana-tasks · claude-code
correction to previous: sls deploy function is ALSO blocked by the unresolvable REGLA_* vars — serverless resolves the entire serverless.yml before deploying any single function
**Worked instead:** prefix dummy values on the command only: REGLA_WEB_SERVICE_URL=x REGLA_WEB_SERVICE_USERNAME=x REGLA_WEB_SERVICE_PASSWORD=x sls deploy function --function <fn>. Without --update-config only the named function's CODE is pushed, so the dummies never reach any lambda.

## 2026-08-13 09:04 +0000 · setup · claude-opus-5 · gigover@master · claude-code
cp to overwrite a file hit an interactive 'overwrite?' prompt in a non-interactive shell; cp is aliased to cp -i, so the copy silently didn't happen and exit 1
**Worked instead:** use 'command cp' or /bin/cp to bypass the alias in scripts

## 2026-08-13 11:01 +0000 · tool · claude-opus-5 · maul-backend@main · claude-code
oxlint 1.77.0 --rules prints nothing (exit 0, zero lines) — expected the registered rule list

## 2026-08-13 12:48 +0000 · tool · claude-opus-5 · maul-backend@main · claude-code
oxlint: passing a quoted glob ('**/*.{js,ts}') lints 0 files and exits 1 with no 'no files matched' message — looked like a fast successful run
**Worked instead:** pass directories, or let oxlint default to cwd and use ignorePatterns

## 2026-08-13 12:53 +0000 · setup · claude-opus-5 · maul-backend@main · claude-code
npm registry date cutoff (8/6/2026) blocked @oxlint/plugins@1.78.0 despite 'npm view' reporting 1.78.0 as latest
**Worked instead:** pin oxlint + @oxlint/plugins to the newest version published before the cutoff

## 2026-08-13 13:12 +0000 · setup · claude-opus-5 · maul-detrack-driverscreen@main · claude-code
git push to origin succeeded but GitHub warned the repo moved: detrack-dashboard -> detrack-driverscreen; local remote URL is stale
**Worked instead:** git remote set-url origin https://github.com/maul-is/detrack-driverscreen.git

## 2026-08-13 13:12 +0000 · tool · claude-opus-5 · maul-backend@chore/migrate-eslint-to-oxlint · claude-code
oxlint --type-aware silently no-ops when oxlint-tsgolint isn't installed: exit 0, same rule count, no warning that type-aware rules were skipped
**Worked instead:** verify with --format json that number_of_rules increases, or check node_modules/oxlint-tsgolint exists

## 2026-08-13 14:38 +0000 · flaky · claude-opus-5 · maul-backend@chore/migrate-eslint-to-oxlint · claude-code
git push rejected with remote: Internal Server Error (GitHub 500) on an otherwise valid push; retry succeeded
**Worked instead:** just retry the push

## 2026-08-14 08:45 +0000 · setup · claude-opus-5 · first-stack · claude-code
bun add -g alchemy produces a broken binary: optional peerDeps (@effect/platform-node, effect) aren't installed globally but lib/Cloudflare/Workers/WorkerBridge.js imports them statically, so 'alchemy --version' dies with ERR_MODULE_NOT_FOUND
**Worked instead:** run it project-local via 'bunx alchemy ...' where the peer deps are real dependencies

## 2026-08-14 13:07 +0000 · setup · claude-opus-5 · life-os@feat/edge-effect-workers · claude-code
bun add alchemy@beta -> 'tag beta not found, but package exists'; alchemy 2.0.0-beta.72 publishes under latest/next, no beta tag
**Worked instead:** bun add alchemy (latest already IS the beta), or pin 2.0.0-beta.72

## 2026-08-14 13:09 +0000 · setup · claude-opus-5 · life-os@feat/edge-effect-workers · claude-code
bunx alchemy --help crashes: 'Cannot find module @effect/platform-node/NodeServices' — required peer isn't installed by bun add alchemy and the error names an internal file, not the missing peer
**Worked instead:** bun add @effect/platform-node@rc (must match the effect 4 rc line)

## 2026-08-14 13:15 +0000 · tool · claude-opus-5 · life-os@feat/edge-effect-workers · claude-code
alchemy deploy writes .alchemy/ (bundles, logs) into the repo root but adds no .gitignore entry; git add -A commits generated worker bundles and oxlint lints them
**Worked instead:** add .alchemy/ to .gitignore and to oxlint ignorePatterns

## 2026-08-14 13:53 +0000 · tool · claude-opus-5 · life-os@feat/edge-effect-workers · claude-code
backgrounded 'alchemy tail' left running made a later 'alchemy deploy' in the same session hang until timeout (10m); deploy succeeded immediately after pkill -f 'alchemy tail'
**Worked instead:** kill any alchemy tail before deploying; don't leave tail backgrounded

## 2026-08-14 22:54 +0000 · flaky · claude-opus-5 · life-os@feat/edge-effect-workers · claude-code
alchemy deploy returns the worker URL before the new version is consistently live; requests in the next ~10-30s hit the previous version (routes 404 / stale behaviour), which reads as a code bug
**Worked instead:** sleep ~20s after deploy, or poll a known-new route until it stops 404ing, before testing

## 2026-08-14 23:24 +0000 · tool · claude-opus-5 · life-os@feat/edge-effect-workers · claude-code
vercel env add/ls respected the linked project (.vercel/project.json) but vercel redeploy used the global team context and failed with 'Deployment doesn't belong to current team maul'; the error suggests 'vc switch', which mutates global CLI state
**Worked instead:** pass --scope <team> to the command instead of switching teams globally

## 2026-08-15 09:40 +0000 · error · claude-opus-5 · sterkir-pabbar@master · claude-code
vercel dns ls <domain> returned 'No records found' with an empty table for a domain that has no DNS zone at all; vercel dns add then failed with 'is not a DNS zone (400)'. Expected ls to report the missing zone.
**Worked instead:** vercel domains inspect shows it: a domain with no zone lists 'Intended Nameservers -' instead of ns1/ns2.vercel-dns.com

## 2026-08-15 09:56 +0000 · setup · claude-opus-5 · gigover@feat/assistant-jurisdiction-and-analysis · claude-code
stack skill is listed and documents the local 'stack' CLI, but the binary isn't installed anywhere on PATH (~/.local/bin, ~/bin, brew, bun, npm -g all empty)
**Worked instead:** did the stacked-PR flow by hand with gh pr create --base / gh pr edit --base

## 2026-08-15 10:12 +0000 · setup · claude-opus-5 · life-os@test/edge-coverage · claude-code
cp aliased to cp -i silently declined to overwrite during a non-interactive restore ('not overwritten'), leaving mutated files in place after I had removed the backups
**Worked instead:** use 'command cp' / '\\cp', or git checkout for tracked files

## 2026-08-19 13:19 +0000 · tool · claude-opus-5 · gigover@feat/tender-design-pass · claude-code
rg prints matches with the matched text deleted (e.g. "from './OfferTable'" printed as "from './n'"); grep -n shows it correctly
**Worked instead:** use grep -n instead of rg when the matched substring itself matters

## 2026-08-20 14:24 +0000 · flaky · claude-opus-5 · maul-admin@feat/company-table-relations · claude-code
npm run test:coverage exited 1 with no failing tests and coverage far above thresholds; identical rerun exited 0
**Worked instead:** rerun before investigating; thresholds were not the cause

## 2026-08-20 22:38 +0000 · other · claude-opus-5 · posture · claude-code
Menu bar status item invisible on notched MacBook (1512x982, topInset 32) — macOS silently hides overflow behind the notch with no overflow menu or any indication the item exists
**Worked instead:** Cmd-drag menu bar icons to reorder; set NSStatusItem.autosaveName so position persists across relaunches

## 2026-08-21 01:11 +0000 · flaky · claude-opus-5 · gigover@fix/web-file-system-robustness · claude-code
AccountMenu.browser.test.tsx 'opens beside the avatar' fails ~2 of 3 runs in isolation on master; rect.left+rect.top measured as -8 before floating-ui positions the menu
**Worked instead:** re-run passes sometimes; needs a waitFor on the measured rect rather than an immediate read

## 2026-08-21 08:05 +0000 · tool · claude-opus-5 · gigover@fix/web-api-error-contract · claude-code
git stash -q push <file> failed with 'subcommand wasn't specified' because -q preceded the subcommand; the compound command continued and stash pop merged an UNRELATED stash into the tree, conflicting package.json
**Worked instead:** put the subcommand first: git stash push -q <file>; never chain stash pop after a command that may fail

## 2026-08-21 08:28 +0000 · tool · claude-opus-5 · chore+dependabot-drop-new-frontend@worktree-chore+dependabot-drop-new-frontend · claude-code
worktree-isolated session refused a read-only 'gh pr view' loop because the command string was 'too complex to verify'; gh talks to the API, not the working tree
**Worked instead:** split into one gh call per Bash invocation, or drop the shell loop

## 2026-08-21 11:09 +0000 · tool · claude-opus-5 · maul-backend@refactor/api-event-body-schema · claude-code
ran 'cd <dir> && ls -1 && echo MARK' in Bash — ls produced no output at all while the echo and later commands worked; happened twice
**Worked instead:** used 'fd . <dir> -t f' instead, which listed the files correctly

## 2026-08-21 13:51 +0000 · tool · claude-opus-5 · einar-os@master · claude-code
ran `timeout 60 npx wrangler ...` on macOS; zsh: 'command not found: timeout' — GNU coreutils timeout isn't on macOS by default
**Worked instead:** use `gtimeout` (coreutils) or drop the wrapper

## 2026-08-21 14:08 +0000 · tool · claude-opus-5 · einar-os@migrate/astro · claude-code
wrangler secret delete --force → 'Unknown argument: force', dumped full help; no --force flag exists
**Worked instead:** run it with </dev/null; wrangler auto-answers yes in non-interactive contexts

## 2026-08-21 14:34 +0000 · error · claude-opus-5 · maul-admin@main · claude-code
curl to a nonexistent dev-api path (/admin/locations, plural) returns 'Invalid key=value pair (missing equal-sign) in Authorization header' — a misleading auth error for what is actually a wrong path
**Worked instead:** check the real path in src/lib/*/api.ts first; it is /admin/location singular

## 2026-08-21 14:42 +0000 · tool · claude-opus-5 · einar-os@migrate/astro · claude-code
rg output substituted matched text with the literal 'n' — showed 'localStorage.getItem("n")' and 'import { BabyPage } from "./n"' where the files actually say "theme" and "./baby-page"
**Worked instead:** read the file directly (Read/sed) when the matched text itself matters; don't trust rg's rendering here

## 2026-08-23 09:51 +0000 · tool · claude-opus-5 · einar-os@migrate/astro · claude-code
ls is aliased to eza with icons; `ls | rg '^2026-08'` matched nothing and `d=$(ls -d ~/work/$r)` produced an icon-prefixed path that broke `git -C`
**Worked instead:** use fd, or `command ls`/`\ls` to bypass the alias in scripts

## 2026-08-24 09:30 +0000 · tool · claude-opus-5 · einar-os@migrate/astro · claude-code
vercel domains ls lists einargudni.com fine under the einargudni scope, but vercel dns ls einargudni.com on the same scope returns 'You don't have permission to list the domain record.' Expected both to work or fail together.
**Worked instead:** Read the zone from the Vercel dashboard DNS panel instead; CLI is also 53.1.0 vs 59.5.0 latest, may be version-related.

## 2026-08-24 12:07 +0000 · tool · claude-opus-5 · gigover@master · claude-code
playwright-mcp browser_file_upload rejected an absolute path in the session scratchpad: 'outside allowed roots' (roots are the repo dir and .playwright-mcp)
**Worked instead:** copy the fixture into <repo>/.playwright-mcp/ first, upload from there, delete after

## 2026-08-24 14:01 +0000 · tool · claude-opus-5 · einar-os@migrate/astro · claude-code
crt.sh subdomain enumeration returned 502 Bad Gateway; fell back to api.certspotter.com which only returned 2 of 6 known subdomains on the free tier
**Worked instead:** For Vercel-hosted zones, 'vercel project ls' lists every project with its production URL — authoritative and complete, no CT log needed.

## 2026-08-24 14:49 +0000 · tool · claude-opus-5 · posture@master · claude-code
wrangler dev failed: config compatibility_date 2026-08-21 exceeds the workerd binary's max 2026-07-29 in wrangler 4.114.0; deploy --dry-run passed so the mismatch only surfaces at local dev
**Worked instead:** pass --compatibility-date 2026-07-29 to wrangler dev, or upgrade wrangler (4.125.0)

## 2026-08-25 13:19 +0000 · docs · claude-opus-5 · gigover@master · claude-code
web/docs/backend-input-limits.md says to run 'mysql -h 127.0.0.1 -P 3307' but mysql is not on PATH — homebrew mysql-client is keg-only
**Worked instead:** use /opt/homebrew/opt/mysql-client/bin/mysql

## 2026-08-25 13:32 +0000 · tool · claude-opus-5 · gigover-backend@master · claude-code
gigpull stashed WIP, then git pull failed with Bitbucket 410 (app passwords deprecated, CHANGE-3222) — stash pop never ran, leaving WIP stranded in stash@{0}
**Worked instead:** git stash pop manually; guard gigpull with 'git stash && { git pull || true; } && git stash pop' or trap

## 2026-08-25 20:14 +0000 · docs · claude-opus-5 · gigover-backend@master · claude-code
Atlassian docs give https://bitbucket.org/account/settings/ssh-keys/ for adding personal SSH keys; URL returned 'Resource not found' in browser
**Worked instead:** navigate via UI: avatar > Personal Bitbucket settings > Security > SSH keys; 404 usually means wrong/logged-out Atlassian session

## 2026-08-26 13:59 +0000 · setup · claude-opus-5 · dotfiles@master · claude-code
moved dotfiles trees into stow package layout; git add -A then staged 110k files because root .gitignore patterns are path-anchored (claude/skills/...) and no longer matched the new claude/.claude/skills/... paths
**Worked instead:** patch the anchored gitignore paths in the same commit as any tree move, then re-check 'git status --porcelain | wc -l' before staging

## 2026-08-26 16:07 +0000 · tool · claude-opus-5 · dotfiles@master · claude-code
stow -R unlinks then relinks, so ~/.zshenv is briefly absent; shells spawned in that window start with no PATH and fail with 'command not found: rm/readlink'
**Worked instead:** use absolute binary paths (/bin/rm, /usr/bin/readlink) in any script that runs during a restow, or stow the zsh package last

## 2026-08-27 09:25 +0000 · docs · claude-opus-5 · einargudjonsson · claude-code
executor desktop app bound port 4789 while docs state 4788; /mcp returned bare 401 with no hint a bearer token was needed
**Worked instead:** real port + 36-char token are in ~/.executor/daemon-active-localhost-*.json (port, token keys); Connect card in the UI shows the filled-in command

## 2026-08-27 09:26 +0000 · docs · claude-opus-5 · einargudjonsson · claude-code
docs/local/cli.md says 'executor tools sources' but CLI 1.6.0 rejects it
**Worked instead:** correct subcommand is 'executor tools integrations'

## 2026-08-27 09:26 +0000 · docs · claude-opus-5 · einargudjonsson · claude-code
docs/local/cli.md 'executor call executor openapi addSource' is stale; 1.6.0 exposes addSpec/previewSpec
**Worked instead:** use 'executor call executor openapi addSpec'; previewSpec dry-runs a spec first

## 2026-08-27 09:32 +0000 · tool · claude-opus-5 · gigover@chore/procurement-contracts · claude-code
cp in this zsh is aliased to cp -i; a scripted 'cp a b' over an existing file hung the Bash tool for the full 5m timeout waiting on a y/n prompt
**Worked instead:** use 'command cp -f', 'install -m', or write the file with a heredoc instead

## 2026-08-28 08:26 +0000 · tool · claude-opus-5 · tender-agent-smoke@worktree-tender-agent-smoke · claude-code
gh issue view loop with for/head pipe rejected by worktree guard as 'too complex' though it touches no git state
**Worked instead:** run gh issue view one issue per Bash call

## 2026-08-28 09:17 +0000 · setup · claude-opus-5 · maul-admin@main · claude-code
Maul MCP delivery-stats tools (getDailyStats/getDeliveryStats/getZoneStats/getCollectionStats) all fail with 'Missing CONVEX_DEPLOYMENT_URL or CONVEX_DEPLOY_KEY' — Convex-backed tools unusable in this session

## 2026-08-28 10:31 +0000 · setup · claude-opus-5 · tender-agent-smoke@fix/resource-timer-follows-status · claude-code
stack skill loaded but its CLI is absent: 'stack not found' on PATH and no install hint in the skill doc
**Worked instead:** fell back to gh pr merge with a local squash dry-run first

## 2026-08-28 14:05 +0000 · setup · claude-opus-5 · einargudjonsson · claude-code
ollama CLI printed 'Warning: client version is 0.32.15' vs server 0.33.1 — stale background server after brew upgrade, commands still worked but version-skewed
**Worked instead:** restart the ollama server: brew services restart ollama (or kill the app and relaunch)

## 2026-08-29 11:47 +0000 · tool · claude-opus-5 · pdl@wheat-8 · claude-code
cd node_modules/alchemy in Bash tool failed: zoxide shim intercepted cd and said 'no match found'
**Worked instead:** use absolute paths in rg/sed instead of cd, or 'builtin cd'

## 2026-08-29 12:05 +0000 · tool · claude-opus-5 · pdl@wheat-8 · claude-code
alchemy@2.0.0-beta.74 'alchemy dev' fails: workerd cannot upgrade WS to ws://127.0.0.1:PORT/__vite_module_runner/init ('Expected 101 status code'), Vite child exits 1. Reproduces with a bare react()-only vite config, on vite 8.1.5 and 8.2.2, under both bun and node.
**Worked instead:** alchemy plan/deploy and vite build all work; only 'alchemy dev' is affected. Fall back to plain 'vite' for UI work.

## 2026-08-29 12:15 +0000 · tool · claude-opus-5 · pdl@wheat-8 · claude-code
ls in Bash tool is aliased to an icon-prefixed lister; $(ls dist/assets/*.css) returns a filename with a nerd-font glyph so rg reports 'No such file'
**Worked instead:** use fd instead: CSS=$(fd -e css . dist/assets)

## 2026-08-31 15:14 +0000 · tool · claude-opus-5 · maul-backend@chore/migrate-eslint-to-oxlint · claude-code
cp inside a bash script silently no-op'd with 'overwrite? (y/n [n]) not overwritten' — cp is aliased to 'cp -i' in the profile, so a scripted restore-from-backup loop left the file mutated across iterations
**Worked instead:** use 'command cp' / 'cp -f', or restore with 'git checkout -- <file>' instead of a backup copy

## 2026-08-31 15:22 +0000 · tool · claude-opus-5 · maul-backend@chore/migrate-eslint-to-oxlint · claude-code
oxlint prints its 'Found N warnings/errors' summary inconsistently when stdout is piped — same command gave output via '| head -20' but nothing via '| tail -20' or '> file' in adjacent runs; exit code was the only reliable signal
**Worked instead:** redirect to a file and cat it, or trust the exit code, rather than piping oxlint into head/tail

## 2026-08-31 15:44 +0000 · tool · claude-opus-5 · einargudjonsson · claude-code
ran fnm node-version's own npm binary directly to uninstall a global pkg; npm still resolved prefix -g to the ACTIVE fnm multishell version (v24.3.0), so uninstall was a silent 'up to date' no-op instead of removing from that version's tree
**Worked instead:** pass --prefix explicitly: npm uninstall -g --prefix ~/.local/share/fnm/node-versions/vX/installation <pkg>

## 2026-09-01 12:20 +0000 · setup · claude-opus-5 · maul-admin@fix/agent-skill-links · claude-code
CI check-skill-symlinks.mjs says 'Commit the skill's content under .agents/' but .agents/ is listed in .git/info/exclude, so git add refuses and the instruction is unfollowable as written
**Worked instead:** git check-ignore -v <path> located the rule in .git/info/exclude (not .gitignore); had to decide between un-excluding .agents or dropping the dangling .claude/skills link

## 2026-09-01 13:10 +0000 · tool · claude-opus-5 · dotfiles@master · unknown
bash: `ls /Users/einargudjonsson/.local/pi/lib/node_modules/@earendil-works/pi-coding-agent/examples/extens` failed — (no output)  Command exited with code 1

## 2026-09-01 13:26 +0000 · flaky · claude-opus-5 · maul-backend@main · claude-code
maul-admin: src/routes/_index.test.tsx failed once on 'scheduled to order today' getByText('2') then passed on the next two identical runs — flaky, unrelated to the diff

## 2026-09-02 10:20 +0000 · setup · claude-fable-5-1 · maul-admin@main · claude-code
.git/info/exclude ignores .agents/ and .claude/skills/ locally, so a new repo skill never shows in git status; check:skills also passes vacuously in CI because nothing under .agents is tracked
**Worked instead:** git add -f the skill dir + both symlinks

## 2026-09-02 10:26 +0000 · tool · claude-fable-5-1 · maul-admin@main · claude-code
oxfmt/oxlint silently skip files under .agents/ because .git/info/exclude lists it; 'Finished on 1 files' with no per-file list hides that
**Worked instead:** format a copy in scratchpad and copy back; oxlint has --no-ignore, oxfmt doesn't

## 2026-09-02 12:59 +0000 · tool · claude-opus-5 · maul-admin@main · unknown
bash: `cd /Users/einargudjonsson/work/maul-admin && npm run check:skills && npm run verify:help` failed —  > maul-admin@0.1.0 check:skills > node scripts/check-skill-symlinks.mjs  Agent-skill layout problems (1):    - .agents/skills/install-anti-slop is not linked into .claude/skills.     Run: ln -s ../..

## 2026-09-02 15:01 +0000 · tool · claude-opus-5 · dotfiles@master · unknown
bash: `ls /Users/einargudjonsson/.local/pi/lib/node_modules/@earendil-works/pi-coding-agent/examples/extens` failed — /Users/einargudjonsson/.local/pi/lib/node_modules/@earendil-works/pi-coding-agent/examples/extensions/bookmark.ts /Users/einargudjonsson/.local/pi/lib/node_modules/@earendil-works/pi-coding-agent/exam
