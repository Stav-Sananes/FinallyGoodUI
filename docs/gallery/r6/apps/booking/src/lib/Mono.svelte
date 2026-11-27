<script>
  // Monogram disc: initials on a tile colour, never a drawn placeholder photo.
  let { name, hue = 195, size = 28 } = $props();
  const initials = $derived(name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase());
</script>

<span class="mono" style="--hue:{hue}; --d:{size}px" aria-hidden="true">{initials}</span>

<style>
  .mono {
    display: inline-grid; place-items: center; flex: none;
    inline-size: var(--d); block-size: var(--d); border-radius: var(--radius-full);
    background: oklch(0.82 0.07 var(--hue)); color: oklch(0.25 0.06 var(--hue));
    font: 700 var(--text-xs) / 1 var(--font-display); letter-spacing: 0.02em;
  }
  @media (prefers-color-scheme: dark) {
    .mono { background: oklch(0.42 0.07 var(--hue)); color: oklch(0.95 0.03 var(--hue)); }
  }
</style>
