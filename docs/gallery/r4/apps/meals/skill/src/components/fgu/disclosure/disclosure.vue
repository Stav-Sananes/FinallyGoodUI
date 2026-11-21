<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./disclosure.behaviour.js";

let counter = 0;
const props = withDefaults(defineProps<{ variant?: string; open?: boolean; disabled?: boolean }>(), { variant: "multiple", open: false, disabled: false });
const id = `fgu-disclosure-${++counter}-${Math.random().toString(36).slice(2, 7)}`;
const el = ref<HTMLElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => { if (el.value) detach = attach(el.value); });
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-part="root" :data-variant="variant">
    <div data-part="item">
      <h3 data-part="heading">
        <button data-part="trigger" type="button" :id="`${id}-trigger`" :aria-expanded="open ? 'true' : 'false'" :aria-controls="`${id}-panel`" :disabled="disabled">
          <span><slot name="trigger" /></span>
          <span data-part="indicator" aria-hidden="true"></span>
        </button>
      </h3>
      <div data-part="panel" role="region" :id="`${id}-panel`" :aria-labelledby="`${id}-trigger`">
        <div data-part="content"><slot /></div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./disclosure.css"></style>
