<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RECIPES } from '../data'
import { plan } from '../store'

defineProps<{ day: string }>()
const emit = defineEmits<{ pick: [id: string]; close: [] }>()

const query = ref('')
const vegOnly = ref(false)
const input = ref<HTMLInputElement | null>(null)

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return RECIPES.filter(
    (r) =>
      (!vegOnly.value || r.vegetarian) &&
      (!q || r.name.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))),
  )
})

const plannedIds = computed(() => new Set(Object.values(plan.value).map((m) => m?.recipeId)))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  input.value?.focus()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="pick-h">
      <div class="section-head">
        <h2 id="pick-h">Dinner for {{ day }}</h2>
        <button class="btn ghost" @click="emit('close')">Close</button>
      </div>
      <div class="filters">
        <input ref="input" v-model="query" type="search" placeholder="Search dish, tag or ingredient" aria-label="Search recipes" />
        <label class="check"><input v-model="vegOnly" type="checkbox" /> Vegetarian only</label>
      </div>

      <div v-if="!results.length" class="empty small">
        <h3>No recipes match</h3>
        <p>Try a different word, or turn off the vegetarian filter.</p>
        <button class="btn" @click="(query = ''), (vegOnly = false)">Reset filters</button>
      </div>

      <ul v-else class="recipes">
        <li v-for="r in results" :key="r.id">
          <button class="recipe" @click="emit('pick', r.id)">
            <span class="r-name">{{ r.name }}</span>
            <span class="r-meta">
              {{ r.minutes }} min · {{ r.ingredients.length }} ingredients
              <span v-if="r.vegetarian" class="tag veg">Veg</span>
              <span v-if="plannedIds.has(r.id)" class="tag">Already this week</span>
            </span>
            <span class="r-tags">{{ r.tags.join(' · ') }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
