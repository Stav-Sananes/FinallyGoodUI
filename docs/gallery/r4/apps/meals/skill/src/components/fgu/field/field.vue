<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./field.behaviour.js";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ variant?: string; label: string; hint?: string; modelValue?: string; invalid?: boolean; required?: boolean; disabled?: boolean }>(), { variant: "stacked", modelValue: "", invalid: false, required: false, disabled: false });
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const el = ref<HTMLElement | null>(null);
const control = ref<HTMLInputElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => { if (el.value) detach = attach(el.value); });
onBeforeUnmount(() => detach?.());
defineExpose({ focus: () => control.value?.focus(), validate: () => control.value?.reportValidity() ?? true, control });
</script>

<template>
  <div ref="el" data-part="root" :data-variant="variant">
    <label data-part="label">{{ label }}</label>
    <p v-if="hint" data-part="hint">{{ hint }}</p>
    <input ref="control" data-part="control" type="text" v-bind="$attrs" :aria-invalid="invalid ? 'true' : undefined" :value="modelValue" :required="required" :disabled="disabled" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
    <p data-part="error"></p>
  </div>
</template>

<style scoped src="./field.css"></style>
