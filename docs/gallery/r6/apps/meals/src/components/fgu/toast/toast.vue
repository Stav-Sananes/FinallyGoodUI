<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./toast.behaviour.js";

withDefaults(defineProps<{ toasts?: { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (id: string) => void }[]; label?: string }>(), { toasts: () => [], label: "Notifications" });
const emit = defineEmits<{ dismiss: [value: string] }>();
function onDismiss(event: Event) {
  event.preventDefault();
  emit("dismiss", (event.target as HTMLElement).dataset["id"] ?? "");
}
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-fgu="toast" data-part="root" role="status" :aria-label="label" @dismiss="onDismiss">
    <div
      v-for="(t) in toasts"
      :key="t.id"
      data-part="toast"
      :data-variant="t.variant ? t.variant : 'status'"
      :data-id="t.id"
      :data-timeout="t.timeout"
    >
      <p data-part="message">{{ t.message }}</p>
      <button v-if="t.action" data-part="action" type="button" @click="t.onAction && t.onAction(t.id)">{{ t.action }}</button>
      <button data-part="dismiss" type="button" aria-label="Dismiss">&times;</button>
    </div>
    <slot />
  </div>
</template>

<style src="./toast.css"></style>
