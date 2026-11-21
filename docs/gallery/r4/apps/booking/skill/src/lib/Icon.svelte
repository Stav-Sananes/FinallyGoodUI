<script>
// One icon family: 24px grid, 1.75 stroke, round caps. Hand-set glyphs, no icon package.
let { name, size = "md" } = $props();
const PATHS = {
  paw: "M7.5 11.5c-1.2 0-2-1-2-2.3s.9-2.5 2-2.5 2 1.1 2 2.4-.8 2.4-2 2.4zm9 0c-1.2 0-2-1-2-2.3s.9-2.5 2-2.5 2 1.1 2 2.4-.8 2.4-2 2.4zM12 9c-1.2 0-2-1.1-2-2.5S10.8 4 12 4s2 1.1 2 2.5S13.200 9 12 9zm0 3c-2.600 0-5 3-5 5.200 0 1.500 1.300 2.300 2.600 2.300 1 0 1.600-.4 2.400-.4s1.400.4 2.400.4c1.300 0 2.600-.8 2.600-2.300C17 15 14.600 12 12 12z",
  calendar: "M5 6.500h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.500a1 1 0 0 1 1-1zM4 11h16M8 4v4M16 4v4",
  clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 7.500V12l3 2",
  back: "M15 5l-7 7 7 7",
  check: "M5 12.500l4.500 4.500L19 7.500",
  list: "M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01",
  alert: "M12 8v5M12 16.500h.01M10.300 4.300L3.200 17a2 2 0 0 0 1.700 3h14.200a2 2 0 0 0 1.700-3L13.700 4.300a2 2 0 0 0-3.400 0z",
  wifi: "M3 9.500a14 14 0 0 1 18 0M6 13a9.500 9.500 0 0 1 12 0M9.200 16.400a5 5 0 0 1 5.600 0M12 19.500h.01M4 4l16 16",
};
</script>

<svg class="icon icon-{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
