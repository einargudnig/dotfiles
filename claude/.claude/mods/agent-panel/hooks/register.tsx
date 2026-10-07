import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import type { AgentDef, AgentGroup } from '../types'
import { parseAgent } from './agents'

const PANE = 'agent-panel'
const groups = atom({ plugin: 'agent-panel', key: 'groups' } as const, null)
const running = atom({ plugin: 'agent-panel', key: 'running' } as const, {})
const isOpen = atom({ plugin: 'agent-panel', key: 'isOpen' } as const, false)

const MUTED = '#6b7089'
const ACCENT = '#e07a5f'
const SCOPE_COLOR: Record<AgentGroup['scope'], string> = { project: '#7aa2f7', user: '#bb9af7' }

const NAMED: Record<string, string> = {
  blue: '#7aa2f7',
  cyan: '#7dcfff',
  green: '#9ece6a',
  yellow: '#e0af68',
  orange: '#ff9e64',
  red: '#f7768e',
  purple: '#bb9af7',
  pink: '#f7a8c4',
}
const CYCLE = Object.values(NAMED)

const dotColor = (agent: AgentDef, index: number) => {
  if (agent.color?.startsWith('#')) return agent.color
  return NAMED[agent.color?.toLowerCase() ?? ''] ?? CYCLE[index % CYCLE.length]!
}

const RUNNING = new Set(['pending', 'running', 'waiting'])

const loadGroup = async (
  $: EngineInterface,
  scope: AgentGroup['scope'],
  dir: string,
  label: string,
): Promise<AgentGroup | null> => {
  if (!(await $.fs.exists(dir))) return null
  const entries = await $.fs.list(dir)
  const files = entries.filter(f => f.name.endsWith('.md') && f.kind !== 'dir')
  const agents = await Promise.all(files.map(async f => parseAgent(f.name, await $.fs.read(`${dir}/${f.name}`))))
  agents.sort((a, b) => a.name.localeCompare(b.name))
  return agents.length ? { scope, path: label, agents } : null
}

const loadAll = async ($: EngineInterface) => {
  const home = await $.env.get('HOME')
  const found = await Promise.all([
    loadGroup($, 'project', '.claude/agents', '.claude/agents'),
    home ? loadGroup($, 'user', `${home}/.claude/agents`, '~/.claude/agents') : null,
  ])
  return found.filter((g): g is AgentGroup => g !== null)
}

const refreshGroups = async ($: EngineInterface) => {
  const found = await loadAll($)
  await update($, groups, () => found)
}

const refreshRunning = async ($: EngineInterface) => {
  const live = (await $.agent.list()).filter(a => RUNNING.has(a.status))
  const counts: Record<string, number> = {}
  for (const a of live) counts[a.type] = (counts[a.type] ?? 0) + 1
  await update($, running, () => counts)
}

const runAgent = async ($: EngineInterface, name: string) => {
  await $.prompt.fill({ text: `Use the ${name} agent to ` })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'agent-panel', description: 'Toggle the agents sidebar' })
    return next(e)
  })

  on('command.run', { command: 'agent-panel' }, async $ => {
    if (await read($, isOpen)) {
      await $.ui.close({ id: PANE })
      return { text: 'Agents panel hidden.' }
    }
    await $.ui.open({ id: PANE, title: 'Agents' })
    await update($, isOpen, () => true)
    void Promise.all([refreshGroups($), refreshRunning($)]).catch(err => $.ui.toast(`agent-panel: ${String(err)}`))
    return { text: 'Agents panel opened.' }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    await update($, isOpen, () => false)
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    void refreshRunning($).catch(() => {})
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    void Promise.all([refreshGroups($), refreshRunning($)]).catch(() => {})
    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const list = (await read($, groups)) ?? (await loadAll($))
    const live = await read($, running)

    const total = list.reduce((n, g) => n + g.agents.length, 0)
    const width = e.props.bodyColumns
    const where = list.some(g => g.scope === 'project') ? 'in this project' : 'for you'

    const header = (
      <Box justifyContent="space-between" width={width}>
        <Text>
          <Text color={ACCENT}>◆ </Text>
          <Text bold>Agents </Text>
          <Text color={MUTED}> {where}</Text>
        </Text>
        <Text color={MUTED}>{total} defined</Text>
      </Box>
    )

    const groupHeader = (g: AgentGroup) => {
      const label = `${g.scope.toUpperCase()}  ${g.path} · ${g.agents.length} `
      return (
        <Text wrap="truncate">
          <Text bold color={SCOPE_COLOR[g.scope]}>
            {g.scope.toUpperCase()}
          </Text>
          <Text color={MUTED}>
            {'  '}
            {g.path} · {g.agents.length} {'─'.repeat(Math.max(0, width - label.length))}
          </Text>
        </Text>
      )
    }

    const row = (g: AgentGroup, a: AgentDef, i: number): RenderNode => {
      const count = live[a.name] ?? 0
      return (
        <Box key={`${g.scope}:${a.name}`} flexDirection="column" marginTop={1}>
          <Box justifyContent="space-between" width={width}>
            <Text wrap="truncate">
              <Text color={dotColor(a, i)}>● </Text>
              <Text bold>{a.name} </Text>
              <Text color={MUTED}> {a.model}</Text>
              {count > 0 && <Text color="#e0af68"> ◌ {count > 1 ? `${count} running` : 'running'}</Text>}
            </Text>
            <Button key={`run:${g.scope}:${a.name}`} label="▶ run" dimColor onPress={() => runAgent($, a.name)} />
          </Box>
          {a.description && (
            <Text wrap="truncate-end" color={MUTED}>
              {'  '}
              {a.description}
            </Text>
          )}
        </Box>
      )
    }

    if (list.length === 0) {
      return (
        <Box flexDirection="column">
          {header}
          <Text dimColor>No agents in .claude/agents or ~/.claude/agents.</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {header}
        {list.map(g => (
          <Box flexDirection="column" marginTop={1}>
            {groupHeader(g)}
            {g.agents.map((a, i) => row(g, a, i))}
          </Box>
        ))}
      </Box>
    )
  })
}
