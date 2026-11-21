import { computed, reactive, readonly, ref } from "vue";
import { AISLES, PEOPLE, SAMPLE_WEEK, SEED_DINNERS, type Aisle, type Dinner, type Night, type Person, type Unit } from "./data";

const KEY = "supper-board:v1";
const LOAD_DELAY_MS = 600; // simulated read latency so the loading state is real and visible

export interface ShopLine { key: string; name: string; qty: number; unit: Unit; aisle: Aisle; from: string[]; custom: boolean }

interface Saved { week: Night[]; ticked: string[]; have: string[]; custom: { id: string; name: string; qty: number; unit: Unit; aisle: Aisle }[]; dinners: Dinner[] }

export type LoadState = "loading" | "ready" | "error";

const state = reactive<{ week: Night[]; ticked: string[]; have: string[]; custom: Saved["custom"]; dinners: Dinner[] }>({
  week: SAMPLE_WEEK.map((n) => ({ ...n })),
  ticked: [],
  have: [],
  custom: [],
  dinners: SEED_DINNERS.map((d) => ({ ...d })),
});
export const loadState = ref<LoadState>("loading");
export const loadError = ref("");

function valid(s: unknown): s is Saved {
  const x = s as Saved;
  return !!x && Array.isArray(x.week) && x.week.length === 7 && Array.isArray(x.ticked) && Array.isArray(x.have) && Array.isArray(x.custom) && Array.isArray(x.dinners) && x.dinners.length > 0;
}

function read(): Saved | null {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(raw);
  if (!valid(parsed)) throw new Error("The saved plan is not in a shape this version understands.");
  return parsed;
}

export function load() {
  loadState.value = "loading";
  setTimeout(() => {
    try {
      const saved = read();
      if (saved) Object.assign(state, saved);
      loadState.value = "ready";
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : "Storage is blocked on this device.";
      loadState.value = "error";
    }
  }, LOAD_DELAY_MS);
}

export function startFresh() {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked: the plan simply stays in memory */ }
  Object.assign(state, { week: SAMPLE_WEEK.map((n) => ({ ...n })), ticked: [], have: [], custom: [], dinners: SEED_DINNERS.map((d) => ({ ...d })) });
  loadState.value = "ready";
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked: keep working in memory */ }
}

export const store = readonly(state);

export const dinnerById = (id: string | null) => state.dinners.find((d) => d.id === id) ?? null;

export function setNight(index: number, dinnerId: string, cook?: Person) {
  const prev = state.week[index];
  state.week[index] = { dinnerId, cook: cook ?? prev.cook ?? PEOPLE[index % PEOPLE.length] };
  save();
}
export function setCook(index: number, cook: Person) { state.week[index].cook = cook; save(); }
export function clearNight(index: number) { state.week[index] = { dinnerId: null, cook: null }; save(); }
export function restoreNight(index: number, night: Night) { state.week[index] = { ...night }; save(); }
export function snapshotWeek(): Night[] { return state.week.map((n) => ({ ...n })); }
export function restoreWeek(week: Night[]) { state.week = week.map((n) => ({ ...n })); save(); }
export function clearWeek() { state.week = state.week.map(() => ({ dinnerId: null, cook: null })); save(); }
export function useSampleWeek() { state.week = SAMPLE_WEEK.map((n) => ({ ...n })); save(); }

export function addDinner(d: Dinner) { state.dinners.unshift(d); save(); }

export function toggleTicked(key: string, on: boolean) {
  state.ticked = on ? [...new Set([...state.ticked, key])] : state.ticked.filter((k) => k !== key);
  save();
}
export function toggleHave(key: string, on: boolean) {
  state.have = on ? [...new Set([...state.have, key])] : state.have.filter((k) => k !== key);
  save();
}
export function addCustom(name: string, qty: number, aisle: Aisle) {
  state.custom.push({ id: `c${Date.now()}`, name, qty, unit: "", aisle });
  save();
}
export function removeCustom(id: string) { state.custom = state.custom.filter((c) => c.id !== id); save(); }
export function untickAll() { state.ticked = []; save(); }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const dayName = (i: number) => DAYS[i];

/** Monday of the week that contains today, local time. */
export function weekStart(now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
export const todayIndex = (now = new Date()) => (now.getDay() + 6) % 7;
export const dateOf = (i: number) => { const d = weekStart(); d.setDate(d.getDate() + i); return d; };

/** The list is derived from the plan, never stored, so it cannot drift out of sync with a swap. */
export const shopLines = computed<ShopLine[]>(() => {
  const map = new Map<string, ShopLine>();
  state.week.forEach((night, idx) => {
    const dinner = dinnerById(night.dinnerId);
    if (!dinner) return;
    for (const ing of dinner.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit}`;
      const line = map.get(key) ?? { key, name: ing.name, qty: 0, unit: ing.unit, aisle: ing.aisle, from: [], custom: false };
      line.qty += ing.qty;
      const day = DAYS[idx].slice(0, 3);
      if (!line.from.includes(day)) line.from.push(day);
      map.set(key, line);
    }
  });
  for (const c of state.custom) map.set(`custom|${c.id}`, { key: `custom|${c.id}`, name: c.name, qty: c.qty, unit: c.unit, aisle: c.aisle, from: ["Extra"], custom: true });
  return [...map.values()];
});

export const linesByAisle = computed(() =>
  AISLES.map((a) => ({ ...a, lines: shopLines.value.filter((l) => l.aisle === a.name).sort((x, y) => x.name.localeCompare(y.name)) })).filter((g) => g.lines.length > 0),
);

export const toBuy = computed(() => shopLines.value.filter((l) => !state.have.includes(l.key)));
export const tickedCount = computed(() => toBuy.value.filter((l) => state.ticked.includes(l.key)).length);
export const plannedCount = computed(() => state.week.filter((n) => n.dinnerId).length);

export function formatQty(qty: number, unit: Unit): string {
  const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
  if (unit === "g" && qty >= 1000) return `${nf.format(qty / 1000)} kg`;
  if (unit === "ml" && qty >= 1000) return `${nf.format(qty / 1000)} L`;
  if (unit === "g" || unit === "ml") return `${nf.format(qty)} ${unit}`;
  if (unit === "") return nf.format(qty);
  const plural = qty === 1 ? unit : unit === "bunch" ? "bunches" : `${unit}s`;
  return `${nf.format(qty)} ${plural}`;
}
