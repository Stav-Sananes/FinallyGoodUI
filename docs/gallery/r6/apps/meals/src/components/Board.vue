<script setup lang="ts">
import { computed } from "vue";
import { ChefHat, TriangleAlert, Eraser, RotateCcw } from "lucide-vue-next";
import RecordRow from "./fgu/record-row/record-row.vue";
import Button from "./fgu/button/button.vue";
import Tally from "./Tally.vue";
import { DAYS } from "../data";
import {
  state, recipeById, chalkedCount, totalPortions, toBuy, conflictsFor, eatersOf, portionsOf,
  toggleSeat, passPan, clearWeek, resetWeek, retryLoad,
} from "../store";

const emit = defineEmits<{ open: [day: number] }>();

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];
const headline = computed(() => {
  const n = chalkedCount.value;
  if (n === 0) return "Nothing chalked yet";
  if (n === 7) return "All seven chalked in";
  return `${WORDS[n]} ${n === 1 ? "dinner" : "dinners"}, ${WORDS[7 - n].toLowerCase()} open`;
});
const firstOpen = computed(() => state.nights.findIndex((n) => !n.recipeId));
const portionsText = computed(() => {
  const p = totalPortions.value;
  return `${Number.isInteger(p) ? p : p.toFixed(1)} portions`;
});
const w = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
</script>

<template>
  <section class="board" data-fgu-signature aria-labelledby="board-title">
    <header class="board-head">
      <p class="caps">Week 49 · Mon 30 Nov to Sun 6 Dec</p>
      <h1 id="board-title" class="board-title">{{ state.status === "ready" ? headline : state.status === "error" ? "The board did not load" : "Wiping the board" }}</h1>
      <Tally v-if="state.status === 'ready'" class="board-tally" :n="chalkedCount" :label="`${chalkedCount} of 7 dinners chalked in`" />
    </header>

    <div v-if="state.status === 'loading'" class="board-lines" role="status" aria-live="polite" aria-label="Loading the week">
      <div v-for="d in DAYS" :key="d.short" class="line-skeleton">
        <span class="bar day"></span><span class="bar dish"></span><span class="bar seats"></span>
      </div>
    </div>

    <div v-else-if="state.status === 'error'" class="board-error" role="alert">
      <p>The saved week could not be read. Nothing was lost; the board just needs another try.</p>
      <Button variant="primary" @click="retryLoad"><template #icon><RotateCcw :size="18" :stroke-width="1.75" /></template>Try again</Button>
    </div>

    <template v-else>
      <ul class="board-lines" aria-label="Dinners this week">
        <RecordRow
          v-for="(night, d) in state.nights"
          :key="DAYS[d].short"
          class="night"
          :class="{ open: !night.recipeId, fresh: state.lastChalked === d }"
        >
          <template #lead>
            <span class="day"><b>{{ DAYS[d].short }}</b><span>{{ DAYS[d].date }}</span></span>
          </template>
          <span v-if="night.recipeId" class="dish"><span class="dish-name">{{ recipeById(night.recipeId)?.name }}</span></span>
          <span v-else class="dish none">{{ d === firstOpen && chalkedCount === 0 ? "Start with the night you dread most" : "Open night" }}</span>
          <template #meta>
            <span v-if="night.recipeId" class="meta-line">
              <span class="mono">{{ recipeById(night.recipeId)?.minutes }} min</span>
              <template v-if="eatersOf(night) > 0">
                <span aria-hidden="true">·</span>
                <button type="button" class="cook" :aria-label="`${state.members[night.cook].name} cooks on ${DAYS[d].long}. Pass the pan`" :disabled="eatersOf(night) < 2" @click="passPan(d)">
                  <ChefHat :size="16" :stroke-width="1.75" aria-hidden="true" />{{ state.members[night.cook].name }}
                </button>
                <span aria-hidden="true">·</span><span class="mono">{{ w(portionsOf(night)) }} portions</span>
              </template>
              <span v-else class="warn">Nobody home: no shopping for this night</span>
              <span v-for="c in conflictsFor(night, recipeById(night.recipeId))" :key="c.member.id + c.what" class="warn"><TriangleAlert :size="15" :stroke-width="1.75" aria-hidden="true" />{{ c.member.name }} avoids {{ c.what }}</span>
            </span>
            <span v-else class="meta-line"><span>{{ eatersOf(night) }} {{ eatersOf(night) === 1 ? "seat" : "seats" }} taken</span></span>
          </template>
          <template #status>
            <span class="seats" role="group" :aria-label="`Who eats on ${DAYS[d].long}`">
              <button
                v-for="(m, mi) in state.members"
                :key="m.id"
                type="button"
                class="seat"
                :aria-pressed="night.seats[mi]"
                :aria-label="`${m.name} eats on ${DAYS[d].long}`"
                :title="`${m.name}: ${night.seats[mi] ? 'eating' : 'not home'}`"
                @click="toggleSeat(d, mi)"
              >{{ m.initial }}</button>
            </span>
          </template>
          <template #action>
            <Button :variant="night.recipeId ? 'secondary' : 'primary'" @click="emit('open', d)">
              {{ night.recipeId ? "Swap" : "Chalk in" }}<span class="sr-only"> dinner for {{ DAYS[d].long }}</span>
            </Button>
          </template>
        </RecordRow>
      </ul>

      <footer class="board-foot">
        <p><span class="mono">{{ portionsText }}</span> cooked this week, <span class="mono">{{ toBuy.length }}</span> things to buy.</p>
        <div class="board-foot-actions">
          <Button variant="ghost" @click="clearWeek"><template #icon><Eraser :size="18" :stroke-width="1.75" /></template>Wipe the board</Button>
          <Button v-if="chalkedCount === 0" variant="secondary" @click="resetWeek"><template #icon><RotateCcw :size="18" :stroke-width="1.75" /></template>Use the sample week</Button>
        </div>
      </footer>
    </template>
  </section>
</template>
