<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { TriangleAlert } from "lucide-vue-next";
import RecordRow from "../components/fgu/record-row/record-row.vue";
import Button from "../components/fgu/button/button.vue";
import Select from "../components/fgu/select/select.vue";
import StateLine from "../components/StateLine.vue";
import { useToast } from "../components/fgu/toast/toast-store";
import { AISLES, DAYS, RECIPES } from "../data";
import { state, chalkIn, restoreNight, conflictsForSeats, portionsOf, formatQty } from "../store";

const route = useRoute();
const router = useRouter();
const { push } = useToast();

const current = computed(() => RECIPES.find((r) => r.id === route.query.r));
const target = ref<string>("");
const dayOptions = computed(() =>
  state.nights.map((n, d) => ({ value: String(d), label: `${DAYS[d].long}${n.recipeId ? " (replaces a dinner)" : " (open)"}` }))
    .sort((a, b) => Number(a.label.includes("replaces")) - Number(b.label.includes("replaces"))),
);
const targetDay = computed(() => (target.value !== "" ? Number(target.value) : Number(dayOptions.value[0].value)));
const eaters = computed(() => portionsOf(state.nights[targetDay.value]));
const conflicts = computed(() => (current.value ? conflictsForSeats(current.value, state.nights[targetDay.value].seats) : []));
const byAisle = computed(() =>
  AISLES.map((a) => ({ a, items: (current.value?.ingredients ?? []).filter((i) => i.aisle === a.id) })).filter((x) => x.items.length),
);

function choose(id: string) { void router.replace({ query: { r: id } }); }
function chalk() {
  if (!current.value) return;
  const day = targetDay.value;
  const before = chalkIn(day, current.value.id);
  push({ message: `${current.value.name} is chalked in for ${DAYS[day].long}.`, action: "Undo", timeout: 6000, onAction: () => restoreNight(day, before) });
}
const qtyFor = (per: number, unit: Parameters<typeof formatQty>[1]) => formatQty(per * eaters.value, unit);
</script>

<template>
  <div class="page recipes">
    <header class="page-head">
      <p class="caps">Twelve dinners the household cooks</p>
      <h1 class="page-title">Recipes</h1>
    </header>
    <StateLine v-if="state.status === 'loading'" kind="loading" />
    <StateLine v-else-if="state.status === 'error'" kind="error" title="The recipes did not load" />
    <div v-else class="split">
      <ul class="recipe-list" aria-label="Recipes">
        <RecordRow v-for="r in RECIPES" :key="r.id" :current="current?.id === r.id">
          <template #lead><span class="mono">{{ r.minutes }}<small> min</small></span></template>
          {{ r.name }}
          <template #meta>{{ r.note }}</template>
          <template #action>
            <Button variant="secondary" :aria-pressed="current?.id === r.id" @click="choose(r.id)">{{ current?.id === r.id ? "Open" : "Show" }}<span class="sr-only"> {{ r.name }}</span></Button>
          </template>
        </RecordRow>
      </ul>
      <section class="recipe-detail" aria-live="polite" aria-labelledby="detail-title">
        <StateLine v-if="!current" kind="empty" title="Pick a recipe">
          <p>Its ingredients show here by aisle, scaled to the night you chalk it onto.</p>
        </StateLine>
        <template v-else>
          <p class="caps">{{ current.minutes }} minutes</p>
          <h2 id="detail-title" class="detail-title">{{ current.name }}</h2>
          <p class="detail-note">{{ current.note }}.</p>
          <div class="detail-chalk">
            <Select variant="native" label="Chalk it onto" :options="dayOptions" :value="target || dayOptions[0].value" @update:value="(v: string) => (target = v)" />
            <Button variant="primary" @click="chalk">Chalk in</Button>
          </div>
          <p v-for="c in conflicts" :key="c.member.id + c.what" class="warn-line"><TriangleAlert :size="16" :stroke-width="1.75" aria-hidden="true" />{{ c.member.name }} avoids {{ c.what }} and sits at {{ DAYS[targetDay].long }}'s table.</p>
          <h3 class="detail-sub">For <span class="mono">{{ eaters.toFixed(1).replace(".0", "") }}</span> portions, by aisle</h3>
          <div v-for="g in byAisle" :key="g.a.id" class="detail-aisle">
            <h4><span class="mono">{{ g.a.number }}</span> {{ g.a.name }}</h4>
            <ul>
              <li v-for="ing in g.items" :key="ing.name"><span>{{ ing.name }}<em v-if="ing.staple"> (pantry)</em></span><span class="mono">{{ qtyFor(ing.per, ing.unit) }}</span></li>
            </ul>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>
