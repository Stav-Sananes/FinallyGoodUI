<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { attach } from "./tabs.behaviour.js";

import type { TabItem } from "../types";
const props = defineProps<{ label: string; tabs: TabItem[]; selected?: string }>();
const emit = defineEmits<{ change: [id: string] }>();
const el = ref<HTMLElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => { if (el.value) detach = attach(el.value); });
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-part="root">
    <div data-part="list" role="tablist" :aria-label="label">
      <button v-for="t in tabs" :key="t.id" data-part="tab" type="button" :aria-selected="t.id === (selected ?? tabs[0].id) ? 'true' : 'false'" @click="emit('change', t.id)">{{ t.label }}</button>
      <span data-part="indicator" aria-hidden="true"></span>
    </div>
    <div v-for="t in tabs" :key="`p-${t.id}`" data-part="panel"><slot :name="`panel-${t.id}`" /></div>
  </div>
</template>

<style scoped src="./tabs.css"></style>
