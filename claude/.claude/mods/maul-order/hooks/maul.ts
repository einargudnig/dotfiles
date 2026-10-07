import type { Lang, Meal } from '../types'

export const isoWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export const isoDate = (date: Date) => date.toISOString().slice(0, 10)

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000)

export const weeksToFetch = (now: Date) => [isoWeek(now), isoWeek(addDays(now, 7))]

type RawOrder = {
  Date: string
  MealTime: string
  RestaurantName: string
  BlogUrl?: string | null
  WebsiteUrl?: string | null
  ShortDescriptionByLang?: Partial<Record<Lang, string>>
  DescriptionByLang?: Partial<Record<Lang, string>>
  Allergens?: string[]
  LocationName: string
  HasFeedback: boolean
  OrderItemStatus: string
  CompensationStatus: string
}

const both = (byLang?: Partial<Record<Lang, string>>): Record<Lang, string> => ({
  is: byLang?.is ?? byLang?.en ?? '',
  en: byLang?.en ?? byLang?.is ?? '',
})

export const parseOrders = (text: string): Meal[] => {
  const raw = JSON.parse(text) as { orders?: RawOrder[] }
  return (raw.orders ?? []).map(o => ({
    date: o.Date,
    mealTime: o.MealTime,
    restaurant: o.RestaurantName,
    restaurantUrl: o.BlogUrl ?? o.WebsiteUrl ?? undefined,
    title: both(o.ShortDescriptionByLang),
    description: both(o.DescriptionByLang),
    allergens: o.Allergens ?? [],
    location: o.LocationName,
    hasFeedback: o.HasFeedback,
    status: o.OrderItemStatus,
    compensation: o.CompensationStatus,
  }))
}

export const sortMeals = (meals: Meal[]) =>
  [...meals].sort((a, b) => a.date.localeCompare(b.date) || a.mealTime.localeCompare(b.mealTime))

export const pickDefault = (meals: Meal[], today: string) =>
  meals.find(m => m.date === today)?.date ?? meals.find(m => m.date > today)?.date ?? meals.at(-1)?.date ?? null

const WEEKDAYS: Record<Lang, string[]> = {
  is: ['sunnudagur', 'mánudagur', 'þriðjudagur', 'miðvikudagur', 'fimmtudagur', 'föstudagur', 'laugardagur'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

const MONTHS: Record<Lang, string[]> = {
  is: ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

const parts = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return { weekday: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth() }
}

export const longDate = (iso: string, lang: Lang) => {
  const { weekday, day, month } = parts(iso)
  return lang === 'is'
    ? `${WEEKDAYS.is[weekday]} ${day}. ${MONTHS.is[month]}`
    : `${WEEKDAYS.en[weekday]} ${day} ${MONTHS.en[month]}`
}

export const shortDate = (iso: string, lang: Lang) => {
  const { weekday, day, month } = parts(iso)
  const wd = (WEEKDAYS[lang][weekday] ?? '').slice(0, 3)
  const mo = (MONTHS[lang][month] ?? '').slice(0, 3)
  return lang === 'is' ? `${wd} ${day}. ${mo}` : `${wd} ${day} ${mo}`
}

export const ALLERGENS: Record<string, { is: string; en: string; color: string }> = {
  gluten: { is: 'Glúten', en: 'Gluten', color: '#d9773a' },
  eggs: { is: 'Egg', en: 'Eggs', color: '#e8a04c' },
  fish: { is: 'Fiskur', en: 'Fish', color: '#3b4a8c' },
  soy: { is: 'Soja', en: 'Soy', color: '#3f8f5a' },
  lactose: { is: 'Laktósi', en: 'Lactose', color: '#7a4a32' },
  milk: { is: 'Mjólk', en: 'Milk', color: '#7a4a32' },
  nuts: { is: 'Hnetur', en: 'Nuts', color: '#c0504d' },
  peanuts: { is: 'Jarðhnetur', en: 'Peanuts', color: '#a8433f' },
  celery: { is: 'Sellerí', en: 'Celery', color: '#6aa84f' },
  mustard: { is: 'Sinnep', en: 'Mustard', color: '#c9a24a' },
  sesame: { is: 'Sesam', en: 'Sesame', color: '#b08850' },
  shellfish: { is: 'Skelfiskur', en: 'Shellfish', color: '#d0605e' },
  crustaceans: { is: 'Krabbadýr', en: 'Crustaceans', color: '#d0605e' },
  molluscs: { is: 'Lindýr', en: 'Molluscs', color: '#5f7fa8' },
  lupin: { is: 'Lúpína', en: 'Lupin', color: '#8a6fb0' },
  sulphites: { is: 'Súlfít', en: 'Sulphites', color: '#6b6b8a' },
}
