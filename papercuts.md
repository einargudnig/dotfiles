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
