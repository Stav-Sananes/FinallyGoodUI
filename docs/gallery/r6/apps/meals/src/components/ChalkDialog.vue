<script setup lang="ts">
import { computed } from "vue";
import Dialog from "./fgu/dialog/dialog.vue";
import RecordRow from "./fgu/record-row/record-row.vue";
import Button from "./fgu/button/button.vue";
import { useToast } from "./fgu/toast/toast-store";
import { DAYS, RECIPES } from "../data";
import { state, chalkIn, clearNight, restoreNight, conflictsForSeats, recipeById } from "../store";

const props = defineProps<{ open: boolean; day: number }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();
const { push } = useToast();

const night = computed(() => state.nights[props.day]);
const seatedNames = computed(() => state.members.filter((_, i) => night.value?.seats[i]).map((m) => m.name).join(", ") || "nobody");
const rows = computed(() =>
  RECIPES.map((r) => ({ r, conflicts: conflictsForSeats(r, night.value?.seats ?? []) }))
    .sort((a, b) => a.conflicts.length - b.conflicts.length || a.r.minutes - b.r.minutes),
);

function pick(id: string) {
  const day = props.day;
  const before = chalkIn(day, id);
  emit("update:open", false);
  push({
    message: `${recipeById(id)?.name} is chalked in for ${DAYS[day].long}.`,
    action: "Undo",
    timeout: 6000,
    onAction: () => restoreNight(day, before),
  });
}
function clear() {
  const day = props.day;
  const before = clearNight(day);
  emit("update:open", false);
  push({ message: `${DAYS[day].long} is open again.`, action: "Undo", timeout: 6000, onAction: () => restoreNight(day, before) });
}
</script>

<template>
  <Dialog class="chalk-dialog" :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #title>Chalk in {{ DAYS[day].long }}</template>
    <template #description>Eating: {{ seatedNames }}. Quickest first; dishes someone avoids sink to the bottom.</template>
    <ul class="pick-list">
      <RecordRow v-for="{ r, conflicts } in rows" :key="r.id" variant="compact" :current="night?.recipeId === r.id">
        <template #lead><span class="mono">{{ r.minutes }} min</span></template>
        {{ r.name }}
        <template #meta>{{ r.note }}</template>
        <template #status>
          <span v-if="conflicts.length" class="pick-warn">{{ conflicts.map((c) => `${c.member.name} avoids ${c.what}`).join(", ") }}</span>
          <span v-else-if="night?.recipeId === r.id">On the board</span>
        </template>
        <template #action>
          <Button variant="secondary" @click="pick(r.id)">Chalk in<span class="sr-only"> {{ r.name }}</span></Button>
        </template>
      </RecordRow>
    </ul>
    <template v-if="night?.recipeId" #actions>
      <Button variant="ghost" @click="clear">Leave {{ DAYS[day].long }} open</Button>
    </template>
  </Dialog>
</template>
