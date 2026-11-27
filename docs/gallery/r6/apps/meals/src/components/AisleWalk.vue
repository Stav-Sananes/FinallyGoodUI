<script setup lang="ts">
import { computed } from "vue";
import { Undo2, Trash2 } from "lucide-vue-next";
import RecordRow from "./fgu/record-row/record-row.vue";
import Toggle from "./fgu/toggle/toggle.vue";
import Button from "./fgu/button/button.vue";
import { AISLES, DAYS } from "../data";
import { shopList, setChecked, setHave, removeExtra, state, toBuy } from "../store";

const props = defineProps<{ full?: boolean }>();

const visible = computed(() => shopList.value.filter((i) => (props.full ? !(state.hidePantry && i.have) : !i.have)));
const sections = computed(() =>
  AISLES.map((a) => {
    const items = visible.value.filter((i) => i.aisle === a.id);
    const buy = items.filter((i) => !i.have);
    return { aisle: a, items, left: buy.filter((i) => !i.checked).length, total: buy.length };
  }).filter((s) => s.items.length > 0),
);
const dayList = (days: number[]) => days.map((d) => DAYS[d].short).join(", ");
defineExpose({ sections, total: computed(() => toBuy.value.length) });
</script>

<template>
  <div class="walk" :class="{ full }">
    <section v-for="s in sections" :id="`aisle-${s.aisle.id}`" :key="s.aisle.id" class="aisle" :aria-labelledby="`sign-${s.aisle.id}`">
      <h3 :id="`sign-${s.aisle.id}`" class="sign">
        <span class="sign-no" aria-hidden="true">{{ s.aisle.number }}</span>
        <span class="sign-name"><span class="sr-only">Aisle {{ s.aisle.number }}: </span>{{ s.aisle.name }}</span>
        <span class="sign-left mono">{{ s.left === 0 ? "done" : `${s.left} left` }}</span>
      </h3>
      <ul>
        <RecordRow v-for="it in s.items" :key="it.key" variant="compact" :class="{ have: it.have, got: it.checked && !it.have }">
          <Toggle v-if="!it.have" :model-value="it.checked" @update:model-value="(v: boolean) => setChecked(it.key, v)">{{ it.name }}</Toggle>
          <span v-else class="have-name">{{ it.name }}</span>
          <template #meta>
            <template v-if="it.extra">Added by hand</template>
            <template v-else-if="it.have">In the pantry, not on the list</template>
            <template v-else>For {{ dayList(it.forDays) }}</template>
          </template>
          <template #status><span class="mono qty">{{ it.qty }}</span></template>
          <template v-if="full" #action>
            <Button v-if="it.extra" variant="ghost" @click="removeExtra(it.key.split('|')[1])"><template #icon><Trash2 :size="16" :stroke-width="1.75" /></template>Remove<span class="sr-only"> {{ it.name }}</span></Button>
            <Button v-else variant="ghost" @click="setHave(it.key, !it.have)"><template #icon><Undo2 :size="16" :stroke-width="1.75" /></template>{{ it.have ? "Need it" : "Have it" }}<span class="sr-only"> {{ it.name }}</span></Button>
          </template>
        </RecordRow>
      </ul>
    </section>
  </div>
</template>
