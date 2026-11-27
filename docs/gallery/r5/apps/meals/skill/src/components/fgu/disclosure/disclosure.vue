<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance } from "vue";
import { attach } from "./disclosure.behaviour.js";

withDefaults(defineProps<{ variant?: string; open?: boolean; disabled?: boolean }>(), { variant: "multiple", open: false, disabled: false });
const uid = `fgu-disclosure-${getCurrentInstance()?.uid ?? 0}`;
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-fgu="disclosure" data-part="root" :data-variant="variant">
    <div data-part="item">
      <h3 data-part="heading">
        <button
          data-part="trigger"
          type="button"
          :id="uid + '-trigger'"
          :aria-expanded="open ? 'true' : 'false'"
          :aria-controls="uid + '-panel'"
          :disabled="disabled"
        >
          <span>
            <slot name="trigger" />
          </span>
          <span data-part="indicator" aria-hidden="true"></span>
        </button>
      </h3>
      <div data-part="panel" :id="uid + '-panel'" role="region" :aria-labelledby="uid + '-trigger'">
        <div data-part="content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./disclosure.css"></style>
