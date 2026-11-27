<script setup lang="ts">
import { computed } from "vue";

/** Chalk tally: four strokes and a slash per five. The identity motif. */
const props = defineProps<{ n: number; label?: string }>();
const groups = computed(() => {
  const out: number[] = [];
  let left = Math.max(0, Math.floor(props.n));
  while (left > 0) { out.push(Math.min(5, left)); left -= 5; }
  return out;
});
</script>

<template>
  <span class="tally" role="img" :aria-label="label ?? `${n} marked`">
    <svg v-for="(g, i) in groups" :key="i" viewBox="0 0 26 20" width="26" height="20" aria-hidden="true">
      <path v-for="s in Math.min(g, 4)" :key="s" :d="`M${3 + (s - 1) * 5.5} 2v16`" />
      <path v-if="g === 5" d="M1 15L25 5" />
    </svg>
  </span>
</template>
