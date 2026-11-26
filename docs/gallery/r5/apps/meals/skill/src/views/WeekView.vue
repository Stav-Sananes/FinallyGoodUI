<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../components/fgu/button/button.vue";
import Menu from "../components/fgu/menu/menu.vue";
import Dialog from "../components/fgu/dialog/dialog.vue";
import HangTag from "../parts/HangTag.vue";
import Icon from "../parts/Icon.vue";
import PickerDialog from "../parts/PickerDialog.vue";
import { PEOPLE, type Person } from "../data";
import { clearNight, clearWeek, dateOf, dayName, dinnerById, linesByAisle, loadError, loadState, load, plannedCount, restoreNight, restoreWeek, setCook, setNight, shopLines, snapshotWeek, startFresh, store, todayIndex, useSampleWeek } from "../store";
import { pushToast } from "../toasts";

const picker = ref<InstanceType<typeof PickerDialog> | null>(null);
const confirmOpen = ref(false);
let pickingFor = 0;
const today = todayIndex();

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const longFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
const weekLabel = computed(() => `Week of ${dateFmt.format(dateOf(0))}`);
const allSet = computed(() => plannedCount.value === 7);
const rows = computed(() => store.week.map((n, i) => ({ i, night: n, dinner: dinnerById(n.dinnerId) })));
const tonight = computed(() => rows.value[today]);

function ask(i: number) { pickingFor = i; picker.value?.open(dayName(i)); }
function onPick(dinnerId: string) {
  const i = pickingFor;
  const prev = { ...store.week[i] };
  setNight(i, dinnerId);
  pushToast(`${dayName(i)} is ${dinnerById(dinnerId)!.name}.`, { undo: () => restoreNight(i, prev) });
}
function menuItems(i: number) {
  const cook = store.week[i].cook;
  return [
    { label: "Swap dinner", onSelect: () => ask(i) },
    ...PEOPLE.map((p) => ({ label: `Cook: ${p}`, disabled: p === cook, onSelect: () => setCook(i, p as Person) })),
    { label: "Remove dinner", onSelect: () => remove(i) },
  ];
}
function remove(i: number) {
  const prev = { ...store.week[i] };
  const name = dinnerById(prev.dinnerId)!.name;
  clearNight(i);
  pushToast(`Removed ${name} from ${dayName(i)}.`, { undo: () => restoreNight(i, prev) });
}
function confirmClear() { confirmOpen.value = true; }
function doClear() {
  const before = snapshotWeek();
  clearWeek();
  confirmOpen.value = false;
  pushToast("Week cleared.", { undo: () => restoreWeek(before) });
}
function lastWeek() { useSampleWeek(); pushToast("Started from last week's plan. Swap anything that no longer fits."); }
</script>

