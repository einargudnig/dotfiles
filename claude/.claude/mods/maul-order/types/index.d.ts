export type Lang = 'is' | 'en'

export type Meal = {
  date: string
  mealTime: string
  restaurant: string
  restaurantUrl?: string
  title: Record<Lang, string>
  description: Record<Lang, string>
  allergens: string[]
  location: string
  hasFeedback: boolean
  status: string
  compensation: string
}

export type Orders =
  | { kind: 'ok'; meals: Meal[]; fetchedAt: number }
  | { kind: 'error'; message: string; fetchedAt: number }

declare module 'claude-code' {
  interface PluginState {
    'maul-order': {
      orders: Orders | null
      selected: string | null
      isOpen: boolean
      isLoading: boolean
    }
  }
}
