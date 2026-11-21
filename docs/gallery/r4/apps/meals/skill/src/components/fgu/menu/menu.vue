<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./menu.behaviour.js";

import type { MenuItem } from "../types";
const props = defineProps<{ label: string; items: MenuItem[] }>();
const emit = defineEmits<{ select: [value: string] }>();
const el = ref<HTMLElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => { if (el.value) detach = attach(el.value); });
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-part="root">
    <button data-part="trigger" type="button" :aria-label="label"><slot /></button>
    <div data-part="list" role="menu">
      <button v-for="item in items" :key="item.value" data-part="item" type="button" :aria-disabled="item.disabled ? 'true' : undefined" @click="!item.disabled && emit('select', item.value)">{{ item.label }}</button>
    </div>
  </div>
</template>

<style scoped src="./menu.css"></style>
