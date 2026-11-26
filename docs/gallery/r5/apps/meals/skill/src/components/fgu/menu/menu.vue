<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, getCurrentInstance } from "vue";
import { attach } from "./menu.behaviour.js";

withDefaults(defineProps<{ items?: { label: string; disabled?: boolean; onSelect?: (item: { label: string }) => void }[] }>(), { items: () => [] });
const uid = `fgu-menu-${getCurrentInstance()?.uid ?? 0}`;
const el = ref<HTMLDivElement | null>(null);
let detach: (() => void) | undefined;
onMounted(() => {
  if (!el.value) return;
  detach = attach(el.value);
});
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="el" data-fgu="menu" data-part="root">
    <button
      data-part="trigger"
      type="button"
      :id="uid + '-trigger'"
      aria-haspopup="menu"
      aria-expanded="false"
      :aria-controls="uid + '-list'"
      :popovertarget="uid + '-list'"
    >
      <slot />
    </button>
    <div data-part="list" :id="uid + '-list'" role="menu" :aria-labelledby="uid + '-trigger'" popover>
      <button
        v-for="(item, i) in items"
        :key="i"
        data-part="item"
        type="button"
        role="menuitem"
        tabindex="-1"
        :aria-disabled="item.disabled ? 'true' : undefined"
        @click="item.onSelect && item.onSelect(item)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<style src="./menu.css"></style>
