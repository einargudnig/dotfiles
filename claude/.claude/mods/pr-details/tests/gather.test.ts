import { expect, test } from 'claude-code/testing'

import { checkState, gather, parseCommits, parsePr, parseTree } from '../hooks/gather'
import type { Run } from '../hooks/gather'
import { PR_JSON } from './fixtures'

test('parseTree counts staged, modified and untracked', async () => {
  expect(parseTree(' M a.ts\nM  b.ts\nMM c.ts\n?? d.ts\n')).toEqual({ staged: 2, modified: 2, untracked: 1 })
})

test('parseCommits splits tab-separated log lines', async () => {
  expect(parseCommits('abc1234\tfix thing\t2 hours ago')).toEqual([
    { sha: 'abc1234', subject: 'fix thing', ago: '2 hours ago' },
  ])
})

test('checkState reads check runs and status contexts', async () => {
  expect(checkState({ status: 'COMPLETED', conclusion: 'SUCCESS' })).toBe('pass')
  expect(checkState({ status: 'COMPLETED', conclusion: 'FAILURE' })).toBe('fail')
  expect(checkState({ status: 'IN_PROGRESS', conclusion: '' })).toBe('pending')
  expect(checkState({ state: 'ERROR' })).toBe('fail')
})

test('parsePr maps gh json', async () => {
  const pr = parsePr(PR_JSON)
  expect(pr.state).toBe('open')
  expect(pr.decision).toBe('changes')
  expect(pr.checks).toEqual([
    { name: 'lint', state: 'fail' },
    { name: 'test', state: 'pass' },
  ])
  expect(pr.reviews).toEqual([
    { login: 'anna', state: 'changes' },
    { login: 'bjorn', state: 'requested' },
  ])
  expect(pr.comments).toBe(2)
})

const fakeRun =
  (answers: Record<string, { ok?: boolean; out?: string; err?: string }>): Run =>
  async argv => {
    const key = Object.keys(answers).find(k => argv.join(' ').startsWith(k))
    const a = key ? answers[key]! : { ok: false, err: 'unexpected' }
    return { ok: a.ok ?? true, out: a.out ?? '', err: a.err ?? '' }
  }

test('gather reports no PR when gh finds none', async () => {
  const info = await gather(
    fakeRun({
      'git rev-parse --abbrev-ref HEAD': { out: 'feature/x' },
      'git rev-parse --abbrev-ref --symbolic-full-name': { ok: false },
      'git status': { out: '?? new.ts' },
      'gh pr view': { ok: false, err: 'no pull requests found for branch "feature/x"' },
      'git symbolic-ref': { out: 'origin/master' },
      'git log': { out: 'abc1234\tstart\t1 hour ago' },
    }),
    0,
  )
  if (info.kind !== 'repo') throw new Error('expected repo')
  expect(info.pr).toBeNull()
  expect(info.prError).toBeUndefined()
  expect(info.branch.base).toBe('master')
  expect(info.branch.tree.untracked).toBe(1)
  expect(info.branch.commits).toHaveLength(1)
})

test('gather reports no-repo outside git', async () => {
  expect(await gather(fakeRun({}), 0)).toEqual({ kind: 'no-repo' })
})
