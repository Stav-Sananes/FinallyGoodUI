<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance, watch } from "vue";
import { attach, selectTab } from "./tabs.behaviour.js";

const props = withDefaults(defineProps<{ tabs?: string[]; label?: string; selected?: number }>(), { tabs: () => [] });
const emit = defineEmits<{ change: [value: number]; "update:selected": [value: number] }>();
const uid = `fgu-tabs-${getCurrentInstance()?.uid ?? 0}`;
function onTabchange(event: Event) {
  emit("change", (event as CustomEvent<number>).detail);
  emit("update:selected", (event as CustomEvent<number>).detail);
}
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
  if (props.selected !== undefined) selectTab(el.value, props.selected);
});
onBeforeUnmount(() => detach?.());
watch(() => props.selected, (value) => {
  if (el.value && value !== undefined) selectTab(el.value, value);
});
</script>

<template>
  <div ref="el" data-fgu="tabs" data-part="root" @tabchange="onTabchange">
    <div data-part="list" role="tablist" :aria-label="label">
      <button
        v-for="(tab, i) in tabs"
        :key="i"
        data-part="tab"
        type="button"
        role="tab"
        :id="uid + '-tab-' + i"
        :aria-selected="i === (selected ? selected : 0) ? 'true' : 'false'"
        :aria-controls="uid + '-panel-' + i"
        :tabindex="i === (selected ? selected : 0) ? 0 : -1"
      >{{ tab }}</button>
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
      :hidden="i !== (selected ? selected : 0)"
    >
      <slot name="panel" :tab="tab" :index="i" />
    </div>
  </div>
</template>

<style src="./tabs.css"></style>
