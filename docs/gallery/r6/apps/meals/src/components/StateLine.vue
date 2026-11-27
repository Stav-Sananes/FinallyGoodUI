<script setup lang="ts">
import { RotateCcw } from "lucide-vue-next";
import Button from "./fgu/button/button.vue";
import Tally from "./Tally.vue";
import { retryLoad } from "../store";

defineProps<{ kind: "loading" | "error" | "empty"; title?: string }>();
</script>

<template>
  <div v-if="kind === 'loading'" class="state" role="status" aria-live="polite">
    <p class="sr-only">Loading</p>
    <div v-for="n in 5" :key="n" class="line-skeleton light"><span class="bar day"></span><span class="bar dish"></span><span class="bar seats"></span></div>
  </div>
  <div v-else-if="kind === 'error'" class="state" role="alert">
    <h2 class="state-title">{{ title ?? "This did not load" }}</h2>
    <p>The saved week could not be read. Nothing was lost.</p>
    <Button variant="primary" @click="retryLoad"><template #icon><RotateCcw :size="18" :stroke-width="1.75" /></template>Try again</Button>
  </div>
  <div v-else class="state empty">
    <Tally :n="0" label="No marks yet" class="state-tally" />
    <h2 class="state-title">{{ title }}</h2>
    <slot />
  </div>
</template>
