<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../components/fgu/button/button.vue";
import Field from "../components/fgu/field/field.vue";
import Dialog from "../components/fgu/dialog/dialog.vue";
import HangTag from "../parts/HangTag.vue";
import Icon from "../parts/Icon.vue";
import { AISLES, type Aisle } from "../data";
import { addDinner, dayName, load, loadError, loadState, startFresh, store } from "../store";
import { pushToast } from "../toasts";

const q = ref("");
const dialog = ref<InstanceType<typeof Dialog> | null>(null);
const nameField = ref<InstanceType<typeof Field> | null>(null);
const minutesField = ref<InstanceType<typeof Field> | null>(null);
const mainField = ref<InstanceType<typeof Field> | null>(null);
const form = ref({ name: "", minutes: "30", main: "", qty: "1", aisle: "Produce" as Aisle });

const results = computed(() => {
  const needle = q.value.trim().toLowerCase();
  return store.dinners.filter((d) => !needle || d.name.toLowerCase().includes(needle) || d.tags.some((t) => t.toLowerCase().includes(needle)) || d.ingredients.some((i) => i.name.toLowerCase().includes(needle)));
});
const plannedOn = (id: string) => store.week.map((n, i) => (n.dinnerId === id ? dayName(i).slice(0, 3) : null)).filter(Boolean) as string[];

function openNew() {
  form.value = { name: "", minutes: "30", main: "", qty: "1", aisle: "Produce" };
  dialog.value?.open();
  requestAnimationFrame(() => nameField.value?.focus());
}
function save(e: Event) {
  e.preventDefault();
  const fields = [nameField, minutesField, mainField];
  const firstBad = fields.find((f) => f.value && !f.value.validate());
  if (firstBad) return;
  const f = form.value;
  const id = `own-${Date.now()}`;
  addDinner({ id, name: f.name.trim(), minutes: Number(f.minutes), tags: ["Our own"], ingredients: [{ name: f.main.trim(), qty: Number(f.qty) || 1, unit: "", aisle: f.aisle }] });
  dialog.value?.close();
  pushToast(`${f.name.trim()} is on the list of dinners. Pick it from any night.`);
}
</script>

<template>
  <div v-if="loadState === 'loading'" aria-busy="true">
    <p class="sr-only" role="status">Loading dinners</p>
    <div class="skel" style="inline-size: 12rem; block-size: var(--space-10); margin-block-end: var(--space-6)"></div>
    <div class="grid"><div v-for="n in 6" :key="n" class="skel" style="block-size: var(--space-32)"></div></div>
  </div>

  <section v-else-if="loadState === 'error'" class="card state" data-tone="error" role="alert">
    <Icon name="alert" />
    <h2>We couldn't open the saved dinners</h2>
    <p>{{ loadError }}</p>
    <div class="row"><Button @click="load">Try again</Button><Button variant="secondary" @click="startFresh">Start fresh</Button></div>
  </section>

  <template v-else>
    <header class="head">
      <div><h1>Dinners</h1><p class="num">{{ store.dinners.length }} the household knows</p></div>
      <div class="actions"><Button @click="openNew"><template #icon><Icon name="plus" /></template>New dinner</Button></div>
    </header>
    <div class="find"><Field v-model="q" label="Search dinners or ingredients" type="search" autocomplete="off" placeholder="Try “lentils” or “vegetarian”" /></div>

    <ul v-if="results.length" class="grid" aria-label="Dinners">
      <li v-for="d in results" :key="d.id" class="card dinner">
        <h2>{{ d.name }}</h2>
        <p class="meta"><Icon name="clock" /><span class="num">{{ d.minutes }} min</span> · <span class="num">{{ d.ingredients.length }}</span> ingredients</p>
        <p class="tags"><HangTag v-for="t in d.tags" :key="t">{{ t }}</HangTag></p>
        <p v-if="plannedOn(d.id).length" class="meta on">On the week: {{ plannedOn(d.id).join(", ") }}</p>
      </li>
    </ul>
    <section v-else class="card state" role="status">
      <h2>No dinner matches “{{ q }}”</h2>
      <p>Try an ingredient, a tag such as quick, or clear the search. Nothing here is hidden for good.</p>
      <div class="row"><Button variant="secondary" @click="q = ''">Clear search</Button><Button variant="ghost" @click="openNew">Add it as a new dinner</Button></div>
    </section>

    <Dialog ref="dialog" title="New dinner" description="Add one the household cooks. It shows up when you pick a night, and its main ingredient lands on the shopping list.">
      <form class="form" novalidate @submit="save">
        <Field ref="nameField" v-model="form.name" label="Name of the dinner" required autocomplete="off" data-msg-value-missing="Give it a name, for example “Lamb koftas”." />
        <Field ref="minutesField" v-model="form.minutes" label="Cooking time in minutes" required type="number" inputmode="numeric" min="5" max="240" data-msg-value-missing="How long does it take? Enter minutes." data-msg-range-underflow="Five minutes or more." data-msg-range-overflow="Four hours at most." />
        <Field ref="mainField" v-model="form.main" label="Main ingredient to buy" required autocomplete="off" data-msg-value-missing="Name one thing to put on the list, for example “Lamb mince”." />
        <div class="two">
          <Field v-model="form.qty" label="How many" type="number" inputmode="numeric" min="1" max="50" />
          <div class="sel"><label for="aisle">Aisle</label><select id="aisle" v-model="form.aisle"><option v-for="a in AISLES" :key="a.name" :value="a.name">{{ a.number }} · {{ a.name }}</option></select></div>
        </div>
        <div class="foot"><Button variant="ghost" data-dialog-close>Cancel</Button><Button type="submit">Save dinner</Button></div>
      </form>
    </Dialog>
  </template>
</template>

<style scoped>
.find { max-inline-size: 28rem; margin-block-end: var(--space-6); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: var(--space-4); }
.dinner { display: grid; align-content: start; gap: var(--space-2); padding: var(--space-4); }
.dinner h2 { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600; line-height: var(--text-xl--line-height); }
.tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.on { color: var(--color-success); font-weight: 600; }
.form { display: grid; gap: var(--space-3); margin-block-start: var(--space-4); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); align-items: start; }
.sel { display: grid; gap: var(--space-1); font-size: var(--text-sm); }
.sel label { font-weight: 600; }
.sel select { min-block-size: var(--size-control-lg); padding-inline: var(--space-3); font: inherit; font-size: max(var(--text-base), 1rem); border: var(--border-width-hairline) solid var(--color-input); border-radius: var(--radius-md); background: var(--color-card); color: var(--color-foreground); }
.foot { display: flex; justify-content: flex-end; gap: var(--space-2); margin-block-start: var(--space-2); }
</style>
