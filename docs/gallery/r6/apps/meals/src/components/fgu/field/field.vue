<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance } from "vue";
import { attach } from "./field.behaviour.js";

defineOptions({ inheritAttrs: false });
withDefaults(defineProps<{ variant?: string; label?: string; hint?: string; error?: string; invalid?: boolean; disabled?: boolean; required?: boolean; type?: string; name?: string; id?: string; placeholder?: string; autocomplete?: string; rows?: number; multiline?: boolean; hideLabel?: boolean; modelValue?: string }>(), { variant: "stacked", invalid: false, disabled: false, required: false, type: "text", multiline: false, hideLabel: false });
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const uid = `fgu-field-${getCurrentInstance()?.uid ?? 0}`;
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-fgu="field" data-part="root" :data-variant="variant">
    <label data-part="label" :for="(id ? id : uid + '-control')" :data-hidden="hideLabel ? '' : undefined">{{ label }}</label>
    <p v-if="hint" data-part="hint" :id="uid + '-hint'">{{ hint }}</p>
    <textarea
      v-if="multiline"
      data-part="control"
      :id="(id ? id : uid + '-control')"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="(hint ? uid + '-hint ' : '') + uid + '-error'"
      :rows="rows"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement | HTMLTextAreaElement).value)"
      v-bind="$attrs"
    ></textarea>
    <input
      v-else
      data-part="control"
      :id="(id ? id : uid + '-control')"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="(hint ? uid + '-hint ' : '') + uid + '-error'"
      :type="type"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement | HTMLTextAreaElement).value)"
      v-bind="$attrs"
    />
    <p data-part="error" :id="uid + '-error'" aria-live="polite" :data-controlled="error ? '' : undefined">{{ error }}</p>
  </div>
</template>

<style src="./field.css"></style>
