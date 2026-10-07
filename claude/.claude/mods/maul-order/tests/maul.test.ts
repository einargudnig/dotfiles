import { expect, test } from 'claude-code/testing'

import { isoWeek, longDate, parseOrders, pickDefault, shortDate, sortMeals, weeksToFetch } from '../hooks/maul'
import { W41 } from './fixtures'

test('isoWeek follows ISO-8601, including year boundaries', async () => {
  expect(isoWeek(new Date('2026-10-07T12:00:00Z'))).toBe('2026-W41')
  expect(isoWeek(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01')
  expect(isoWeek(new Date('2027-01-01T12:00:00Z'))).toBe('2026-W53')
  expect(weeksToFetch(new Date('2026-10-07T12:00:00Z'))).toEqual(['2026-W41', '2026-W42'])
})

test('dates read in Icelandic and English', async () => {
  expect(longDate('2026-10-07', 'is')).toBe('miðvikudagur 7. október')
  expect(longDate('2026-10-07', 'is').toUpperCase()).toBe('MIÐVIKUDAGUR 7. OKTÓBER')
  expect(longDate('2026-10-07', 'en')).toBe('Wednesday 7 October')
  expect(shortDate('2026-10-05', 'is')).toBe('mán 5. okt')
})

test('parseOrders maps the connector response and fills missing languages', async () => {
  const meals = sortMeals(parseOrders(W41))
  expect(meals.map(m => m.date)).toEqual(['2026-10-06', '2026-10-07', '2026-10-09'])
  expect(meals[1]?.title.is).toBe('Nautahakksbaka')
  expect(meals[2]?.title.en).toBe('Pistasíulanga')
  expect(meals[2]?.restaurantUrl).toBeUndefined()
})

test('pickDefault prefers today, then the next order, then the last', async () => {
  const meals = sortMeals(parseOrders(W41))
  expect(pickDefault(meals, '2026-10-07')).toBe('2026-10-07')
  expect(pickDefault(meals, '2026-10-08')).toBe('2026-10-09')
  expect(pickDefault(meals, '2026-10-11')).toBe('2026-10-09')
  expect(pickDefault([], '2026-10-07')).toBeNull()
})
