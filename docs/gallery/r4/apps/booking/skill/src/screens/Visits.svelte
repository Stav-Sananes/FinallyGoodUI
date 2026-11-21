<script>
import { onMount } from "svelte";
import Button from "../components/fgu/button/button.svelte";
import Dialog from "../components/fgu/dialog/dialog.svelte";
import Tabs from "../components/fgu/tabs/tabs.svelte";
import Icon from "../lib/Icon.svelte";
import Monogram from "../lib/Monogram.svelte";
import { dogById, serviceById, dayCard, duration, money, timeLabel } from "../lib/data.js";
import { app, cancelVisit, isLate, resetVisits, startBooking, toast } from "../lib/store.svelte.js";

let loading = $state(app.visitsLoading);
let target = $state(null);
let dialog = $state(null);

onMount(() => {
  if (!app.visitsLoading) return;
  const t = setTimeout(() => { app.visitsLoading = false; loading = false; }, 600); // pretend network time
  return () => clearTimeout(t);
});

const now = () => Date.now();
const upcoming = $derived(app.visits.filter((v) => v.status === "booked" && new Date(v.start).getTime() > now()).sort((a, b) => a.start.localeCompare(b.start)));
const past = $derived(app.visits.filter((v) => !(v.status === "booked" && new Date(v.start).getTime() > now())).sort((a, b) => b.start.localeCompare(a.start)));
const tabs = $derived([{ id: "upcoming", label: "Upcoming", count: upcoming.length }, { id: "past", label: "Past", count: past.length }]);

function ask(v) { target = v; }
function confirmCancel() {
  const name = dogById(target.dogId).name;
  cancelVisit(target.id);
  dialog?.close();
  toast(`${name}'s visit is cancelled.`);
  target = null;
}
function rebook(v) { startBooking({ dogId: v.dogId, serviceId: v.serviceId }); location.hash = "#/book/when"; }
</script>

{#snippet card(v, kind)}
  {@const dog = dogById(v.dogId)}
  {@const s = serviceById(v.serviceId)}
  {@const d = new Date(v.start)}
  <li class="visit" data-status={v.status}>
    <div class="visit-head">
      <Monogram {dog} />
      <div class="visit-main">
        <p class="visit-title">{s.name}, {dog.name}</p>
        <p class="visit-sub num">{dayCard(d)} at {timeLabel(d)} · {duration(v.minutes)}</p>
      </div>
      <p class="visit-price num">{money(v.price)}</p>
    </div>
    <div class="tear" aria-hidden="true"></div>
    <div class="visit-foot">
      {#if v.status === "cancelled"}
        <span class="status status-cancelled">Cancelled</span>
      {:else if kind === "upcoming"}
        <span class="status">{isLate(v) ? "Within 24 hours" : "Booked"}</span>
        <Button variant="ghost" data-dialog-open="cancel-visit" onclick={() => ask(v)}>Cancel visit</Button>
      {:else}
        <span class="status">Done</span>
        <Button variant="secondary" onclick={() => rebook(v)}>Book again</Button>
      {/if}
    </div>
  </li>
{/snippet}

<div class="page">
  <h1 class="display">My visits</h1>

  {#if loading}
    <div class="skeleton-list" aria-busy="true"><p class="sr-only">Loading your visits</p>{#each Array(3) as _, i (i)}<span class="skeleton skeleton-card" aria-hidden="true"></span>{/each}</div>
  {:else if app.visitsError}
    <div class="state">
      <p class="state-title"><Icon name="alert" size="sm" /> Couldn't read your saved visits</p>
      <p>The list stored on this phone is damaged. You can start again with the sample visits; nothing at the salon is affected.</p>
      <Button onclick={resetVisits}>Start again</Button>
    </div>
  {:else}
    <Tabs {tabs} label="My visits">
      {#snippet panel(id)}
        {#if id === "upcoming"}
          {#if upcoming.length === 0}
            <div class="state">
              <p class="state-title">No visits coming up</p>
              <p>Your next groom is a few taps away. Most dogs are due every 6 to 8 weeks.</p>
              <Button onclick={() => { startBooking({ serviceId: null }); location.hash = "#/book"; }}>Book a groom</Button>
            </div>
          {:else}
            <ul class="visits">{#each upcoming as v (v.id)}{@render card(v, "upcoming")}{/each}</ul>
          {/if}
        {:else if past.length === 0}
          <div class="state"><p class="state-title">No past visits yet</p><p>Finished grooms show up here, with a one-tap way to book the same again.</p></div>
        {:else}
          <ul class="visits">{#each past as v (v.id)}{@render card(v, "past")}{/each}</ul>
        {/if}
      {/snippet}
    </Tabs>
  {/if}
</div>

<Dialog id="cancel-visit" variant="confirm" bind:el={dialog} onclose={() => (target = null)}
  title={target ? `Cancel ${dogById(target.dogId).name}'s visit?` : "Cancel visit"}
  description={target ? (isLate(target) ? `It is within 24 hours, so you'll still pay half (${money(target.price / 2)}).` : "It is more than 24 hours away, so it's free to cancel.") : ""}>
  {#snippet actions()}
    <Button variant="secondary" data-dialog-close autofocus>Keep visit</Button>
    <Button variant="destructive" onclick={confirmCancel}>Cancel visit</Button>
  {/snippet}
</Dialog>
