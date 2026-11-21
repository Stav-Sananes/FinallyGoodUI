export type Aisle = 'Produce' | 'Meat & Fish' | 'Dairy & Eggs' | 'Bakery' | 'Pantry' | 'Frozen'

export const AISLES: Aisle[] = ['Produce', 'Meat & Fish', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Frozen']

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type Day = (typeof DAYS)[number]

export interface Member {
  id: string
  name: string
  note: string
}

export interface Ingredient {
  name: string
  qty: number
  unit: string
  aisle: Aisle
}

export interface Recipe {
  id: string
  name: string
  minutes: number
  tags: string[]
  vegetarian: boolean
  ingredients: Ingredient[] // quantities for 3 servings
}

export interface PlannedMeal {
  recipeId: string
  cook: string
  eating: string[] // member ids
}

export interface ExtraItem {
  id: string
  name: string
  aisle: Aisle
  done: boolean
}

export interface PersistedState {
  plan: Partial<Record<Day, PlannedMeal>>
  checked: Record<string, boolean>
  extras: ExtraItem[]
}

export interface ShoppingLine {
  key: string
  name: string
  qty: number
  unit: string
  aisle: Aisle
  usedIn: string[]
  extraId?: string
}
