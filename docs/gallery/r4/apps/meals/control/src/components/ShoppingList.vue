<script setup lang="ts">
import { ref } from 'vue'
import { AISLES } from '../types'
import type { Aisle } from '../types'
import {
  addExtra, allLines, clearChecked, formatQty, isChecked, linesByAisle, plannedDays, progress, removeExtra, toggleLine,
} from '../store'

defineEmits<{ goPlan: [] }>()

const name = ref('')
const aisle = ref<Aisle>('Pantry')
const touched = ref(false)

function submit() {
  touched.value = true
  if (!name.value.trim()) return
  addExtra(name.value, aisle.value)
  name.value = ''
  touched.value = false
}
</script>

<template>
  <section aria-labelledby="shop-h">
    <div class="section-head">
      <h2 id="shop-h">Shopping by aisle</h2>
      <button v-if="progress.done" class="btn ghost" @click="clearChecked">Clear {{ progress.done }} ticked</button>
    </div>

    <form class="add" novalidate @submit.prevent="submit">
      <label class="sr" for="extra-name">Extra item</label>
      <input id="extra-name" v-model="name" type="text" placeholder="Add something else, e.g. dish soap" :aria-invalid="touched && !name.trim()" />
      <label class="sr" for="extra-aisle">Aisle</label>
      <select id="extra-aisle" v-model="aisle">
        <option v-for="a in AISLES" :key="a">{{ a }}</option>
      </select>
      <button class="btn primary" type="submit">Add</button>
      <p v-if="touched && !name.trim()" class="field-error" role="alert">Type an item name first.</p>
    </form>

    <div v-if="!allLines.length" class="empty">
      <h3>Your list is empty</h3>
      <p v-if="!plannedDays.length">Plan at least one dinner and its ingredients appear here, grouped by aisle.</p>
      <p v-else>The dinners you planned have nobody eating. Tick someone in on the dinners tab.</p>
      <button class="btn primary" @click="$emit('goPlan')">Plan dinners</button>
    </div>

    <template v-else>
      <div class="progress" role="status">
        <div class="bar"><span :style="{ width: (progress.total ? (progress.done / progress.total) * 100 : 0) + '%' }" /></div>
        <p>{{ progress.done }} of {{ progress.total }} in the basket</p>
      </div>

      <p v-if="progress.done === progress.total" class="done-msg" role="status">
        Everything is in the basket. Enjoy the week.
      </p>

      <div v-for="g in linesByAisle" :key="g.aisle" class="aisle">
        <h3>{{ g.aisle }} <span class="count">{{ g.lines.filter((l) => !isChecked(l)).length }}</span></h3>
        <ul>
          <li v-for="l in g.lines" :key="l.key" :class="{ done: isChecked(l) }">
            <label>
              <input type="checkbox" :checked="isChecked(l)" @change="toggleLine(l)" />
              <span class="item-name">{{ l.name }}</span>
              <span v-if="l.usedIn.length" class="item-for">{{ l.usedIn.join(', ') }}</span>
              <span v-else class="item-for">Extra</span>
              <span class="qty">{{ formatQty(l) }}</span>
            </label>
            <button v-if="l.extraId" class="btn ghost small" :aria-label="`Remove ${l.name}`" @click="removeExtra(l)">Remove</button>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
