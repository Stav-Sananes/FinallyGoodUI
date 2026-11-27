<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./toggle.behaviour.js";

const props = withDefaults(defineProps<{ variant?: string; modelValue?: boolean; disabled?: boolean; invalid?: boolean; name?: string; value?: string }>(), { variant: "checkbox", modelValue: false, disabled: false, invalid: false });
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const el = ref<HTMLElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => { if (el.value) detach = attach(el.value); });
onBeforeUnmount(() => detach?.());
</script>

<template>
  <label ref="el" data-part="root" :data-variant="variant">
    <input data-part="control" type="checkbox" :name="name" :value="value" :checked="modelValue" :disabled="disabled" :aria-invalid="invalid ? 'true' : undefined" @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />
    <span data-part="label"><slot /></span>
  </label>
</template>

<style scoped src="./toggle.css"></style>
