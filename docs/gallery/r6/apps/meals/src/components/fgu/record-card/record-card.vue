<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./record-card.behaviour.js";

withDefaults(defineProps<{ variant?: string; current?: boolean }>(), { variant: "default", current: false });
const el = ref<HTMLElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <article
    ref="el"
    data-fgu="record-card"
    data-part="root"
    :data-variant="variant"
    :aria-current="current ? 'true' : undefined"
  >
    <span v-if="$slots['lead']" data-part="lead">
      <slot name="lead" />
    </span>
    <span data-part="title">
      <slot />
    </span>
    <span v-if="$slots['meta']" data-part="meta">
      <slot name="meta" />
    </span>
    <span v-if="$slots['status']" data-part="status">
      <slot name="status" />
    </span>
    <span v-if="$slots['action']" data-part="action">
      <slot name="action" />
    </span>
  </article>
</template>

<style src="./record-card.css"></style>
