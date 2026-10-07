import type { AgentInfo } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  component: 'Pane',
  requestId: 'agent-panel',
  props: {
    title: 'Agents',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const FILES: Record<string, Record<string, string>> = {
  '.claude/agents': {
    'code-reviewer.md': '---\nname: code-reviewer\ndescription: Reviews the current diff.\nmodel: sonnet\ncolor: blue\n---\n',
  },
  '/home/me/.claude/agents': {
    'concierge.md': '---\nname: concierge\ndescription: "Searches the vault.\\n\\nExamples: x"\nmodel: haiku\n---\n',
  },
}

const dirFor = (path: string) =>
  FILES[path] ?? (path.endsWith('/.claude/agents') && !path.startsWith('/home/me') ? FILES['.claude/agents'] : undefined)

const dirOf = (path: string) => path.slice(0, path.lastIndexOf('/'))
const baseOf = (path: string) => path.slice(path.lastIndexOf('/') + 1)

test('lists project and user agents and drafts a run prompt', async ($, on) => {
  mock.env(on, { HOME: '/home/me' })
  on('fs.exists', (_$, e) => ({ value: dirFor(e.path) !== undefined }))
  on('fs.list', (_$, e) => ({
    value: Object.keys(dirFor(e.path ?? '') ?? {}).map(name => ({ name, kind: 'file' as const, size: 1, mtimeMs: 0, isLink: false })),
  }))
  on('fs.read', (_$, e) => ({ value: dirFor(dirOf(e.path))?.[baseOf(e.path)] ?? '' }))
  on('agent.list', () => ({ value: [] as AgentInfo[] }))
  let drafted = ''
  on('prompt.fill', (_$, e) => {
    drafted = e.text
    return { isFilled: true }
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'agent-panel', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /2 defined/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^PROJECT$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^USER$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Searches the vault\.$/ })).toBeDefined()
    await ui.press({ key: 'run:project:code-reviewer' })
    expect(drafted).toBe('Use the code-reviewer agent to ')
    await ui.unmount()
  }
})
