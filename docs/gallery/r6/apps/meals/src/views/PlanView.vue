<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import Board from "../components/Board.vue";
import ChalkDialog from "../components/ChalkDialog.vue";
import AisleWalk from "../components/AisleWalk.vue";
import StateLine from "../components/StateLine.vue";
import { inBasket, toBuy, state, chalkedCount } from "../store";

const open = ref(false);
const day = ref(0);
function openNight(d: number) { day.value = d; open.value = true; }
</script>

<template>
  <div class="plan">
    <Board @open="openNight" />
    <aside class="rail" aria-labelledby="rail-title">
      <div class="rail-head">
        <h2 id="rail-title">Aisle walk</h2>
        <p v-if="state.status === 'ready' && toBuy.length"><span class="mono">{{ inBasket }}</span> of <span class="mono">{{ toBuy.length }}</span> in the basket</p>
        <progress v-if="state.status === 'ready' && toBuy.length" class="basket" :max="toBuy.length" :value="inBasket" aria-label="Basket progress"></progress>
      </div>
      <StateLine v-if="state.status === 'loading'" kind="loading" />
      <StateLine v-else-if="state.status === 'error'" kind="error" title="The list needs the board" />
      <StateLine v-else-if="!toBuy.length" kind="empty" :title="chalkedCount ? 'Everything is in the pantry' : 'Nothing to buy yet'">
        <p>Chalk a dinner onto the board and its ingredients line up here, aisle by aisle, scaled to who is eating.</p>
      </StateLine>
      <template v-else>
        <AisleWalk />
        <RouterLink class="rail-more" to="/shop">Open the full walk</RouterLink>
      </template>
    </aside>
    <ChalkDialog v-model:open="open" :day="day" />
  </div>
</template>
