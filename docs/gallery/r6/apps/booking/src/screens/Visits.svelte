<script>
  import RecordRow from '../components/fgu/record-row/record-row.svelte';
  import Button from '../components/fgu/button/button.svelte';
  import Dialog from '../components/fgu/dialog/dialog.svelte';
  import { pushToast, dismissToast } from '../components/fgu/toast/toast-store.js';
  import Icon from '../lib/Icon.svelte';
  import { app, setStatus } from '../lib/state.svelte.js';
  import { route, go } from '../lib/router.svelte.js';
  import { loadList } from '../lib/api.js';
  import { slotClock, clock, slotMinutes, STEP } from '../lib/schedule.js';
  import { dayMid, dayLong } from '../lib/dates.js';
  import { groomerById, money } from '../lib/data.js';

  const forced = $derived(route.q.state);
  let status = $state('loading');
  function fetchIt() {
    status = 'loading';
    loadList(forced).then(() => (status = 'ready')).catch(() => (status = 'error'));
  }
  $effect(() => { forced; fetchIt(); });

  const list = $derived(forced === 'empty' ? [] : app.bookings);
  const upcoming = $derived(list.filter((b) => b.status === 'booked').sort((a, b) => (a.day + a.s).localeCompare(b.day + b.s)));
  const past = $derived(list.filter((b) => b.status === 'done').sort((a, b) => b.day.localeCompare(a.day)));

  let cancelling = $state(null);
  let open = $state(false);
  function askCancel(b) { cancelling = b; open = true; }
  function doCancel() {
    const b = cancelling;
    setStatus(b.id, 'cancelled');
    open = false;
    const id = pushToast({
      message: `${b.dogName}’s ${b.serviceName.toLowerCase()} on ${dayMid(b.day)} is cancelled.`,
      action: 'Undo', timeout: 8000,
      onAction: () => { setStatus(b.id, 'booked'); dismissToast(id); },
    });
  }
  function rebook(b) { app.dogId = b.dogId; app.serviceId = b.serviceId; app.pick = null; go('book'); }
</script>

<section class="listing" aria-labelledby="visits-title">
  <h1 id="visits-title" class="screen-title">Your visits</h1>

  {#if status === 'loading'}
    <ul class="rows" aria-busy="true" aria-label="Loading visits">
      {#each [0, 1, 2, 3] as i (i)}<li class="row-skeleton"></li>{/each}
    </ul>
  {:else if status === 'error'}
    <div class="empty-block" role="alert">
      <span class="stripe" aria-hidden="true"></span>
      <p class="state-title">Your visits didn’t load.</p>
      <Button variant="primary" onclick={fetchIt}>{#snippet icon()}<Icon name="refresh" size="sm" />{/snippet}Try again</Button>
    </div>
  {:else if !upcoming.length && !past.length}
    <div class="empty-block">
      <span class="stripe" aria-hidden="true"></span>
      <p class="state-title">No visits yet.</p>
      <p>Once you book, upcoming grooms are listed here, and you can cancel or rebook in one tap.</p>
      <Button variant="primary" onclick={() => go('book')}>Pick a time</Button>
    </div>
  {:else}
    <h2 class="group-title">Coming up</h2>
    {#if upcoming.length}
      <ul class="rows">
        {#each upcoming as b (b.id)}
          <RecordRow current>
            {#snippet lead()}{dayMid(b.day)}{/snippet}
            {b.dogName}: {b.serviceName}
            {#snippet meta()}{slotClock(b.s)} to {clock(slotMinutes(b.s) + b.len * STEP)} with {groomerById(b.lane).first}{/snippet}
            {#snippet status()}Booked · {money(b.price)}{/snippet}
            {#snippet action()}<Button variant="secondary" onclick={() => askCancel(b)}>Cancel visit</Button>{/snippet}
          </RecordRow>
        {/each}
      </ul>
    {:else}
      <p class="quiet">Nothing booked. <Button variant="ghost" onclick={() => go('book')}>Pick a time</Button></p>
    {/if}

    <h2 class="group-title">Past</h2>
    <ul class="rows">
      {#each past as b (b.id)}
        <RecordRow>
          {#snippet lead()}{dayMid(b.day)}{/snippet}
          {b.dogName}: {b.serviceName}
          {#snippet meta()}with {groomerById(b.lane).first}{b.notes ? ' · ' + b.notes : ''}{/snippet}
          {#snippet status()}Done · {money(b.price)}{/snippet}
          {#snippet action()}<Button variant="secondary" onclick={() => rebook(b)}>Book again</Button>{/snippet}
        </RecordRow>
      {/each}
    </ul>
  {/if}
</section>

<Dialog bind:open>
  {#snippet title()}Cancel this visit?{/snippet}
  {#snippet description()}{#if cancelling}{cancelling.dogName}’s {cancelling.serviceName.toLowerCase()}, {dayLong(cancelling.day)} at {slotClock(cancelling.s)}. It’s free to cancel; you can undo straight after.{/if}{/snippet}
  {#snippet actions()}
    <Button variant="secondary" onclick={() => (open = false)}>Keep it</Button>
    <Button variant="destructive" onclick={doCancel}>Cancel visit</Button>
  {/snippet}
</Dialog>
