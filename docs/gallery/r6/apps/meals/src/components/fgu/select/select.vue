<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance, watch } from "vue";
import { attach, selectValue } from "./select.behaviour.js";

const props = withDefaults(defineProps<{ variant?: string; options?: { value: string; label: string; disabled?: boolean }[]; value?: string; label?: string; hideLabel?: boolean; placeholder?: string; name?: string; searchable?: boolean; emptyText?: string; invalid?: boolean; disabled?: boolean }>(), { variant: "listbox", options: () => [], hideLabel: false, searchable: false, emptyText: "No matches", invalid: false, disabled: false });
const emit = defineEmits<{ "update:value": [value: string]; "update:modelValue": [value: string] }>();
const uid = `fgu-select-${getCurrentInstance()?.uid ?? 0}`;
function onSelectchange(event: Event) {
  emit("update:value", (event as CustomEvent<string>).detail);
  emit("update:modelValue", (event as CustomEvent<string>).detail);
}
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
  if (props.value !== undefined) selectValue(el.value, props.value);
});
onBeforeUnmount(() => detach?.());
watch(() => props.value, (value) => {
  if (el.value && value !== undefined) selectValue(el.value, value);
});
</script>

<template>
  <div ref="el" data-fgu="select" data-part="root" :data-variant="variant" @selectchange="onSelectchange">
    <label
      data-part="label"
      :id="uid + '-label'"
      :for="uid + '-trigger'"
      :data-hidden="hideLabel ? '' : undefined"
    >{{ label }}</label>
    <select
      v-if="variant === 'native'"
      data-part="control"
      :id="uid + '-trigger'"
      :name="name"
      :value="value"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
    >
      <option v-for="(o) in options" :key="o.value" data-part="option" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
    </select>
    <button
      v-else
      data-part="trigger"
      type="button"
      :id="uid + '-trigger'"
      role="combobox"
      :aria-labelledby="uid + '-label ' + uid + '-trigger'"
      aria-haspopup="listbox"
      aria-expanded="false"
      :aria-controls="uid + '-list'"
      :popovertarget="uid + '-list'"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
    >
      <span data-part="display" :data-placeholder="placeholder"></span>
    </button>
    <div
      v-if="variant !== 'native'"
      data-part="listbox"
      :id="uid + '-list'"
      role="listbox"
      :aria-labelledby="uid + '-trigger'"
      popover
    >
      <input v-if="searchable" data-part="search" type="search" :aria-label="label" autocomplete="off" />
      <div
        v-for="(o) in options"
        :key="o.value"
        data-part="option"
        role="option"
        tabindex="-1"
        :data-value="o.value"
        :aria-selected="o.value === value ? 'true' : 'false'"
        :aria-disabled="o.disabled ? 'true' : undefined"
      >{{ o.label }}</div>
      <div data-part="empty" role="status" hidden>{{ emptyText }}</div>
    </div>
    <input v-if="variant !== 'native'" data-part="value" type="hidden" :name="name" :value="value" />
  </div>
</template>

<style src="./select.css"></style>