<template>
  <div v-if="loadState === 'loading'" aria-busy="true">
    <p class="sr-only" role="status">Loading this week's plan</p>
    <div class="skel" style="inline-size: 12rem; block-size: var(--space-10)"></div>
    <div class="skel" style="block-size: var(--space-32); margin-block: var(--space-6)"></div>
    <div v-for="n in 5" :key="n" class="skel" style="block-size: var(--space-16); margin-block-end: var(--space-2)"></div>
  </div>

  <section v-else-if="loadState === 'error'" class="card state" data-tone="error" role="alert">
    <Icon name="alert" />
    <h2>We couldn't open the saved plan</h2>
    <p>{{ loadError }} Nothing was deleted: it is still on this device.</p>
    <div class="row">
      <Button @click="load"><template #icon><Icon name="refresh" /></template>Try again</Button>
      <Button variant="secondary" @click="startFresh">Start a fresh week</Button>
    </div>
  </section>

  <template v-else>
    <header class="head">
      <div>
        <h1>{{ weekLabel }}</h1>
        <p class="num">{{ plannedCount }} of 7 dinners planned</p>
      </div>
      <div class="actions">
        <Button v-if="plannedCount > 0" variant="ghost" @click="confirmClear">Clear week</Button>
      </div>
    </header>

    <section v-if="plannedCount === 0" class="card state" aria-labelledby="empty-h">
      <HangTag tone="carrot">Nothing planned</HangTag>
      <h2 id="empty-h">An empty week. Start with the nights that are already busy.</h2>
      <p>Pick a dinner for each night and who cooks it. The shopping list builds itself, sorted by aisle.</p>
      <div class="row">
        <Button @click="ask(0)"><template #icon><Icon name="plus" /></template>Add Monday's dinner</Button>
        <Button variant="secondary" @click="lastWeek">Start from last week's plan</Button>
      </div>
    </section>

    <template v-else>
      <section class="stage card" aria-labelledby="tonight-h">
        <HangTag tone="carrot">Tonight · {{ longFmt.format(dateOf(today)) }}</HangTag>
        <template v-if="tonight.dinner">
          <h2 id="tonight-h">{{ tonight.dinner.name }}</h2>
          <div class="stage-meta">
            <span class="meta"><Icon name="clock" /><span class="num">{{ tonight.dinner.minutes }} min</span></span>
            <span class="meta">Serves <span class="num">3</span></span>
            <span class="cook"><span class="mono" :data-p="tonight.night.cook">{{ tonight.night.cook?.[0] }}</span>{{ tonight.night.cook }} is cooking</span>
          </div>
          <div class="stage-actions"><Menu :items="menuItems(today)"><span class="sr-only">Actions for tonight</span><Icon name="dots" /></Menu></div>
        </template>
        <template v-else>
          <h2 id="tonight-h">Tonight is open</h2>
          <p class="meta">No dinner on {{ dayName(today) }} yet.</p>
          <div><Button @click="ask(today)"><template #icon><Icon name="plus" /></template>Pick tonight's dinner</Button></div>
        </template>
      </section>

      <section v-if="allSet" class="done card" aria-live="polite">
        <HangTag tone="leaf" swing>Week's set</HangTag>
        <p><strong class="num">{{ shopLines.length }}</strong> things to buy in <strong class="num">{{ linesByAisle.length }}</strong> aisles.</p>
        <a class="link" href="#/shop">Go shopping</a>
      </section>

      <h2 class="sr-only">The week</h2>
      <ul class="week">
        <li v-for="r in rows" :key="r.i" class="night" :data-today="r.i === today || undefined" :data-empty="!r.dinner || undefined">
          <HangTag as="span" :tone="r.i === today ? 'carrot' : 'paper'"><span>{{ dayName(r.i).slice(0, 3) }}</span> <span class="num">{{ dateOf(r.i).getDate() }}</span></HangTag>
          <template v-if="r.dinner">
            <div class="what">
              <strong>{{ r.dinner.name }}</strong>
              <span class="meta"><span class="num">{{ r.dinner.minutes }} min</span> · {{ r.dinner.tags.join(", ") }}</span>
            </div>
            <span class="cook"><span class="mono" :data-p="r.night.cook">{{ r.night.cook?.[0] }}</span><span class="cookname">{{ r.night.cook }}</span></span>
            <Menu :items="menuItems(r.i)"><span class="sr-only">Actions for {{ dayName(r.i) }}</span><Icon name="dots" /></Menu>
          </template>
          <template v-else>
            <p class="what meta">Nothing planned for {{ dayName(r.i) }}.</p>
            <Button variant="secondary" @click="ask(r.i)"><template #icon><Icon name="plus" /></template>Add dinner</Button>
          </template>
        </li>
      </ul>
    </template>

    <PickerDialog ref="picker" @pick="onPick" />
    <Dialog variant="confirm" :open="confirmOpen" @close="confirmOpen = false">
      <template #title>Clear the whole week?</template>
      <template #description>All seven dinners come off the board and the shopping list empties. Ticks and your own extra lines stay. You can undo this for a few seconds.</template>
      <template #actions>
        <Button variant="ghost" @click="confirmOpen = false">Keep the week</Button>
        <Button variant="destructive" @click="doClear">Clear week</Button>
      </template>
    </Dialog>
  </template>
</template>

<style scoped>
.stage { position: relative; display: grid; gap: var(--space-3); justify-items: start; padding: var(--space-8) var(--space-6); margin-block-end: var(--space-6); background: var(--color-card); }
.stage h2 { font-family: var(--font-display); font-size: var(--text-5xl); font-weight: 600; line-height: var(--text-5xl--line-height); letter-spacing: var(--text-5xl--letter-spacing); max-inline-size: 18ch; }
.stage-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-6); }
.stage-actions { position: absolute; inset-block-start: var(--space-4); inset-inline-end: var(--space-4); }
.done { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-4); padding: var(--space-4) var(--space-6); margin-block-end: var(--space-6); border-color: var(--color-success); }
.link { margin-inline-start: auto; font-weight: 700; color: var(--color-primary); text-underline-offset: 0.25em; }
.week { display: grid; gap: var(--space-2); }
.night { display: grid; grid-template-columns: 6.5rem 1fr auto auto; align-items: center; gap: var(--space-3) var(--space-4); padding: var(--space-3) var(--space-4); background: var(--color-card); border: var(--border-width-hairline) solid var(--color-border); border-radius: var(--radius-lg); }
.night[data-today] { border-color: var(--color-warning); box-shadow: var(--shadow-sm); }
.night[data-empty] { background: transparent; border-style: dashed; border-color: var(--color-input); }
.night > :first-child { justify-self: start; }
.what { display: grid; gap: 0; min-inline-size: 0; }
.what strong { font-size: var(--text-lg); font-weight: 650; }
@media (max-width: 47.99rem) {
  .stage { padding: var(--space-6) var(--space-4); }
  .stage h2 { font-size: var(--text-4xl); }
  .night { grid-template-columns: auto 1fr auto; }
  .night .what { grid-column: 1 / -1; grid-row: 2; }
  .night > :nth-child(3) { grid-row: 1; justify-self: end; }
  .cookname { display: none; }
}
</style>
