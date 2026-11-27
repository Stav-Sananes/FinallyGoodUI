<script>
  import RecordRow from '../components/fgu/record-row/record-row.svelte';
  import Select from '../components/fgu/select/select.svelte';
  import Button from '../components/fgu/button/button.svelte';
  import Dur from '../lib/Dur.svelte';
  import Icon from '../lib/Icon.svelte';
  import { app, dogs, services } from '../lib/state.svelte.js';
  import { route, go } from '../lib/router.svelte.js';
  import { loadList } from '../lib/api.js';
  import { minutesFor, priceFor, dogById, money } from '../lib/data.js';

  const forced = $derived(route.q.state);
  let status = $state('loading');
  function fetchIt() {
    status = 'loading';
    loadList(forced).then(() => (status = 'ready')).catch(() => (status = 'error'));
  }
  $effect(() => { forced; fetchIt(); });

  const dog = $derived(dogById(app.dogId));
  const dogOptions = dogs.map((d) => ({ value: d.id, label: `${d.name}, ${d.size}` }));
  function book(id) { app.serviceId = id; go('book'); }
</script>

<section class="listing" aria-labelledby="services-title">
  <h1 id="services-title" class="screen-title">What we do for <em>{dog.name}</em></h1>
  <div class="pickers one"><Select label="Prices and times for" options={dogOptions} bind:value={app.dogId} /></div>

  {#if status === 'loading'}
    <ul class="rows" aria-busy="true" aria-label="Loading services">
      {#each [0, 1, 2, 3, 4, 5] as i (i)}<li class="row-skeleton"></li>{/each}
    </ul>
  {:else if status === 'error'}
    <div class="empty-block" role="alert">
      <span class="stripe" aria-hidden="true"></span>
      <p class="state-title">The service list didn’t load.</p>
      <Button variant="primary" onclick={fetchIt}>{#snippet icon()}<Icon name="refresh" size="sm" />{/snippet}Try again</Button>
    </div>
  {:else}
    <ul class="rows">
      {#each services as s (s.id)}
        <RecordRow current={s.id === app.serviceId}>
          {#snippet lead()}<Dur min={minutesFor(s, dog)} />{/snippet}
          {s.name}
          {#snippet meta()}{s.blurb}{/snippet}
          {#snippet status()}{money(priceFor(s, dog))}{/snippet}
          {#snippet action()}<Button variant={s.id === app.serviceId ? 'primary' : 'secondary'} onclick={() => book(s.id)}>Pick a time</Button>{/snippet}
        </RecordRow>
      {/each}
    </ul>
  {/if}
</section>
