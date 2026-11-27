import { computed, reactive, watch } from "vue";
import { AISLES, DAYS, DEFAULT_MEMBERS, RECIPES, SEED_NIGHTS, type AisleId, type Avoid, type Member, type Night, type Recipe, type Unit } from "./data";

const KEY = "larder-board-v1";

export interface Extra { id: string; name: string; aisle: AisleId }
export interface ListItem {
  key: string; name: string; aisle: AisleId; qty: string; forDays: number[]; staple: boolean; extra: boolean;
  have: boolean; checked: boolean;
}
type Status = "loading" | "ready" | "error";

interface Persisted { nights: Night[]; members: Member[]; checked: Record<string, boolean>; have: Record<string, boolean>; extras: Extra[] }

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function readSaved(): Persisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

const saved = readSaved();

export const state = reactive({
  status: "loading" as Status,
  nights: clone(saved?.nights ?? SEED_NIGHTS) as Night[],
  members: clone(saved?.members ?? DEFAULT_MEMBERS) as Member[],
  checked: { ...(saved?.checked ?? {}) } as Record<string, boolean>,
  have: { ...(saved?.have ?? {}) } as Record<string, boolean>,
  extras: [...(saved?.extras ?? [])] as Extra[],
  hidePantry: false,
  lastChalked: -1,
  theme: ((): "light" | "dark" | "system" => {
    try {
      const t = localStorage.getItem("larder-theme");
      return t === "light" || t === "dark" ? t : "system";
    } catch {
      return "system";
    }
  })(),
});

watch(
  () => [state.nights, state.members, state.checked, state.have, state.extras],
  () => {
    try {
      const data: Persisted = { nights: state.nights, members: state.members, checked: state.checked, have: state.have, extras: state.extras };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch { /* storage may be unavailable; the board still works */ }
  },
  { deep: true },
);

export function setTheme(theme: "light" | "dark" | "system") {
  state.theme = theme;
  const root = document.documentElement;
  try {
    if (theme === "system") { root.removeAttribute("data-theme"); localStorage.removeItem("larder-theme"); }
    else { root.setAttribute("data-theme", theme); localStorage.setItem("larder-theme", theme); }
  } catch { /* ignore */ }
}

/** The forced state from the URL (`?state=loading|error|empty`) so every state is reachable. */
const forced = () => new URLSearchParams(location.search).get("state");

export function loadWeek(): Promise<void> {
  state.status = "loading";
  const f = forced();
  if (f === "loading") return new Promise(() => {});
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (f === "error") { state.status = "error"; resolve(); return; }
      if (f === "empty") clearWeek(false);
      state.status = "ready";
      resolve();
    }, 450);
  });
}

export function retryLoad() {
  const url = new URL(location.href);
  url.searchParams.delete("state");
  history.replaceState(history.state, "", url);
  return loadWeek();
}

export const recipeById = (id: string | null): Recipe | undefined => RECIPES.find((r) => r.id === id);

export const portionsOf = (n: Night) => n.seats.reduce((sum, on, idx) => sum + (on ? state.members[idx].weight : 0), 0);
export const eatersOf = (n: Night) => n.seats.filter(Boolean).length;

/** Who at this table avoids something in the recipe: [{member, what}]. */
export function conflictsFor(n: Night, recipe: Recipe | undefined) {
  if (!recipe) return [];
  const out: { member: Member; what: Avoid }[] = [];
  n.seats.forEach((on, idx) => {
    if (!on) return;
    for (const a of state.members[idx].avoids) if (recipe.contains.includes(a)) out.push({ member: state.members[idx], what: a });
  });
  return out;
}

export function conflictsForSeats(recipe: Recipe, seats: boolean[]) {
  return conflictsFor({ recipeId: recipe.id, seats, cook: 0, chalkedAt: 0 }, recipe);
}

export function formatQty(qty: number, unit: Unit): string {
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  switch (unit) {
    case "g": { const step = qty >= 500 ? 50 : 10; const v = Math.ceil(qty / step) * step; return v >= 1000 ? `${(v / 1000).toLocaleString("en", { maximumFractionDigits: 2 })} kg` : `${v} g`; }
    case "ml": { const v = Math.ceil(qty / 10) * 10; return v >= 1000 ? `${(v / 1000).toLocaleString("en", { maximumFractionDigits: 2 })} l` : `${v} ml`; }
    case "tin": { const v = Math.ceil(qty * 2) / 2; const whole = Math.floor(v); const half = v - whole === 0.5; const txt = whole === 0 ? "½" : half ? `${whole}½` : `${whole}`; return `${txt} ${plural(v, "tin", "tins")}`; }
    case "bunch": { const v = Math.ceil(qty); return `${v} ${plural(v, "bunch", "bunches")}`; }
    case "clove": { const v = Math.ceil(qty); return `${v} ${plural(v, "clove", "cloves")}`; }
    case "slice": { const v = Math.ceil(qty); return `${v} ${plural(v, "slice", "slices")}`; }
    default: return `${Math.ceil(qty)}`;
  }
}

