<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./toggle.behaviour.js";

defineOptions({ inheritAttrs: false });
withDefaults(defineProps<{ variant?: string; checked?: boolean; disabled?: boolean; invalid?: boolean; name?: string; value?: string }>(), { variant: "checkbox", checked: false, disabled: false, invalid: false });
const el = ref<HTMLLabelElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <label ref="el" data-fgu="toggle" data-part="root" :data-variant="variant">
    <input
      data-part="control"
      type="checkbox"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :role="variant === 'switch' ? 'switch' : undefined"
      v-bind="$attrs"
    />
    <span data-part="label">
      <slot />
    </span>
  </label>
</template>

<style src="./toggle.css"></style>
