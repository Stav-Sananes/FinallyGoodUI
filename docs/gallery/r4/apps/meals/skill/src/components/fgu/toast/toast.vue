<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./toast.behaviour.js";

import type { ToastItem } from "../types";
const props = defineProps<{ toasts: ToastItem[] }>();
const emit = defineEmits<{ dismiss: [id: number]; action: [id: number] }>();
const el = ref<HTMLElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => { if (el.value) detach = attach(el.value); });
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-part="root" role="status">
    <div v-for="t in toasts" :key="t.id" data-part="toast" :data-variant="t.variant ?? 'info'" :data-timeout="t.timeout" @dismiss.prevent="emit('dismiss', t.id)">
      <p data-part="message">{{ t.message }}</p>
      <button v-if="t.actionLabel" data-part="action" type="button" @click="emit('action', t.id)">{{ t.actionLabel }}</button>
      <button data-part="dismiss" type="button" aria-label="Dismiss">&times;</button>
    </div>
  </div>
</template>

<style scoped src="./toast.css"></style>
