<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { Plus } from "lucide-vue-next";
import AisleWalk from "../components/AisleWalk.vue";
import StateLine from "../components/StateLine.vue";
import Tally from "../components/Tally.vue";
import Field from "../components/fgu/field/field.vue";
import Select from "../components/fgu/select/select.vue";
import Button from "../components/fgu/button/button.vue";
import Toggle from "../components/fgu/toggle/toggle.vue";
import { AISLES, type AisleId } from "../data";
import { state, shopList, toBuy, inBasket, addExtra, chalkedCount } from "../store";

const name = ref("");
const aisle = ref<AisleId>("produce");
const error = ref("");
const aisleOptions = AISLES.map((a) => ({ value: a.id, label: `${a.number}. ${a.name}` }));

function add() {
  if (!name.value.trim()) { error.value = "Name the thing you are missing, for example “Oat milk”."; return; }
  error.value = "";
  addExtra(name.value, aisle.value);
  name.value = "";
}
const pantryCount = computed(() => shopList.value.filter((i) => i.have).length);
const route = computed(() =>
  AISLES.map((a) => {
    const buy = toBuy.value.filter((i) => i.aisle === a.id);
    return { a, total: buy.length, left: buy.filter((i) => !i.checked).length };
  }).filter((r) => r.total),
);
const done = computed(() => toBuy.value.length > 0 && inBasket.value === toBuy.value.length);
</script>

<template>
  <div class="page shop">
    <header class="page-head">
      <p class="caps">Store order: aisle 1 to aisle 7</p>
      <h1 class="page-title">Aisle walk</h1>
      <p v-if="state.status === 'ready' && toBuy.length" class="page-sub">
        <Tally :n="inBasket" :label="`${inBasket} in the basket`" class="inline-tally" />
        <span class="mono">{{ inBasket }}</span> of <span class="mono">{{ toBuy.length }}</span> in the basket<template v-if="done">. Basket done, head for the till.</template>
      </p>
    </header>

    <StateLine v-if="state.status === 'loading'" kind="loading" />
    <StateLine v-else-if="state.status === 'error'" kind="error" title="The list did not load" />
    <div v-else class="split shop-split">
      <aside class="route" aria-label="Aisles on your route">
        <ol>
          <li v-for="r in route" :key="r.a.id">
            <a :href="`#aisle-${r.a.id}`"><span class="mono n">{{ r.a.number }}</span><span class="nm">{{ r.a.sign }}</span><span class="mono left">{{ r.left === 0 ? "done" : r.left }}</span></a>
          </li>
        </ol>
        <Toggle variant="switch" v-model="state.hidePantry">Hide what is in the pantry <span class="mono">({{ pantryCount }})</span></Toggle>
        <form class="add" novalidate @submit.prevent="add">
          <Field v-model="name" label="Add something missing" placeholder="Oat milk" :error="error" :invalid="!!error" autocomplete="off" />
          <Select variant="native" label="Aisle" :options="aisleOptions" :value="aisle" @update:value="(v: string) => (aisle = v as AisleId)" />
          <Button type="submit" variant="primary"><template #icon><Plus :size="18" :stroke-width="1.75" /></template>Add to the walk</Button>
        </form>
      </aside>
      <div class="work">
        <StateLine v-if="!shopList.length" kind="empty" title="Nothing to buy: chalk in a dinner first">
          <p>{{ chalkedCount ? "Everything on the board is already in the pantry." : "The board is empty, so the list is too." }}</p>
          <RouterLink class="rail-more" to="/">Back to the board</RouterLink>
        </StateLine>
        <AisleWalk v-else full />
      </div>
    </div>
  </div>
</template>
