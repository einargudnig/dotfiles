import type { ToolInfo } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { EMPTY_WEEK, W41 } from './fixtures'

const SERVER = 'mcp__abc123'

const PANE = {
  component: 'Pane',
  requestId: 'maul-order',
  props: {
    title: 'Maul',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 60 },
    view: {},
  },
} as const

const tools: ToolInfo[] = ['getUserByEmail', 'listUserOrders'].map(
  name => ({ name: `${SERVER}__${name}`, description: '', mcp: true }) as ToolInfo,
)

const OPTIONS = { options: { email: 'me@example.com' } }

test("shows today's meal like the order page and steps through the week", OPTIONS, async ($, on) => {
  mock.clock(on, { now: Date.parse('2026-10-07T09:00:00Z') })
  mock.store(on)
  on('tool.list', () => ({ value: tools }))
  const calls: string[] = []
  on('tool.call', (_$, e) => {
    calls.push(String(e.tool))
    if (String(e.tool).endsWith('__getUserByEmail')) return { result: {}, text: JSON.stringify({ UserId: 'u1' }) } as never
    const week = (e as unknown as { isoWeek: string }).isoWeek
    return { result: {}, text: week === '2026-W41' ? W41 : EMPTY_WEEK } as never
  })

  const ui = await $.ui.mount({ plugin: 'maul-order', surface: 'terminal', ...PANE })
  await ui.press({ key: 'refresh' })

  expect(await ui.find({ type: 'Text', text: 'MIÐVIKUDAGUR 7. OKTÓBER' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Nautahakksbaka' })).toBeDefined()
  expect(await ui.find({ type: 'Link' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: / Glúten / })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Umsögn vantar/ })).toBeDefined()
  expect(calls.filter(c => c.endsWith('__getUserByEmail'))).toHaveLength(1)

  await ui.press({ key: 'next' })
  expect(await ui.find({ type: 'Text', text: 'FÖSTUDAGUR 9. OKTÓBER' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Pistasíulanga' })).toBeDefined()

  await ui.press({ key: 'prev' })
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /Umsögn gefin/ })).toBeDefined()
  await ui.unmount()
})

test('says so when the Maul connector is missing', OPTIONS, async ($, on) => {
  mock.clock(on, { now: Date.parse('2026-10-07T09:00:00Z') })
  mock.store(on)
  on('tool.list', () => ({ value: [] as ToolInfo[] }))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'maul-order', surface, ...PANE })
    await ui.press({ key: 'refresh' })
    expect(await ui.find({ type: 'Text', text: /ekki tengdur/ })).toBeDefined()
    await ui.unmount()
  }
})

test('asks for an email when none is configured', async ($, on) => {
  mock.clock(on, { now: Date.parse('2026-10-07T09:00:00Z') })
  const ui = await $.ui.mount({ plugin: 'maul-order', surface: 'terminal', ...PANE })
  await ui.press({ key: 'refresh' })
  expect(await ui.find({ type: 'Text', text: /\/config/ })).toBeDefined()
  await ui.unmount()
})