export const shopList = computed<ListItem[]>(() => {
  const acc = new Map<string, { name: string; aisle: AisleId; unit: Unit; qty: number; days: Set<number>; staple: boolean }>();
  state.nights.forEach((n, d) => {
    const r = recipeById(n.recipeId);
    const portions = portionsOf(n);
    if (!r || portions === 0) return;
    for (const ing of r.ingredients) {
      const key = `${ing.aisle}|${ing.name}|${ing.unit}`;
      const row = acc.get(key) ?? { name: ing.name, aisle: ing.aisle, unit: ing.unit, qty: 0, days: new Set<number>(), staple: !!ing.staple };
      row.qty += ing.per * portions;
      row.days.add(d);
      acc.set(key, row);
    }
  });
  const items: ListItem[] = [...acc.entries()].map(([key, r]) => ({
    key, name: r.name, aisle: r.aisle, qty: formatQty(r.qty, r.unit), forDays: [...r.days].sort(), staple: r.staple, extra: false,
    have: state.have[key] ?? r.staple, checked: !!state.checked[key],
  }));
  for (const e of state.extras) {
    const key = `extra|${e.id}`;
    items.push({ key, name: e.name, aisle: e.aisle, qty: "extra", forDays: [], staple: false, extra: true, have: false, checked: !!state.checked[key] });
  }
  const order = (a: AisleId) => AISLES.findIndex((x) => x.id === a);
  return items.sort((a, b) => order(a.aisle) - order(b.aisle) || a.name.localeCompare(b.name));
});

export const toBuy = computed(() => shopList.value.filter((i) => !i.have));
export const inBasket = computed(() => toBuy.value.filter((i) => i.checked).length);

export const chalkedCount = computed(() => state.nights.filter((n) => n.recipeId).length);
export const totalPortions = computed(() => state.nights.reduce((s, n) => s + (n.recipeId ? portionsOf(n) : 0), 0));

export function chalkIn(day: number, recipeId: string): Night {
  const before = clone(state.nights[day]);
  const n = state.nights[day];
  n.recipeId = recipeId;
  n.chalkedAt = Date.now();
  state.lastChalked = day;
  window.setTimeout(() => { if (state.lastChalked === day) state.lastChalked = -1; }, 1400);
  return before;
}

export function restoreNight(day: number, night: Night) {
  Object.assign(state.nights[day], night);
}

export function clearNight(day: number): Night {
  const before = clone(state.nights[day]);
  state.nights[day].recipeId = null;
  return before;
}

export function clearWeek(persist = true) {
  state.nights.forEach((n) => { n.recipeId = null; });
  if (persist) { state.checked = {}; }
}

export function resetWeek() {
  state.nights = clone(SEED_NIGHTS);
  state.checked = {};
  state.have = {};
  state.extras = [];
}

export function toggleSeat(day: number, member: number) {
  const n = state.nights[day];
  n.seats[member] = !n.seats[member];
  if (!n.seats[n.cook]) {
    const next = n.seats.findIndex(Boolean);
    if (next >= 0) n.cook = next;
  }
}

export function passPan(day: number) {
  const n = state.nights[day];
  const seated = n.seats.map((on, idx) => (on ? idx : -1)).filter((x) => x >= 0);
  if (seated.length < 2) return;
  const at = seated.indexOf(n.cook);
  n.cook = seated[(at + 1) % seated.length];
}

export const cookedBy = (member: number) => state.nights.filter((n) => n.recipeId && n.seats[member] && n.cook === member).length;

export function setChecked(key: string, on: boolean) { state.checked[key] = on; }
export function setHave(key: string, on: boolean) { state.have[key] = on; }
export function addExtra(name: string, aisle: AisleId) {
  state.extras.push({ id: `${Date.now().toString(36)}${state.extras.length}`, name: name.trim(), aisle });
}
export function removeExtra(id: string) { state.extras = state.extras.filter((e) => e.id !== id); delete state.checked[`extra|${id}`]; }

export const dayName = (d: number) => DAYS[d].long;
