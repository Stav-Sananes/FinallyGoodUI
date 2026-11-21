<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import WeekPlan from './components/WeekPlan.vue'
import ShoppingList from './components/ShoppingList.vue'
import { errorMessage, load, plannedDays, progress, resetAll, status } from './store'

const tab = ref<'plan' | 'shop'>('plan')
const remaining = computed(() => progress.value.total - progress.value.done)

onMounted(load)
</script>

<template>
  <div class="shell">
    <header class="top">
      <div>
        <p class="eyebrow">Week of 23 Nov</p>
        <h1>Table for three</h1>
      </div>
      <nav v-if="status === 'ready'" class="tabs" aria-label="Sections">
        <button :class="{ on: tab === 'plan' }" :aria-pressed="tab === 'plan'" @click="tab = 'plan'">
          Dinners <span class="pill">{{ plannedDays.length }}/7</span>
        </button>
        <button :class="{ on: tab === 'shop' }" :aria-pressed="tab === 'shop'" @click="tab = 'shop'">
          Shopping <span class="pill">{{ remaining }} left</span>
        </button>
      </nav>
    </header>

    <main v-if="status === 'loading'" class="skeleton-wrap" aria-busy="true" aria-live="polite">
      <p class="sr">Loading your week...</p>
      <div class="skeleton-grid">
        <div v-for="n in 7" :key="n" class="skeleton" />
      </div>
    </main>

    <main v-else-if="status === 'error'" class="error-box" role="alert">
      <h2>We could not open this week</h2>
      <p>{{ errorMessage }}</p>
      <div class="row">
        <button class="btn primary" @click="load">Try again</button>
        <button class="btn" @click="resetAll">Start a fresh week</button>
      </div>
    </main>

    <main v-else class="split" :data-tab="tab">
      <WeekPlan class="pane pane-plan" @go-shop="tab = 'shop'" />
      <ShoppingList class="pane pane-shop" @go-plan="tab = 'plan'" />
    </main>
  </div>
</template>
