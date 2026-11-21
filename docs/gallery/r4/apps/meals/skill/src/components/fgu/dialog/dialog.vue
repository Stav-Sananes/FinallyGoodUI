<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./dialog.behaviour.js";

const props = withDefaults(defineProps<{ variant?: string; title: string; description?: string }>(), { variant: "modal" });
const emit = defineEmits<{ close: [] }>();
const el = ref<HTMLDialogElement | null>(null);
let detach: (() => void) | undefined;
let opener: HTMLElement | null = null;
onMounted(() => { if (el.value) detach = attach(el.value.parentElement ?? el.value); });
onBeforeUnmount(() => detach?.());
// The scaffold's behaviour opens through [data-dialog-open]; Vue callers open it by method and keep the opener.
function open() {
  opener = document.activeElement as HTMLElement | null;
  el.value?.showModal();
}
function close() { el.value?.close(); }
function onClose() {
  emit("close");
  if (opener?.isConnected) opener.focus();
  opener = null;
}
defineExpose({ open, close });
</script>

<template>
  <dialog ref="el" data-part="root" :data-variant="variant" data-backdrop-close @close="onClose">
    <h2 data-part="title">{{ title }}</h2>
    <p v-if="description" data-part="description">{{ description }}</p>
    <button v-if="variant !== 'confirm'" data-part="close" type="button" aria-label="Close" data-dialog-close>&times;</button>
    <slot />
    <div v-if="$slots.actions" data-part="actions"><slot name="actions" /></div>
  </dialog>
</template>

<style scoped src="./dialog.css"></style>
