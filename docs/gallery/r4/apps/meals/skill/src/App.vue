<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "./parts/Icon.vue";
import HangTag from "./parts/HangTag.vue";
import Toast from "./components/fgu/toast/toast.vue";
import WeekView from "./views/WeekView.vue";
import DinnersView from "./views/DinnersView.vue";
import ShopView from "./views/ShopView.vue";
import { load, toBuy, tickedCount } from "./store";
import { dismissToast, runToastAction, toasts } from "./toasts";

const ROUTES = [
  { id: "week", label: "Week", icon: "calendar" },
  { id: "dinners", label: "Dinners", icon: "book" },
  { id: "shop", label: "Shop", icon: "basket" },
] as const;
type RouteId = (typeof ROUTES)[number]["id"];

const parse = (): RouteId => {
  const id = location.hash.replace(/^#\/?/, "") as RouteId;
  return ROUTES.some((r) => r.id === id) ? id : "week";
};
const route = ref<RouteId>(parse());
const onHash = () => { route.value = parse(); document.title = `${ROUTES.find((r) => r.id === route.value)!.label} · Supper Board`; };
onMounted(() => { window.addEventListener("hashchange", onHash); onHash(); load(); });
onBeforeUnmount(() => window.removeEventListener("hashchange", onHash));

const left = computed(() => toBuy.value.length - tickedCount.value);
const view = computed(() => ({ week: WeekView, dinners: DinnersView, shop: ShopView })[route.value]);
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <div class="shell">
    <header class="topbar">
      <a class="brand" href="#/week"><HangTag tone="beet">3 at the table</HangTag> Supper Board</a>
      <nav class="nav" aria-label="Main">
        <a v-for="r in ROUTES" :key="r.id" :href="`#/${r.id}`" :aria-current="route === r.id ? 'page' : undefined">
          <Icon :name="r.icon" />
          {{ r.label }}
          <span v-if="r.id === 'shop' && left > 0" class="count" :aria-label="`${left} left to buy`">{{ left }}</span>
        </a>
      </nav>
    </header>
    <main id="main" class="main" tabindex="-1">
      <component :is="view" />
    </main>
  </div>
  <Toast :toasts="toasts" @dismiss="dismissToast" @action="runToastAction" />
</template>
