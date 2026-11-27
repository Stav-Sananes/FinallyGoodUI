import { createRouter, createWebHistory } from "vue-router";
import PlanView from "./views/PlanView.vue";
import RecipesView from "./views/RecipesView.vue";
import ShopView from "./views/ShopView.vue";
import HouseholdView from "./views/HouseholdView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "plan", component: PlanView, meta: { title: "Plan" } },
    { path: "/recipes", name: "recipes", component: RecipesView, meta: { title: "Recipes" } },
    { path: "/shop", name: "shop", component: ShopView, meta: { title: "Shop" } },
    { path: "/household", name: "household", component: HouseholdView, meta: { title: "Household" } },
    { path: "/:rest(.*)*", redirect: "/" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? "Plan")} · Larder Board`;
});
