<script setup lang="ts">
import { computed } from "vue";
import Field from "../components/fgu/field/field.vue";
import Toggle from "../components/fgu/toggle/toggle.vue";
import Select from "../components/fgu/select/select.vue";
import RecordCard from "../components/fgu/record-card/record-card.vue";
import StateLine from "../components/StateLine.vue";
import Tally from "../components/Tally.vue";
import { AVOID_LABEL, DAYS, type Avoid } from "../data";
import { state, cookedBy, toggleSeat, recipeById, setTheme } from "../store";

const avoids = Object.keys(AVOID_LABEL) as Avoid[];
function setAvoid(mi: number, a: Avoid, on: boolean) {
  const list = state.members[mi].avoids;
  const at = list.indexOf(a);
  if (on && at < 0) list.push(a);
  if (!on && at >= 0) list.splice(at, 1);
}
const themeOptions = [{ value: "system", label: "Follow the device" }, { value: "light", label: "Light: kraft wall" }, { value: "dark", label: "Dark: night kitchen" }];
const seatsThisWeek = computed(() => state.members.map((_, mi) => state.nights.filter((n) => n.recipeId && n.seats[mi]).length));
</script>

<template>
  <div class="page household">
    <header class="page-head">
      <p class="caps">Three at the table</p>
      <h1 class="page-title">Household</h1>
    </header>
    <StateLine v-if="state.status === 'loading'" kind="loading" />
    <StateLine v-else-if="state.status === 'error'" kind="error" title="The household did not load" />
    <template v-else>
      <div class="people">
        <RecordCard v-for="(m, mi) in state.members" :key="m.id" class="person">
          <template #lead><span class="stamp" aria-hidden="true">{{ m.initial }}</span></template>
          <Field v-model="m.name" label="Name" autocomplete="off" />
          <template #meta>{{ m.role }}, eats <span class="mono">{{ m.weight }}</span> of a portion</template>
          <template #status>
            <span class="person-stats"><Tally :n="cookedBy(mi)" :label="`${cookedBy(mi)} dinners cooked`" /> cooks {{ cookedBy(mi) }}, at the table for {{ seatsThisWeek[mi] }}</span>
          </template>
          <template #action>
            <fieldset class="avoids">
              <legend>Does not eat</legend>
              <Toggle v-for="a in avoids" :key="a" :model-value="m.avoids.includes(a)" @update:model-value="(v: boolean) => setAvoid(mi, a, v)">{{ AVOID_LABEL[a] }}</Toggle>
            </fieldset>
          </template>
        </RecordCard>
      </div>

      <section class="seatgrid" aria-labelledby="seat-title">
        <h2 id="seat-title" class="sub-title">Usual seats this week</h2>
        <p class="page-sub">Same switches as on the board. Taking someone off a night shrinks that night's shopping.</p>
        <table>
          <thead><tr><th scope="col">Night</th><th scope="col">Dinner</th><th v-for="m in state.members" :key="m.id" scope="col">{{ m.name }}</th></tr></thead>
          <tbody>
            <tr v-for="(n, d) in state.nights" :key="d">
              <th scope="row">{{ DAYS[d].short }} <span class="mono">{{ DAYS[d].date }}</span></th>
              <td>{{ recipeById(n.recipeId)?.name ?? "Open night" }}</td>
              <td v-for="(m, mi) in state.members" :key="m.id">
                <Toggle :model-value="n.seats[mi]" @update:model-value="toggleSeat(d, mi)"><span class="sr-only">{{ m.name }} eats on {{ DAYS[d].long }}</span></Toggle>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="appearance" aria-labelledby="look-title">
        <h2 id="look-title" class="sub-title">Look of the kitchen</h2>
        <Select variant="native" label="Theme" :options="themeOptions" :value="state.theme" @update:value="(v: string) => setTheme(v as 'light' | 'dark' | 'system')" />
      </section>
    </template>
  </div>
</template>
