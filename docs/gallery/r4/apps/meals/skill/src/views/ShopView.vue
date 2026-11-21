<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../components/fgu/button/button.vue";
import Field from "../components/fgu/field/field.vue";
import Toggle from "../components/fgu/toggle/toggle.vue";
import Disclosure from "../components/fgu/disclosure/disclosure.vue";
import Tabs from "../components/fgu/tabs/tabs.vue";
import HangTag from "../parts/HangTag.vue";
import Icon from "../parts/Icon.vue";
import { AISLES, type Aisle } from "../data";
import { addCustom, dayName, dinnerById, formatQty, linesByAisle, load, loadError, loadState, removeCustom, shopLines, startFresh, store, tickedCount, toBuy, toggleHave, toggleTicked, untickAll } from "../store";
import { pushToast } from "../toasts";

const tab = ref("aisle");
const extra = ref("");
const extraAisle = ref<Aisle>("Pantry");
const extraField = ref<InstanceType<typeof Field> | null>(null);
const copying = ref(false);

const allDone = computed(() => toBuy.value.length > 0 && tickedCount.value === toBuy.value.length);
const isTicked = (k: string) => store.ticked.includes(k);
const hasIt = (k: string) => store.have.includes(k);
const aisleLeft = (lines: { key: string }[]) => lines.filter((l) => !hasIt(l.key) && !isTicked(l.key)).length;
const byDinner = computed(() => store.week.map((n, i) => ({ i, dinner: dinnerById(n.dinnerId) })).filter((x) => x.dinner));

function add(e: Event) {
  e.preventDefault();
  if (!extraField.value?.validate()) return;
  addCustom(extra.value.trim(), 1, extraAisle.value);
  pushToast(`${extra.value.trim()} added under ${extraAisle.value}.`);
  extra.value = "";
  extraField.value?.focus();
}

async function copyList() {
  copying.value = true;
  const text = linesByAisle.value
    .map((g) => `${g.number}. ${g.name}\n${g.lines.filter((l) => !hasIt(l.key)).map((l) => `  [${isTicked(l.key) ? "x" : " "}] ${l.name}, ${formatQty(l.qty, l.unit)}`).join("\n")}`)
    .join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    pushToast("List copied. Paste it into the family chat.");
  } catch {
    pushToast("Couldn't copy the list. Your browser blocked clipboard access; the list on screen is unchanged.", { variant: "error" });
  } finally {
    copying.value = false;
  }
}
</script>

<template>
  <div v-if="loadState === 'loading'" aria-busy="true">
    <p class="sr-only" role="status">Loading the shopping list</p>
    <div class="skel" style="inline-size: 12rem; block-size: var(--space-10); margin-block-end: var(--space-6)"></div>
    <div v-for="n in 8" :key="n" class="skel" style="block-size: var(--space-12); margin-block-end: var(--space-2)"></div>
  </div>

  <section v-else-if="loadState === 'error'" class="card state" data-tone="error" role="alert">
    <Icon name="alert" />
    <h2>We couldn't build the list</h2>
    <p>{{ loadError }} The plan is still saved on this device.</p>
    <div class="row"><Button @click="load">Try again</Button><Button variant="secondary" @click="startFresh">Start fresh</Button></div>
  </section>

  <template v-else>
    <header class="head">
      <div>
        <h1>Shopping</h1>
        <p class="num"><template v-if="toBuy.length">{{ tickedCount }} of {{ toBuy.length }} in the trolley</template><template v-else>Nothing to buy yet</template></p>
      </div>
      <div class="actions">
        <Button v-if="tickedCount > 0" variant="ghost" @click="untickAll">Untick all</Button>
        <Button variant="secondary" :loading="copying" :disabled="shopLines.length === 0" @click="copyList"><template #icon><Icon name="copy" /></template>Copy list</Button>
      </div>
    </header>

    <section v-if="allDone" class="done card" role="status">
      <HangTag tone="leaf" swing>All done</HangTag>
      <p>Everything is in the trolley. Enjoy the week.</p>
    </section>

    <form class="add" novalidate @submit="add">
      <Field ref="extraField" v-model="extra" label="Add something else" required autocomplete="off" placeholder="Washing-up liquid" data-msg-value-missing="Type what to buy, for example “Washing-up liquid”." />
      <div class="sel"><label for="extra-aisle">Aisle</label><select id="extra-aisle" v-model="extraAisle"><option v-for="a in AISLES" :key="a.name" :value="a.name">{{ a.number }} · {{ a.name }}</option></select></div>
      <Button type="submit"><template #icon><Icon name="plus" /></template>Add</Button>
    </form>

    <section v-if="shopLines.length === 0" class="card state" role="status">
      <HangTag tone="carrot">Empty list</HangTag>
      <h2>Plan a dinner first and the list fills itself</h2>
      <p>Every dinner on the week brings its ingredients here, added up and sorted by aisle. You can still add your own lines above.</p>
      <div class="row"><a class="cta" href="#/week">Go to the week</a></div>
    </section>

    <Tabs v-else label="Group the list" :tabs="[{ id: 'aisle', label: 'By aisle' }, { id: 'dinner', label: 'By dinner' }]" :selected="tab" @change="(id) => (tab = id)">
      <template #panel-aisle>
        <div class="aisles">
          <Disclosure v-for="g in linesByAisle" :key="g.name" :open="true">
            <template #trigger>
              <span class="aisle"><HangTag tone="paper">Aisle <span class="num">{{ g.number }}</span></HangTag><strong>{{ g.name }}</strong><span class="meta num">{{ aisleLeft(g.lines) }} left</span></span>
            </template>
            <ul class="lines">
              <li v-for="l in g.lines" :key="l.key" class="line" :data-have="hasIt(l.key) || undefined">
                <Toggle :model-value="isTicked(l.key)" :disabled="hasIt(l.key)" @update:model-value="(v) => toggleTicked(l.key, v)">
                  <span class="lname" :data-done="isTicked(l.key) || undefined">{{ l.name }}</span>
                  <span class="qty num">{{ formatQty(l.qty, l.unit) }}</span>
                </Toggle>
                <span class="from meta">{{ l.from.join(", ") }}</span>
                <Toggle variant="switch" :model-value="hasIt(l.key)" @update:model-value="(v) => toggleHave(l.key, v)"><span class="meta">At home</span></Toggle>
                <button v-if="l.custom" type="button" class="rm" :aria-label="`Remove ${l.name}`" @click="removeCustom(l.key.split('|')[1])">&times;</button>
              </li>
            </ul>
          </Disclosure>
        </div>
      </template>
      <template #panel-dinner>
        <ul class="dinners">
          <li v-for="x in byDinner" :key="x.i" class="card by">
            <h3><HangTag tone="paper">{{ dayName(x.i).slice(0, 3) }}</HangTag> {{ x.dinner!.name }}</h3>
            <ul>
              <li v-for="ing in x.dinner!.ingredients" :key="ing.name" class="meta ing"><span>{{ ing.name }}</span><span class="num">{{ formatQty(ing.qty, ing.unit) }}</span><span>{{ ing.aisle }}</span></li>
            </ul>
          </li>
          <li v-if="byDinner.length === 0" class="meta">No dinners planned, so only your own lines are on the list.</li>
        </ul>
      </template>
    </Tabs>
  </template>
