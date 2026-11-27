<script>
  // A duration with muted units: 135 -> 2h 15
  let { min } = $props();
  const h = $derived(Math.floor(min / 60));
  const m = $derived(min % 60);
</script>

<span class="dur">{#if h}<b>{h}</b><i>h</i>{/if}{#if m}<b>{m}</b><i>{h ? '' : ' min'}</i>{/if}</span>

<style>
  .dur { font-variant-numeric: tabular-nums; white-space: nowrap; }
  b { font-weight: inherit; }
  i { font-style: normal; color: var(--color-muted-foreground); }
</style>
