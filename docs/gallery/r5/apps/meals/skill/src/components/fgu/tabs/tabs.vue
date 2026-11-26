<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance } from "vue";
import { attach } from "./tabs.behaviour.js";

withDefaults(defineProps<{ tabs?: string[]; label?: string }>(), { tabs: () => [] });
const uid = `fgu-tabs-${getCurrentInstance()?.uid ?? 0}`;
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-fgu="tabs" data-part="root">
    <div data-part="list" role="tablist" :aria-label="label">
      <button
        v-for="(tab, i) in tabs"
        :key="i"
        data-part="tab"
        type="button"
        role="tab"
        :id="uid + '-tab-' + i"
        :aria-selected="i === 0 ? 'true' : 'false'"
        :aria-controls="uid + '-panel-' + i"
        :tabindex="i === 0 ? 0 : -1"
      >
        {{ tab }}
      </button>
      <span data-part="indicator" aria-hidden="true"></span>
    </div>
    <div
      v-for="(tab, i) in tabs"
      :key="i"
      data-part="panel"
      :id="uid + '-panel-' + i"
      role="tabpanel"
      :aria-labelledby="uid + '-tab-' + i"
      tabindex="0"
      :hidden="i !== 0"
    >
      <slot name="panel" :tab="tab" :index="i" />
    </div>
  </div>
</template>

<style src="./tabs.css"></style>
