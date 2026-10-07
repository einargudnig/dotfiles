import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Slice, Snapshot } from '../types'

const snapshot = atom({ plugin: 'context-bar', key: 'snapshot' } as const, null)
const isHidden = atom({ plugin: 'context-bar', key: 'isHidden' } as const, false)
const isCollapsed = atom({ plugin: 'context-bar', key: 'isCollapsed' } as const, false)
const COLLAPSED_KEY = 'isCollapsed'

const FREE = '#3b3f51'

const PALETTE: Record<string, string> = {
  'system prompt': '#7aa2f7',
  'system tools': '#7dcfff',
  tools: '#7dcfff',
  'mcp tools': '#9d7cf5',
  'custom agents': '#9ece6a',
  agents: '#9ece6a',
  'memory files': '#e0af68',
  skills: '#f7a8c4',
  messages: '#e07a5f',
  'free space': FREE,
}
const MARKER = '#e0af68'
const MUTED = '#6b7089'

const label = (name: string) =>
  name.toLowerCase().replace(/^system tools$/, 'tools').replace(/^custom agents$/, 'agents').replace(/^free space$/, 'free')

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`
  return `${n}`
}

// TODO(einar): pick the badge colour for how full the window is.
// `percent` is 0–100 (can exceed 100). Return a hex or theme colour.
const badgeColor = (percent: number): string => '#9ece6a'

const measure = async ($: EngineInterface): Promise<Snapshot | null> => {
  const { context } = await $.session.usage({ breakdown: 'summary' })
  const b = context.breakdown
  if (!b) return null

  const slices: Slice[] = b.categories
    .filter(c => c.kind !== 'deferred' && c.kind !== 'buffer')
    .map(c => ({
      name: label(c.name),
      tokens: c.tokens,
      color: PALETTE[c.name.toLowerCase()] ?? c.color,
      kind: c.kind as Slice['kind'],
    }))

  return {
    total: b.totalTokens,
    max: b.rawMaxTokens,
    percent: b.percentage,
    compactAt: b.isAutoCompactEnabled ? b.autoCompactThreshold : undefined,
    slices,
  }
}

const refresh = async ($: EngineInterface) => {
  const snap = await measure($)
  if (snap) await update($, snapshot, () => snap)
}

const cells = (snap: Snapshot, width: number) => {
  const used = snap.slices.filter(s => s.kind === 'used' && s.tokens > 0)
  const out: { color: string; char: string }[] = []
  for (const s of used) {
    const n = Math.max(1, Math.round((s.tokens / snap.max) * width))
    for (let i = 0; i < n && out.length < width; i++) out.push({ color: s.color, char: '█' })
  }
  while (out.length < width) out.push({ color: FREE, char: '█' })

  if (snap.compactAt) {
    const at = Math.min(width - 1, Math.round((snap.compactAt / snap.max) * width))
    out[at] = { color: MARKER, char: '▐' }
  }
  return out
}

const runs = (bar: { color: string; char: string }[]) =>
  bar.reduce<{ color: string; text: string }[]>((acc, c) => {
    const last = acc[acc.length - 1]
    if (last && last.color === c.color) last.text += c.char
    else acc.push({ color: c.color, text: c.char })
    return acc
  }, [])

const toggleCollapsed = async ($: EngineInterface) => {
  await update($, isCollapsed, collapsed => !collapsed)
  await $.store.set(COLLAPSED_KEY, await read($, isCollapsed))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'ctx', description: 'Toggle the context bar above the prompt' })
    const result = await next(e)
    const collapsed = (await $.store.get(COLLAPSED_KEY)) === true
    await update($, isCollapsed, () => collapsed)
    void refresh($).catch(() => {})
    return result
  })

  on('command.run', { command: 'ctx' }, async $ => {
    await refresh($)
    await update($, isHidden, hidden => !hidden)
    return { text: (await read($, isHidden)) ? 'Context bar hidden.' : 'Context bar shown.' }
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    void refresh($).catch(() => {})
    return result
  })

  on('session.compact', ($, e, next) => {
    const ran = next(e)
    void ran.then(() => refresh($)).catch(() => {})
    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.view.agentId || (await read($, isHidden))) return next(e)

    const snap = (await read($, snapshot)) ?? (await measure($))
    if (!snap) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const width = Math.max(10, e.props.bodyColumns - 2)
    const badge = (
      <Text backgroundColor={badgeColor(snap.percent)} color="#1a1b26" bold>
        {` ${snap.percent}% `}
      </Text>
    )
    const drawBar = (cols: number) => (
      <Text>
        {runs(cells(snap, cols)).map(r => (
          <Text color={r.color}>{r.text}</Text>
        ))}
      </Text>
    )

    if (await read($, isCollapsed)) {
      const label = ` ◆ ${fmt(snap.total)}/${fmt(snap.max)} `
      const barWidth = Math.max(10, width - label.length - `${snap.percent}`.length - 8)
      return (
        <Box width={width}>
          <Button key="toggle" label="▸" plain dimColor onPress={() => toggleCollapsed($)} />
          <Text>
            <Text color="#e07a5f"> ◆ </Text>
            <Text bold>{fmt(snap.total)}</Text>
            <Text color={MUTED}>/{fmt(snap.max)} </Text>
          </Text>
          {drawBar(barWidth)}
          <Text> </Text>
          {badge}
        </Box>
      )
    }

    const legend = snap.slices.filter(s => s.kind === 'used' || s.kind === 'free')
    const colWidth = Math.floor(width / (width >= 120 ? 4 : width >= 80 ? 3 : 2))

    return (
      <Box flexDirection="column" width={width}>
        <Box justifyContent="space-between">
          <Box>
            <Button key="toggle" label="▾" plain dimColor onPress={() => toggleCollapsed($)} />
            <Text>
              <Text color="#e07a5f"> ◆ </Text>
              <Text bold>context  </Text>
              <Text bold>{fmt(snap.total)}</Text>
              <Text color={MUTED}> of {fmt(snap.max)}</Text>
              {snap.compactAt && <Text color={MUTED}> · compacts at {fmt(snap.compactAt)}</Text>}
            </Text>
          </Box>
          {badge}
        </Box>
        {drawBar(width)}
        <Box flexWrap="wrap">
          {legend.map(s => (
            <Box width={colWidth}>
              <Text wrap="truncate">
                <Text color={s.color}>■ </Text>
                <Text color={MUTED}>{s.name} </Text>
                <Text bold>{fmt(s.tokens)}</Text>
                <Text color={MUTED}> {Math.round((s.tokens / snap.max) * 100)}%</Text>
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
