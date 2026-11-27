<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { CalendarDays, BookOpen, ShoppingBasket, Users, Sun, Moon, SunMoon } from "lucide-vue-next";
import Toast from "./components/fgu/toast/toast.vue";
import { useToast } from "./components/fgu/toast/toast-store";
import { setTheme, state, toBuy, inBasket } from "./store";

const { toasts, dismiss } = useToast();
const remaining = computed(() => toBuy.value.length - inBasket.value);
const nextTheme = computed(() => (state.theme === "system" ? "dark" : state.theme === "dark" ? "light" : "system"));
const themeLabel = computed(() => `Theme: ${state.theme}. Switch to ${nextTheme.value}`);
</script>

<template>
  <a class="skip" href="#main">Skip to the board</a>
  <div class="shell">
    <nav class="spine" aria-label="Places">
      <RouterLink to="/" class="spine-mark" aria-label="Larder Board, plan" tabindex="-1">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M8 9v14M13 9v14M18 9v14M23 9v14M5 21L27 11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
      </RouterLink>
      <ul>
        <li><RouterLink to="/" exact-active-class="is-here"><CalendarDays :size="22" :stroke-width="1.75" aria-hidden="true" /><span>Plan</span></RouterLink></li>
        <li><RouterLink to="/recipes" active-class="is-here"><BookOpen :size="22" :stroke-width="1.75" aria-hidden="true" /><span>Recipes</span></RouterLink></li>
        <li>
          <RouterLink to="/shop" active-class="is-here">
            <ShoppingBasket :size="22" :stroke-width="1.75" aria-hidden="true" /><span>Shop</span>
            <b v-if="remaining > 0" class="count" :aria-label="`${remaining} left to buy`">{{ remaining }}</b>
          </RouterLink>
        </li>
        <li><RouterLink to="/household" active-class="is-here"><Users :size="22" :stroke-width="1.75" aria-hidden="true" /><span>Household</span></RouterLink></li>
      </ul>
      <button type="button" class="theme" :aria-label="themeLabel" :title="themeLabel" @click="setTheme(nextTheme)">
        <SunMoon v-if="state.theme === 'system'" :size="20" :stroke-width="1.75" aria-hidden="true" />
        <Moon v-else-if="state.theme === 'dark'" :size="20" :stroke-width="1.75" aria-hidden="true" />
        <Sun v-else :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </nav>
    <main id="main" tabindex="-1"><RouterView /></main>
  </div>
  <Toast :toasts="toasts" @dismiss="dismiss" />
</template>
