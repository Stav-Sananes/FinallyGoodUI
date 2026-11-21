<script>
import { untrack } from "svelte";
import Button from "../components/fgu/button/button.svelte";
import Choice from "../lib/Choice.svelte";
import Icon from "../lib/Icon.svelte";
import Ticket from "../lib/Ticket.svelte";
import { dayShort, dayNum, dayLong, isoDay, parseISODay, duration, money, timeLabel } from "../lib/data.js";
import { loadSlots, isClosed } from "../lib/slots.js";
import { app, dog, service, minutes, price, bookedBlocks } from "../lib/store.svelte.js";

let { online = true } = $props();

const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return { iso: isoDay(d), date: d }; });
let state = $state({ status: "idle", slots: [], closed: false, anyFree: true, error: "" });
let seq = 0;

async function load(iso) {
  const mine = ++seq;
  state.status = "loading";
  try {
    const res = await loadSlots(iso, minutes(), bookedBlocks());
    if (mine !== seq) return;
    Object.assign(state, { status: "ready", slots: res.slots, closed: res.closed, anyFree: res.anyFree ?? true, error: "" });
  } catch (e) {
    if (mine !== seq) return;
    state.status = "error";
    state.error = e.message === "offline" ? "You are offline, so we can't see the diary." : "The diary didn't answer. Nothing you picked is lost.";
  }
}

function pickDay(iso) {
  app.dayISO = iso;
  app.slot = null;
  load(iso);
}
function pickSlot(s) { app.slot = s; }

$effect(() => {
  untrack(() => {
    if (!app.dayISO) app.dayISO = days.find((d) => !isClosed(d.iso))?.iso ?? days[0].iso;
    load(app.dayISO);
  });
});

const nextRoomy = $derived(days.find((d) => d.iso > app.dayISO && !isClosed(d.iso)));
const morning = $derived(state.slots.filter((s) => s.block < 7));
const afternoon = $derived(state.slots.filter((s) => s.block >= 7));
const slotDate = (s) => { const d = parseISODay(app.dayISO); const [h, m] = s.time.split(":").map(Number); d.setHours(h, m); return d; };
const dayDate = $derived(parseISODay(app.dayISO));
</script>

<div class="page when">
  <a class="back" href="#/book"><Icon name="back" size="sm" /> Change groom</a>
  <h1 class="display">Pick a time for {dog().name}</h1>
  <p class="lede">{service().name}, about {duration(minutes())}. Times shown have that long free.</p>

  {#if app.conflict}
    <p class="notice notice-error" role="alert"><Icon name="alert" size="sm" /> {app.conflict}</p>
  {/if}

  <div class="stage">
    <Ticket label="Choose a day and time" tone="card">
      {#snippet head()}
        <fieldset class="group"><legend class="sr-only">Day</legend>
        <div class="daystrip">
          {#each days as d (d.iso)}
            <Choice class="day" name="day" checked={app.dayISO === d.iso} onpick={() => pickDay(d.iso)} label={dayLong(d.date) + (isClosed(d.iso) ? ", closed" : "")} data-closed={isClosed(d.iso)}>
              <span class="day-name">{dayShort(d.date)}</span>
              <span class="day-num num">{dayNum(d.date)}</span>
            </Choice>
          {/each}
        </div></fieldset>
      {/snippet}
      {#snippet stub()}
        <div class="slots" aria-live="polite" aria-busy={state.status === "loading"}>
          {#if state.status === "loading"}
            <p class="sr-only">Loading times for {dayLong(dayDate)}</p>
            <div class="skeleton-grid" aria-hidden="true">{#each Array(9) as _, i (i)}<span class="skeleton"></span>{/each}</div>
          {:else if state.status === "error"}
            <div class="state">
              <p class="state-title"><Icon name={online ? "alert" : "wifi"} size="sm" /> Couldn't load times</p>
              <p>{state.error}</p>
              <Button variant="secondary" onclick={() => load(app.dayISO)}>Try again</Button>
            </div>
          {:else if state.closed}
            <div class="state">
              <p class="state-title">Closed on {dayLong(dayDate).split(" ")[0]}s</p>
              <p>We groom Monday to Saturday, 8:30am to 5pm.</p>
              {#if nextRoomy}<Button variant="secondary" onclick={() => pickDay(nextRoomy.iso)}>See {dayShort(nextRoomy.date)} {dayNum(nextRoomy.date)}</Button>{/if}
            </div>
          {:else if state.slots.length === 0}
            <div class="state">
              <p class="state-title">Nothing fits {duration(minutes())} on {dayLong(dayDate)}</p>
              <p>{state.anyFree ? "There are gaps, but none long enough for this groom." : "The day is fully booked."} Try another day{nextRoomy ? "" : " or a shorter groom"}.</p>
              {#if nextRoomy}<Button variant="secondary" onclick={() => pickDay(nextRoomy.iso)}>Try {dayShort(nextRoomy.date)} {dayNum(nextRoomy.date)}</Button>{/if}
            </div>
          {:else}
            {#each [["Morning", morning], ["Afternoon", afternoon]] as [name, list] (name)}
              {#if list.length}
                <fieldset class="group"><legend class="label">{name}</legend>
                <ul class="slotgrid">
                  {#each list as s (s.time)}
                    <li><Choice class="slot" name="slot" checked={app.slot?.time === s.time} onpick={() => pickSlot(s)} label={timeLabel(slotDate(s))}><span class="num">{timeLabel(slotDate(s))}</span></Choice></li>
                  {/each}
                </ul></fieldset>
              {/if}
            {/each}
          {/if}
        </div>
      {/snippet}
    </Ticket>

    <aside class="rail" aria-label="Your groom">
      <Ticket label="Summary" tone="muted">
        {#snippet head()}
          <p class="label">Your groom</p>
          <p class="summary-line"><strong>{service().name}</strong></p>
          <p class="summary-line">{dog().name}, {dog().breed}</p>
          <p class="summary-line num">{money(price())} · {duration(minutes())}</p>
        {/snippet}
        {#snippet stub()}
          {#if app.slot}
            <p class="label">Your time</p>
            <p class="summary-big">{dayLong(slotDate(app.slot))}</p>
            <p class="summary-big num">{timeLabel(slotDate(app.slot))} with {app.slot.groomer}</p>
          {:else}
            <p class="label">Your time</p>
            <p class="muted">Tap a time to hold it here.</p>
          {/if}
        {/snippet}
      </Ticket>
    </aside>
  </div>

  <div class="actionbar">
    <p class="actionbar-note" aria-live="polite">
      {#if app.slot}{dayLong(slotDate(app.slot))} at <span class="num">{timeLabel(slotDate(app.slot))}</span>{:else}Pick a time to continue.{/if}
    </p>
    <Button disabled={!app.slot} onclick={() => { app.conflict = null; location.hash = "#/book/review"; }}>Review</Button>
  </div>
</div>
