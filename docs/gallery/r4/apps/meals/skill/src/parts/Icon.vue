<script setup lang="ts">
// One icon family, 24-unit grid, stroke width from the --icon-stroke token (craft.real-imagery-and-icons).
const PATHS: Record<string, string> = {
  calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  basket: "M3 10h18l-1.6 9a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8L3 10zM8 10l3-6M16 10l-3-6",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h10",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  plus: "M12 5v14M5 12h14",
  copy: "M9 9h10v11H9zM5 15V5a1 1 0 0 1 1-1h9",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2",
  alert: "M12 4 3 20h18L12 4zM12 10v4M12 17h.01",
  refresh: "M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5",
  leaf: "M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19c2-4 5-7 9-9",
};
defineProps<{ name: string }>();
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path :d="PATHS[name]" :stroke-width="name === 'dots' ? 3.5 : undefined" />
  </svg>
</template>

<style scoped>
.icon { inline-size: var(--icon-md); block-size: var(--icon-md); stroke-width: var(--icon-stroke); flex: none; }
</style>
