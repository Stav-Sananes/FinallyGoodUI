import { computed, reactive, ref } from 'vue'
import { MEMBERS, RECIPES } from './data'
import { AISLES, DAYS } from './types'
import type { Aisle, Day, ExtraItem, PersistedState, PlannedMeal, Recipe, ShoppingLine } from './types'

const STORAGE_KEY = 'table-for-three/v1'
const ALL_IDS = MEMBERS.map((m) => m.id)

export type LoadStatus = 'loading' | 'ready' | 'error'

export const status = ref<LoadStatus>('loading')
export const errorMessage = ref('')

const state = reactive<PersistedState>({ plan: {}, checked: {}, extras: [] })

export const plan = computed(() => state.plan)
export const extras = computed(() => state.extras)

function seedPlan(): PersistedState['plan'] {
  const meal = (recipeId: string, cook: string, eating = ALL_IDS): PlannedMeal => ({ recipeId, cook, eating })
  return {
    Mon: meal('lentil-soup', 'dana'),
    Tue: meal('tacos', 'dana'),
    Wed: meal('salmon', 'dana', ['dana', 'maya']),
    Thu: meal('pasta-pesto', 'ori'),
    Fri: meal('pizza', 'ori'),
  }
}

export function recipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id)
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: the plan still works for this session */
  }
}

function readStored(): PersistedState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  const parsed = JSON.parse(raw) as PersistedState
  if (typeof parsed !== 'object' || !parsed.plan || !Array.isArray(parsed.extras) || !parsed.checked) {
    throw new Error('Saved plan has an unexpected shape.')
  }
  for (const day of Object.keys(parsed.plan) as Day[]) {
    const m = parsed.plan[day]
    if (m && !recipeById(m.recipeId)) throw new Error(`Saved plan references an unknown recipe on ${day}.`)
  }
  return parsed
}

export function load() {
  status.value = 'loading'
  errorMessage.value = ''
  window.setTimeout(() => {
    try {
      const stored = new URLSearchParams(location.search).has('fail')
        ? (() => {
            throw new Error('The household sync service did not respond.')
          })()
        : readStored()
      const next = stored ?? { plan: seedPlan(), checked: {}, extras: [] }
      state.plan = next.plan
      state.checked = next.checked
      state.extras = next.extras
      status.value = 'ready'
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Could not read the saved plan.'
      status.value = 'error'
    }
  }, 700)
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEY)
  history.replaceState(null, '', location.pathname)
  load()
}

export function setMeal(day: Day, recipeId: string) {
  const prev = state.plan[day]
  state.plan[day] = { recipeId, cook: prev?.cook ?? 'dana', eating: prev?.eating ?? [...ALL_IDS] }
  persist()
}

export function clearMeal(day: Day) {
  delete state.plan[day]
  persist()
}

export function clearWeek() {
  state.plan = {}
  state.checked = {}
  persist()
}

export function setCook(day: Day, cook: string) {
  const m = state.plan[day]
  if (m) m.cook = cook
  persist()
}

export function toggleEating(day: Day, memberId: string) {
  const m = state.plan[day]
  if (!m) return
  m.eating = m.eating.includes(memberId) ? m.eating.filter((x) => x !== memberId) : [...m.eating, memberId]
  if (m.eating.length && !m.eating.includes(m.cook)) m.cook = m.eating[0]
  persist()
}

function scaled(qty: number, unit: string, eating: number): number {
  const raw = (qty * eating) / MEMBERS.length
  if (unit === 'g') return Math.ceil(raw / 10) * 10
  return Math.max(1, Math.ceil(raw - 1e-9))
}

export const plannedDays = computed(() => DAYS.filter((d) => state.plan[d]))

export const shoppingLines = computed<ShoppingLine[]>(() => {
  const map = new Map<string, ShoppingLine>()
  for (const day of DAYS) {
    const m = state.plan[day]
    const recipe = m && recipeById(m.recipeId)
    if (!m || !recipe || m.eating.length === 0) continue
    for (const ing of recipe.ingredients) {
      const key = `${ing.name}|${ing.unit}`
      const qty = scaled(ing.qty, ing.unit, m.eating.length)
      const line = map.get(key)
      if (line) {
        line.qty += qty
        line.usedIn.push(day)
      } else {
        map.set(key, { key, name: ing.name, qty, unit: ing.unit, aisle: ing.aisle, usedIn: [day] })
      }
    }
  }
  return [...map.values()]
})

export function isChecked(line: ShoppingLine): boolean {
  if (line.extraId) return state.extras.find((e) => e.id === line.extraId)?.done ?? false
  return !!state.checked[line.key]
}

export function toggleLine(line: ShoppingLine) {
  if (line.extraId) {
    const e = state.extras.find((x) => x.id === line.extraId)
    if (e) e.done = !e.done
  } else {
    state.checked[line.key] = !state.checked[line.key]
  }
  persist()
}

export function addExtra(name: string, aisle: Aisle) {
  const trimmed = name.trim()
  if (!trimmed) return
  const item: ExtraItem = { id: `x${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: trimmed, aisle, done: false }
  state.extras.push(item)
  persist()
}

export function removeExtra(line: ShoppingLine) {
  state.extras = state.extras.filter((e) => e.id !== line.extraId)
  persist()
}

export const allLines = computed<ShoppingLine[]>(() => [
  ...shoppingLines.value,
  ...state.extras.map<ShoppingLine>((e) => ({
    key: e.id, name: e.name, qty: 1, unit: '', aisle: e.aisle, usedIn: [], extraId: e.id,
  })),
])

export const linesByAisle = computed(() =>
  AISLES.map((aisle) => ({ aisle, lines: allLines.value.filter((l) => l.aisle === aisle) })).filter((g) => g.lines.length),
)

export const progress = computed(() => {
  const total = allLines.value.length
  const done = allLines.value.filter(isChecked).length
  return { total, done }
})

export function clearChecked() {
  state.checked = {}
  state.extras = state.extras.filter((e) => !e.done)
  persist()
}

export function formatQty(line: ShoppingLine): string {
  if (line.extraId) return ''
  return line.unit ? `${line.qty} ${line.unit}` : `${line.qty}`
}