</template>

<style scoped>
.done { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4) var(--space-6); margin-block-end: var(--space-6); border-color: var(--color-success); }
.add { display: grid; grid-template-columns: 1fr auto auto; gap: var(--space-3); align-items: start; margin-block-end: var(--space-6); }
.add :deep([data-part="error"]) { min-block-size: var(--space-5); }
.sel { display: grid; gap: var(--space-1); font-size: var(--text-sm); }
.sel label { font-weight: 600; }
.sel select { min-block-size: var(--size-control-lg); padding-inline: var(--space-3); font: inherit; font-size: max(var(--text-base), 1rem); border: var(--border-width-hairline) solid var(--color-input); border-radius: var(--radius-md); background: var(--color-card); color: var(--color-foreground); }
.add > :last-child { margin-block-start: var(--space-6); }
.cta { display: inline-flex; align-items: center; min-block-size: var(--size-control-lg); padding-inline: var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border-radius: var(--radius-md); font-weight: 600; text-decoration: none; }
.aisles { display: grid; gap: var(--space-3); }
.aisle { display: inline-flex; align-items: center; gap: var(--space-3); font-size: var(--text-lg); font-family: var(--font-display); }
.aisle .meta { font-family: var(--font-sans); }
.lines { display: grid; }
.line { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: var(--space-2) var(--space-4); border-block-start: var(--border-width-hairline) solid var(--color-border); }
.line[data-have] { opacity: 0.7; }
.lname[data-done] { text-decoration: line-through; color: var(--color-muted-foreground); }
.qty { color: var(--color-muted-foreground); margin-inline-start: var(--space-2); }
.rm { min-inline-size: var(--size-control-md); min-block-size: var(--size-control-md); background: transparent; border: 0; color: var(--color-muted-foreground); font-size: var(--text-xl); cursor: pointer; border-radius: var(--radius-full); }
.dinners { display: grid; gap: var(--space-3); }
.by { padding: var(--space-4); display: grid; gap: var(--space-2); }
.by h3 { display: flex; align-items: center; gap: var(--space-3); font-family: var(--font-display); font-size: var(--text-lg); font-weight: 600; }
.ing { display: grid; grid-template-columns: 1fr 6rem 8rem; gap: var(--space-2); padding-block: var(--space-1); border-block-start: var(--border-width-hairline) solid var(--color-border); }
@media (max-width: 47.99rem) {
  .add { grid-template-columns: 1fr auto; }
  .add > :last-child { grid-column: 1 / -1; margin-block-start: 0; justify-self: start; }
  .line { grid-template-columns: 1fr auto; }
  .line .from { display: none; }
  .ing { grid-template-columns: 1fr auto; }
  .ing span:last-child { display: none; }
}
</style>
