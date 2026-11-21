<script setup lang="ts">
import { ref } from 'vue'
import { MEMBERS } from '../data'
import { DAYS } from '../types'
import type { Day } from '../types'
import RecipePicker from './RecipePicker.vue'
import { clearMeal, clearWeek, plan, plannedDays, recipeById, setCook, setMeal, toggleEating } from '../store'

defineEmits<{ goShop: [] }>()

const pickerDay = ref<Day | null>(null)
const FULL: Record<Day, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

function pick(recipeId: string) {
  if (pickerDay.value) setMeal(pickerDay.value, recipeId)
  pickerDay.value = null
}

function confirmClear() {
  if (window.confirm('Clear all seven dinners and the ticks on your shopping list?')) clearWeek()
}
</script>

<template>
  <section aria-labelledby="plan-h">
    <div class="section-head">
      <h2 id="plan-h">This week's dinners</h2>
      <button v-if="plannedDays.length" class="btn ghost" @click="confirmClear">Clear week</button>
    </div>

    <div v-if="!plannedDays.length" class="empty">
      <h3>No dinners planned yet</h3>
      <p>Pick a recipe for each night. The shopping list builds itself from what you choose.</p>
      <button class="btn primary" @click="pickerDay = 'Mon'">Plan Monday</button>
    </div>

    <ol class="days">
      <li v-for="day in DAYS" :key="day" class="day" :class="{ open: !plan[day] }">
        <div class="day-name">
          <span class="abbr">{{ day }}</span>
          <span class="full">{{ FULL[day] }}</span>
        </div>

        <template v-if="plan[day]">
          <div class="meal">
            <h3>{{ recipeById(plan[day]!.recipeId)?.name }}</h3>
            <p class="meta">
              {{ recipeById(plan[day]!.recipeId)?.minutes }} min
              <span v-if="recipeById(plan[day]!.recipeId)?.vegetarian" class="tag veg">Vegetarian</span>
              <span v-else class="tag">Has meat or fish</span>
            </p>

            <div class="who" role="group" :aria-label="`Who eats on ${FULL[day]}`">
              <button
                v-for="m in MEMBERS"
                :key="m.id"
                class="chip"
                :class="{ on: plan[day]!.eating.includes(m.id) }"
                :aria-pressed="plan[day]!.eating.includes(m.id)"
                :title="m.note"
                @click="toggleEating(day, m.id)"
              >
                {{ m.name }}
              </button>
            </div>

            <p v-if="!plan[day]!.eating.length" class="warn">
              Nobody is eating. This night adds nothing to the list.
            </p>
            <p v-else-if="!recipeById(plan[day]!.recipeId)?.vegetarian && plan[day]!.eating.includes('maya')" class="warn">
              Maya is vegetarian. Consider a swap or a side.
            </p>

            <label class="cook">
              Cook
              <select :value="plan[day]!.cook" @change="setCook(day, ($event.target as HTMLSelectElement).value)">
                <option v-for="m in MEMBERS" :key="m.id" :value="m.id" :disabled="!plan[day]!.eating.includes(m.id)">
                  {{ m.name }}
                </option>
              </select>
            </label>
          </div>
          <div class="actions">
            <button class="btn" @click="pickerDay = day">Swap</button>
            <button class="btn ghost" :aria-label="`Remove dinner on ${FULL[day]}`" @click="clearMeal(day)">Remove</button>
          </div>
        </template>

        <template v-else>
          <div class="meal">
            <p class="muted">Nothing planned.</p>
          </div>
          <div class="actions">
            <button class="btn primary" @click="pickerDay = day">Add dinner</button>
          </div>
        </template>
      </li>
    </ol>

    <p class="foot-cta">
      <button class="btn link" @click="$emit('goShop')">Go to shopping list</button>
    </p>

    <RecipePicker v-if="pickerDay" :day="FULL[pickerDay]" @pick="pick" @close="pickerDay = null" />
  </section>
</template>
