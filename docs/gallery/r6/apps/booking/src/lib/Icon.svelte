<script>
  let { name, size = 'md' } = $props();
</script>

<svg class="icon" data-size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  {#if name === 'clock'}
    <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
  {:else if name === 'scissors'}
    <circle cx="6.5" cy="6.5" r="2.5" /><circle cx="6.5" cy="17.5" r="2.5" /><path d="M8.5 8 20 18M8.5 16 20 6" />
  {:else if name === 'tag'}
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h6.2a1.5 1.5 0 0 1 1.06.44l6.3 6.3a1.5 1.5 0 0 1 0 2.12l-6.2 6.2a1.5 1.5 0 0 1-2.12 0l-6.3-6.3A1.5 1.5 0 0 1 4 11.7z" /><circle cx="8.5" cy="8.5" r="1.2" />
  {:else if name === 'calendar'}
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  {:else if name === 'check'}
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  {:else if name === 'refresh'}
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
  {:else if name === 'arrow'}
    <path d="M5 12h14M13 6l6 6-6 6" />
  {:else if name === 'paw'}
    <ellipse cx="12" cy="16" rx="4.5" ry="3.5" /><circle cx="5.5" cy="11.5" r="1.6" /><circle cx="18.5" cy="11.5" r="1.6" /><circle cx="9" cy="6.5" r="1.6" /><circle cx="15" cy="6.5" r="1.6" />
  {/if}
</svg>

<style>
  .icon { inline-size: var(--icon-md); block-size: var(--icon-md); stroke-width: var(--icon-stroke); flex: none; }
  .icon[data-size='sm'] { inline-size: var(--icon-sm); block-size: var(--icon-sm); }
  .icon[data-size='lg'] { inline-size: var(--icon-lg); block-size: var(--icon-lg); }
</style>
