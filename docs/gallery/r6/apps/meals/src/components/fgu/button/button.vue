<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./button.behaviour.js";

withDefaults(defineProps<{ variant?: string; disabled?: boolean; loading?: boolean; type?: "button" | "submit" | "reset" }>(), { variant: "primary", disabled: false, loading: false, type: "button" });
const el = ref<HTMLButtonElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <button
    ref="el"
    data-fgu="button"
    data-part="root"
    :type="type"
    :data-variant="variant"
    :disabled="disabled"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span data-part="spinner" aria-hidden="true"></span>
    <span v-if="$slots['icon']" data-part="icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span data-part="label">
      <slot />
    </span>
  </button>
</template>

<style src="./button.css"></style>
