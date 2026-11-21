<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "../components/fgu/dialog/dialog.vue";
import Field from "../components/fgu/field/field.vue";
import Button from "../components/fgu/button/button.vue";
import Icon from "./Icon.vue";
import { store } from "../store";

const emit = defineEmits<{ pick: [dinnerId: string] }>();
const dialog = ref<InstanceType<typeof Dialog> | null>(null);
const search = ref<InstanceType<typeof Field> | null>(null);
const dayLabel = ref("");
const q = ref("");

const results = computed(() => {
  const needle = q.value.trim().toLowerCase();
  return store.dinners.filter((d) => !needle || d.name.toLowerCase().includes(needle) || d.tags.some((t) => t.toLowerCase().includes(needle)));
});

function open(label: string) {
  dayLabel.value = label;
  q.value = "";
  dialog.value?.open();
  requestAnimationFrame(() => search.value?.focus());
}
function pick(id: string) { emit("pick", id); dialog.value?.close(); }
defineExpose({ open });
</script>

<template>
  <Dialog ref="dialog" :title="`Pick ${dayLabel}'s dinner`" :description="`${store.dinners.length} dinners the household knows. Search by name or tag such as quick or vegetarian.`">
    <div class="search"><Field ref="search" v-model="q" label="Search dinners" type="search" autocomplete="off" placeholder="Try “curry” or “quick”" /></div>
    <ul v-if="results.length" class="list" aria-label="Dinners">
      <li v-for="d in results" :key="d.id">
        <button type="button" class="pick" @click="pick(d.id)">
          <span class="name">{{ d.name }}</span>
          <span class="meta"><Icon name="clock" /><span class="num">{{ d.minutes }} min</span> · {{ d.tags.join(", ") }}</span>
        </button>
      </li>
    </ul>
    <div v-else class="none" role="status">
      <p><strong>No dinner matches “{{ q }}”.</strong></p>
      <p class="meta">Check the spelling, or clear the search to see all {{ store.dinners.length }}. New dinners are added from the Dinners page.</p>
      <Button variant="secondary" @click="q = ''">Clear search</Button>
    </div>
    <template #actions><Button variant="ghost" data-dialog-close>Cancel</Button></template>
  </Dialog>
</template>

<style scoped>
.search { margin-block-start: var(--space-4); }
.list { margin-block-start: var(--space-3); display: grid; gap: var(--space-1); max-block-size: 45dvh; overflow: auto; }
.pick { inline-size: 100%; display: grid; gap: var(--space-1); text-align: start; padding: var(--space-3); min-block-size: var(--size-control-lg); background: transparent; border: var(--border-width-hairline) solid transparent; border-radius: var(--radius-md); color: inherit; cursor: pointer; transition: background-color var(--duration-micro) var(--ease-snappy), border-color var(--duration-micro) var(--ease-snappy); }
.pick:focus-visible { outline: var(--ring-width) solid var(--color-ring); outline-offset: calc(var(--ring-offset) * -1); }
@media (hover: hover) and (pointer: fine) { .pick:hover { background: var(--color-accent); border-color: var(--color-border); } }
.name { font-weight: 650; font-size: var(--text-lg); }
.none { display: grid; justify-items: start; gap: var(--space-2); margin-block-start: var(--space-4); padding: var(--space-4); background: var(--color-muted); border-radius: var(--radius-lg); }
</style>
