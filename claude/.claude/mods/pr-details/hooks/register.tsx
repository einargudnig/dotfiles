import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import type { Branch, Check, Pr, Review } from '../types'
import { gather } from './gather'
import type { Run } from './gather'

const PANE = 'pr-details'
const info = atom({ plugin: 'pr-details', key: 'info' } as const, null)
const isLoading = atom({ plugin: 'pr-details', key: 'isLoading' } as const, false)
const isOpen = atom({ plugin: 'pr-details', key: 'isOpen' } as const, false)

const MUTED = '#6b7089'
const GREEN = '#9ece6a'
const RED = '#f7768e'
const AMBER = '#e0af68'
const BLUE = '#7aa2f7'
const PURPLE = '#bb9af7'

const PR_STATE: Record<Pr['state'], { label: string; color: string }> = {
  open: { label: 'Open', color: GREEN },
  draft: { label: 'Draft', color: MUTED },
  merged: { label: 'Merged', color: PURPLE },
  closed: { label: 'Closed', color: RED },
}

const DECISION: Record<NonNullable<Pr['decision']>, { label: string; color: string }> = {
  approved: { label: '✓ Approved', color: GREEN },
  changes: { label: '✗ Changes requested', color: RED },
  required: { label: '◌ Review required', color: AMBER },
}

const REVIEW: Record<Review['state'], { mark: string; color: string }> = {
  approved: { mark: '✓', color: GREEN },
  changes: { mark: '✗', color: RED },
  commented: { mark: '💬', color: MUTED },
  requested: { mark: '◌', color: AMBER },
}

const CHECK: Record<Check['state'], { mark: string; color: string }> = {
  pass: { mark: '✓', color: GREEN },
  fail: { mark: '✗', color: RED },
  pending: { mark: '◌', color: AMBER },
}

const runner =
  ($: EngineInterface): Run =>
  async argv => {
    const { exitCode, stdout, stderr } = await $.process.run(argv, { timeoutMs: 15_000 })
    return { ok: exitCode === 0, out: stdout.trimEnd(), err: stderr.trim() }
  }

const refresh = async ($: EngineInterface) => {
  await update($, isLoading, () => true)
  try {
    const next = await gather(runner($), await $.clock.now())
    await update($, info, () => next)
  } finally {
    await update($, isLoading, () => false)
  }
}

const open = async ($: EngineInterface) => {
  await $.ui.open({ id: PANE, title: 'PR' })
  await update($, isOpen, () => true)
  void refresh($).catch(err => $.ui.toast(`pr-details: ${String(err)}`))
}

const count = (checks: Check[], state: Check['state']) => checks.filter(c => c.state === state).length

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'pr', description: 'Toggle the branch and PR details pane' })
    return next(e)
  })

  on('command.run', { command: 'pr' }, async $ => {
    if (await read($, isOpen)) {
      await $.ui.close({ id: PANE })
      return { text: 'PR details hidden.' }
    }
    await open($)
    return { text: 'PR details opened.' }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    await update($, isOpen, () => false)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (await read($, isOpen)) void refresh($).catch(() => {})
    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Link, Text } = $.ui.resolve(e)
    const data = await read($, info)
    const loading = await read($, isLoading)

    const section = (title: string, ...body: RenderNode[]) => (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color={MUTED}>
          {title.toUpperCase()}
        </Text>
        {body}
      </Box>
    )

    const footer = (
      <Box marginTop={1}>
        <Button key="refresh" label={loading ? 'Refreshing…' : 'Refresh'} hotkey="r" onPress={() => refresh($)} />
      </Box>
    )

    if (!data) {
      return (
        <Box flexDirection="column">
          <Text dimColor>Loading branch and PR…</Text>
          {footer}
        </Box>
      )
    }
    if (data.kind === 'no-repo') return <Text dimColor>Not inside a git repository.</Text>

    const { branch, pr, prError } = data

    const branchView = (b: Branch) => (
      <Box flexDirection="column">
        <Text wrap="truncate">
          <Text color={BLUE}>⎇ </Text>
          <Text bold>{b.name}</Text>
        </Text>
        <Text wrap="truncate" color={MUTED}>
          {b.upstream ? `→ ${b.upstream}` : 'no upstream'}
          {b.ahead > 0 && <Text color={GREEN}> ↑{b.ahead}</Text>}
          {b.behind > 0 && <Text color={AMBER}> ↓{b.behind}</Text>}
        </Text>
        <Text color={MUTED}>
          base {b.base} · {b.commits.length}
          {b.commits.length === 10 ? '+' : ''} commit{b.commits.length === 1 ? '' : 's'} ahead
        </Text>
        <Text>
          <Text color={GREEN}>● {b.tree.staged} staged </Text>
          <Text color={AMBER}> ✚ {b.tree.modified} modified </Text>
          <Text color={MUTED}> ? {b.tree.untracked} untracked</Text>
        </Text>
      </Box>
    )

    const prView = (p: Pr) => {
      const state = PR_STATE[p.state]
      const failing = p.checks.filter(c => c.state === 'fail')
      return (
        <Box flexDirection="column">
          <Text>
            <Text bold>#{p.number} </Text>
            <Text backgroundColor={state.color} color="#1a1b26" bold>
              {` ${state.label} `}
            </Text>
          </Text>
          <Link href={p.url}>{p.title}</Link>
          <Text color={MUTED}>
            @{p.author} → {p.base} · <Text color={GREEN}>+{p.additions}</Text> <Text color={RED}>−{p.deletions}</Text> ·{' '}
            {p.changedFiles} files · {p.comments} comments
          </Text>
          {p.decision && <Text color={DECISION[p.decision].color}>{DECISION[p.decision].label}</Text>}
          {p.mergeable === 'CONFLICTING' && <Text color={RED}>⚠ Merge conflicts</Text>}

          {p.checks.length > 0 &&
            section(
              'Checks',
              <Text>
                <Text color={GREEN}>✓ {count(p.checks, 'pass')} </Text>
                <Text color={RED}> ✗ {count(p.checks, 'fail')} </Text>
                <Text color={AMBER}> ◌ {count(p.checks, 'pending')}</Text>
              </Text>,
              ...failing.map(c => (
                <Text wrap="truncate" color={CHECK[c.state].color}>
                  {CHECK[c.state].mark} {c.name}
                </Text>
              )),
            )}

          {p.reviews.length > 0 &&
            section(
              'Reviewers',
              ...p.reviews.map(r => (
                <Text wrap="truncate">
                  <Text color={REVIEW[r.state].color}>{REVIEW[r.state].mark} </Text>@{r.login}
                  <Text color={MUTED}> {r.state}</Text>
                </Text>
              )),
            )}

          {p.labels.length > 0 && <Text color={MUTED}>labels: {p.labels.join(', ')}</Text>}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {branchView(branch)}
        {section(
          'Pull request',
          pr ? (
            prView(pr)
          ) : prError ? (
            <Text color={RED} wrap="truncate">
              {prError}
            </Text>
          ) : (
            <Text dimColor>No PR for {branch.name}.</Text>
          ),
        )}
        {branch.commits.length > 0 &&
          section(
            'Commits',
            ...branch.commits.map(c => (
              <Text wrap="truncate">
                <Text color={AMBER}>{c.sha} </Text>
                {c.subject}
                <Text color={MUTED}> {c.ago}</Text>
              </Text>
            )),
          )}
        {footer}
      </Box>
    )
  })
}
