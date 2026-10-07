import type { ProcessRunResult } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { PR_JSON } from './fixtures'

const PANE = {
  component: 'Pane',
  requestId: 'pr-details',
  props: {
    title: 'PR',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const ok = (stdout: string, exitCode = 0, stderr = ''): { value: ProcessRunResult } => ({
  value: { exitCode, stdout, stderr } as ProcessRunResult,
})

test('refresh draws branch, PR, failing check and reviewers', async ($, on) => {
  mock.clock(on)
  on('process.run', (_$, e) => {
    const cmd = e.argv.join(' ')
    if (cmd.startsWith('git rev-parse --abbrev-ref HEAD')) return ok('feature/ctx\n')
    if (cmd.startsWith('git rev-parse --abbrev-ref --symbolic-full-name')) return ok('origin/feature/ctx\n')
    if (cmd.startsWith('git rev-list')) return ok('0\t2\n')
    if (cmd.startsWith('git status')) return ok(' M a.ts\n')
    if (cmd.startsWith('gh pr view')) return ok(PR_JSON)
    if (cmd.startsWith('git log')) return ok('abc1234\tAdd bar\t1 hour ago\n')
    return ok('', 1)
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'pr-details', surface, ...PANE })
    await ui.press({ key: 'refresh' })
    expect(await ui.find({ type: 'Text', text: /feature\/ctx/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /↑2/ })).toBeDefined()
    expect(await ui.find({ type: 'Link' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Changes requested/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /lint/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /bjorn/ })).toBeDefined()
    await ui.unmount()
  }
})
