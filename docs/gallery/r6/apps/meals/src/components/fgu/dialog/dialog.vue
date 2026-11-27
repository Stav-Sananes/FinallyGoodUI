<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance, watch } from "vue";
import { attach, openDialog, closeDialog } from "./dialog.behaviour.js";

const props = withDefaults(defineProps<{ variant?: string; open?: boolean; initialFocus?: string; nativeValidation?: boolean }>(), { variant: "modal", open: false, nativeValidation: false });
const emit = defineEmits<{ "update:open": [value: boolean] }>();
const uid = `fgu-dialog-${getCurrentInstance()?.uid ?? 0}`;
function onClose() {
  emit("update:open", false);
}
const el = ref<HTMLDialogElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
  if (props.open) openDialog(el.value);
});
onBeforeUnmount(() => detach?.());
watch(() => props.open, (value) => {
  if (!el.value) return;
  if (value) openDialog(el.value); else closeDialog(el.value);
});
</script>

<template>
  <dialog
    ref="el"
    data-fgu="dialog"
    data-part="root"
    :data-variant="variant"
    :aria-labelledby="uid + '-title'"
    :data-initial-focus="initialFocus"
    @close="onClose"
  >
    <h2 data-part="title" :id="uid + '-title'">
      <slot name="title" />
    </h2>
    <p v-if="$slots['description']" data-part="description">
      <slot name="description" />
    </p>
    <button data-part="close" type="button" aria-label="Close">&times;</button>
    <form data-part="form" method="dialog" :novalidate="!nativeValidation">
      <slot />
      <div v-if="$slots['actions']" data-part="actions">
        <slot name="actions" />
      </div>
    </form>
  </dialog>
</template>

<style src="./dialog.css"></style>
