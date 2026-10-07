import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import type { Lang, Meal, Orders } from '../types'
import { ALLERGENS, isoDate, longDate, parseOrders, pickDefault, shortDate, sortMeals, weeksToFetch } from './maul'

const PANE = 'maul-order'
const STALE_MS = 15 * 60_000

const orders = atom({ plugin: 'maul-order', key: 'orders' } as const, null)
const selected = atom({ plugin: 'maul-order', key: 'selected' } as const, null)
const isOpen = atom({ plugin: 'maul-order', key: 'isOpen' } as const, false)
const isLoading = atom({ plugin: 'maul-order', key: 'isLoading' } as const, false)

const GREEN = '#8fbf7f'
const BORDER = '#6b8a5f'
const LINK = '#7aa2f7'
const MUTED = '#6b7089'
const AMBER = '#e0af68'
const RED = '#f7768e'

const LABELS = {
  is: {
    title: 'Maul',
    loading: 'Sæki pantanir…',
    none: 'Engar pantanir þessa viku eða næstu.',
    lunch: 'Hádegismatur',
    dinner: 'Kvöldmatur',
    pickup: 'Afhendingarstaður:',
    reviewed: '✓ Umsögn gefin',
    review: 'Umsögn vantar',
    week: 'Vikan',
    refresh: 'Uppfæra',
    noConnector: 'Maul tengillinn er ekki tengdur í þessari lotu.',
    noEmail: 'Settu Maul netfangið þitt í /config (maul-order → Maul email).',
  },
  en: {
    title: 'Maul',
    loading: 'Fetching orders…',
    none: 'No orders this week or next.',
    lunch: 'Lunch',
    dinner: 'Dinner',
    pickup: 'Pickup:',
    reviewed: '✓ Reviewed',
    review: 'Review pending',
    week: 'This week',
    refresh: 'Refresh',
    noConnector: 'The Maul connector is not connected in this session.',
    noEmail: 'Set your Maul email in /config (maul-order → Maul email).',
  },
} as const

type McpTool = `mcp__${string}__${string}`

const findTool = async ($: EngineInterface, suffix: string) =>
  (await $.tool.list()).find(t => t.mcp && t.name.endsWith(`__${suffix}`))?.name as McpTool | undefined

const callJson = async ($: EngineInterface, tool: McpTool, args: Record<string, unknown>) => {
  const res = await $.tool.call({ tool, ...args })
  if (res.deny) throw new Error(res.deny)
  if (res.isError) throw new Error(res.text ?? `${tool} failed`)
  return res.text ?? ''
}

const userIdFor = async ($: EngineInterface, email: string) => {
  const key = `userId:${email}`
  const cached = await $.store.get(key)
  if (typeof cached === 'string') return cached

  const tool = await findTool($, 'getUserByEmail')
  if (!tool) throw new Error('no-connector')
  const user = JSON.parse(await callJson($, tool, { email })) as { UserId?: string }
  if (!user.UserId) throw new Error(`No Maul user for ${email}`)
  await $.store.set(key, user.UserId)
  return user.UserId
}

const fetchOrders = async ($: EngineInterface, email: string): Promise<Orders> => {
  const now = await $.clock.now()
  try {
    if (!email) throw new Error('no-email')
    const tool = await findTool($, 'listUserOrders')
    if (!tool) throw new Error('no-connector')
    const userId = await userIdFor($, email)
    const weeks = await Promise.all(
      weeksToFetch(new Date(now)).map(async week => parseOrders(await callJson($, tool, { userId, isoWeek: week }))),
    )
    return { kind: 'ok', meals: sortMeals(weeks.flat()), fetchedAt: now }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : String(err), fetchedAt: now }
  }
}

const refresh = async ($: EngineInterface, email: string) => {
  await update($, isLoading, () => true)
  try {
    const next = await fetchOrders($, email)
    await update($, orders, () => next)
    if (next.kind === 'ok') {
      const today = isoDate(new Date(await $.clock.now()))
      await update($, selected, current =>
        current && next.meals.some(m => m.date === current) ? current : pickDefault(next.meals, today),
      )
    }
  } finally {
    await update($, isLoading, () => false)
  }
}

const step = async ($: EngineInterface, by: number) => {
  const data = await read($, orders)
  if (data?.kind !== 'ok') return
  const dates = [...new Set(data.meals.map(m => m.date))]
  const current = await read($, selected)
  const i = Math.max(0, dates.indexOf(current ?? ''))
  const next = dates[Math.min(dates.length - 1, Math.max(0, i + by))]
  if (next) await update($, selected, () => next)
}

