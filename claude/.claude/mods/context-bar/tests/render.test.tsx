import type { ContextCategory, RenderElement, SessionContextBreakdown, SessionUsage } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const row = (name: string, tokens: number, kind: ContextCategory['kind'] = 'used'): ContextCategory => ({
  name,
  tokens,
  kind,
  color: 'inactive',
  isDeferred: kind === 'deferred',
})

const BREAKDOWN = {
  categories: [
    row('System prompt', 4200),
    row('MCP tools', 52_000),
    row('Messages', 0),
    row('Free space', 897_000, 'free'),
    row('Autocompact buffer', 13_000, 'buffer'),
  ],
  totalTokens: 90_000,
  maxTokens: 1_000_000,
  rawMaxTokens: 1_000_000,
  autocompactSource: 'auto',
  percentage: 9,
  gridRows: [],
  model: 'claude-opus-5-5',
  memoryFiles: [],
  mcpTools: [],
  agents: [],
  autoCompactThreshold: 987_000,
  isAutoCompactEnabled: true,
  apiUsage: null,
} satisfies SessionContextBreakdown

const usage = (breakdown?: SessionContextBreakdown): SessionUsage => ({
  startedAt: 0,
  context: { window: 1_000_000, breakdown },
  rateLimits: [],
})

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 19 },
    view: {},
  },
} as const

test('draws header, bar and legend on every surface', async ($, on) => {
  on('session.usage', () => ({ value: usage(BREAKDOWN) }))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'context-bar', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /9%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /compacts at 987k/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^52k$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^4\.2k$/ })).toBeDefined()
    await ui.unmount()
  }
})

test('draws nothing before the first measurement', async ($, on) => {
  on('session.usage', () => ({ value: usage() }))
  on('ui.render', () => ({ type: 'Box', props: {} }) as RenderElement)
  const ui = await $.ui.mount({ plugin: 'context-bar', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /context/ })).toBeUndefined()
  await ui.unmount()
})

test('yields the band to a survey', async ($, on) => {
  on('session.usage', () => ({ value: usage(BREAKDOWN) }))
  on('ui.render', () => ({ type: 'Box', props: {} }) as RenderElement)
  const ui = await $.ui.mount({
    plugin: 'context-bar',
    surface: 'terminal',
    ...BAND,
    props: { ...BAND.props, hasSurvey: true },
  })
  expect(await ui.find({ type: 'Text', text: /context/ })).toBeUndefined()
  await ui.unmount()
})

test('collapses to one line and expands again', async ($, on) => {
  on('session.usage', () => ({ value: usage(BREAKDOWN) }))
  mock.store(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'context-bar', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /^52k$/ })).toBeDefined()

    await ui.press({ key: 'toggle' })
    expect(await ui.find({ type: 'Text', text: /^52k$/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /9%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^90k$/ })).toBeDefined()

    await ui.press({ key: 'toggle' })
    expect(await ui.find({ type: 'Text', text: /^52k$/ })).toBeDefined()
    await ui.unmount()
  }
})