export const register: Register = (on, options) => {
  const email = String(options.email ?? '').trim()
  const lang: Lang = options.lang === 'en' ? 'en' : 'is'
  const t = LABELS[lang]

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'order', description: 'Toggle your Maul order for today and this week' })
    return next(e)
  })

  on('command.run', { command: 'order' }, async $ => {
    if (await read($, isOpen)) {
      await $.ui.close({ id: PANE })
      return { text: 'Maul order hidden.' }
    }
    await $.ui.open({ id: PANE, title: 'Maul' })
    await update($, isOpen, () => true)
    const data = await read($, orders)
    if (!data || (await $.clock.now()) - data.fetchedAt > STALE_MS) void refresh($, email).catch(() => {})
    return { text: 'Maul order opened.' }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    await update($, isOpen, () => false)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const data = await read($, orders)
    const isStale = !data || (await $.clock.now()) - data.fetchedAt > STALE_MS
    if ((await read($, isOpen)) && isStale) void refresh($, email).catch(() => {})
    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Link, Text } = $.ui.resolve(e)
    const data = await read($, orders)
    const loading = await read($, isLoading)
    const width = Math.max(20, e.props.bodyColumns)

    const refreshButton = (
      <Button key="refresh" label={loading ? '…' : t.refresh} hotkey="r" dimColor onPress={() => refresh($, email)} />
    )

    if (!data) {
      return (
        <Box flexDirection="column">
          <Text dimColor>{t.loading}</Text>
          {refreshButton}
        </Box>
      )
    }

    if (data.kind === 'error') {
      return (
        <Box flexDirection="column">
          <Text color={RED}>{data.message === 'no-connector' ? t.noConnector : data.message === 'no-email' ? t.noEmail : data.message}</Text>
          {refreshButton}
        </Box>
      )
    }

    if (data.meals.length === 0) {
      return (
        <Box flexDirection="column">
          <Text dimColor>{t.none}</Text>
          {refreshButton}
        </Box>
      )
    }

    const today = isoDate(new Date(await $.clock.now()))
    const day = (await read($, selected)) ?? pickDefault(data.meals, today)
    const meals = data.meals.filter(m => m.date === day)
    const dates = [...new Set(data.meals.map(m => m.date))]
    const at = dates.indexOf(day ?? '')

    const chips = (allergens: string[]): RenderNode => (
      <Text>
        {allergens.map(a => {
          const info = ALLERGENS[a]
          return (
            <Text backgroundColor={info?.color ?? MUTED} color="#ffffff">
              {` ${info?.[lang] ?? a} `}
            </Text>
          )
        })}
      </Text>
    )

    const mealCard = (m: Meal): RenderNode => (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>{m.mealTime === 'Dinner' ? t.dinner : t.lunch}</Text>
        <Box flexDirection="column" borderStyle="round" borderColor={MUTED} paddingX={1}>
          {m.restaurantUrl ? (
            <Link href={m.restaurantUrl}>
              <Text color={LINK}>{m.restaurant.toUpperCase()} ↗</Text>
            </Link>
          ) : (
            <Text color={LINK}>{m.restaurant.toUpperCase()}</Text>
          )}
          <Text bold>{m.title[lang]}</Text>
          <Text>{m.description[lang]}</Text>
          {m.allergens.length > 0 && <Box marginTop={1}>{chips(m.allergens)}</Box>}
          <Box marginTop={1} flexDirection="column">
            {m.date <= today && (
              <Text color={m.hasFeedback ? GREEN : AMBER}>{m.hasFeedback ? t.reviewed : t.review}</Text>
            )}
            {m.status !== 'Default' && <Text color={AMBER}>● {m.status}</Text>}
            {m.compensation !== 'NoCompensation' && <Text color={AMBER}>● {m.compensation}</Text>}
            <Text>
              <Text bold color={MUTED}>
                {t.pickup}
              </Text>{' '}
              {m.location}
            </Text>
          </Box>
        </Box>
      </Box>
    )

    const weekRow = (date: string): RenderNode => {
      const meal = data.meals.find(m => m.date === date)
      const isSelected = date === day
      return (
        <Text wrap="truncate" color={isSelected ? GREEN : undefined} dimColor={!isSelected && date < today}>
          {isSelected ? '▸ ' : '  '}
          <Text bold={date === today}>{shortDate(date, lang).padEnd(12)}</Text>
          {meal ? `${meal.restaurant} · ${meal.title[lang]}` : ''}
          {meal?.hasFeedback && <Text color={GREEN}> ✓</Text>}
        </Text>
      )
    }

    return (
      <Box flexDirection="column" width={width}>
        <Box flexDirection="column" borderStyle="round" borderColor={BORDER} paddingX={1}>
          <Box justifyContent="space-between">
            <Text bold color={GREEN}>
              {longDate(day ?? today, lang).toUpperCase()}
            </Text>
            <Box>
              <Button key="prev" label="◂" plain dimColor={at <= 0} hotkey="h" onPress={() => step($, -1)} />
              <Text> </Text>
              <Button key="next" label="▸" plain dimColor={at >= dates.length - 1} hotkey="l" onPress={() => step($, 1)} />
            </Box>
          </Box>
          {meals.map(mealCard)}
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text bold color={MUTED}>
            {t.week.toUpperCase()}
          </Text>
          {dates.map(weekRow)}
        </Box>
        <Box marginTop={1}>{refreshButton}</Box>
      </Box>
    )
  })
}
