<script>
  import { untrack } from 'svelte';
  import Tabs from '../components/fgu/tabs/tabs.svelte';
  import Select from '../components/fgu/select/select.svelte';
  import Button from '../components/fgu/button/button.svelte';
  import DayTape from '../lib/DayTape.svelte';
  import Dur from '../lib/Dur.svelte';
  import Mono from '../lib/Mono.svelte';
  import Icon from '../lib/Icon.svelte';
  import { app, days, currentDog, currentService, currentMinutes, currentLen, currentPrice, dogs, services } from '../lib/state.svelte.js';
  import { route, go, replaceQuery } from '../lib/router.svelte.js';
  import { loadDay } from '../lib/api.js';
  import { dayData, withMine, validStarts, earliest, slotClock, clock, slotMinutes, STEP, OPEN } from '../lib/schedule.js';
  import { dayShort, dayLong, dayMid } from '../lib/dates.js';
  import { money } from '../lib/data.js';

  // Restore what the link says (shared or reloaded), once.
  const q = route.q;
  if (q.day && days.includes(q.day)) app.day = q.day;
  if (q.svc) app.serviceId = q.svc;
  if (q.dog) app.dogId = q.dog;
  if (q.at) {
    const [lane, hhmm] = q.at.split('-');
    const min = Number(hhmm?.slice(0, 2)) * 60 + Number(hhmm?.slice(2));
    if (lane && Number.isFinite(min)) app.pick = { lane, s: (min - OPEN) / STEP };
  }

  const forced = $derived(route.q.state);
  let status = $state('loading');
  let data = $state(null);
  let token = 0;

  function fetchDay() {
    const mine = ++token;
    status = 'loading';
    loadDay(app.day, forced)
      .then((d) => { if (mine === token) { data = d; status = 'ready'; } })
      .catch(() => { if (mine === token) status = 'error'; });
  }
  $effect(() => {
    app.day; forced;
    untrack(fetchDay);
  });

  const view = $derived(data ? withMine(data, app.bookings, app.day) : null);
  const len = $derived(currentLen());
  const dog = $derived(currentDog());
  const service = $derived(currentService());
  const noOpenings = $derived(!!view && (view.closed || !view.lanes.some((l) => validStarts(l.blocks, len).length)));

  // The pick must stay a start that fits; when the groom's length changes, move to the earliest that does.
  $effect(() => {
    if (status !== 'ready' || !view) return;
    const l = len;
    const ok = app.pick && view.lanes.some((x) => x.id === app.pick.lane && validStarts(x.blocks, l).includes(app.pick.s));
    if (!ok) untrack(() => { app.pick = earliest(view, l); });
  });

  $effect(() => {
    const p = app.pick;
    replaceQuery({
      day: app.day, svc: app.serviceId, dog: app.dogId,
      at: p ? `${p.lane}-${slotClock(p.s).replace(':', '')}` : undefined,
    });
  });

  // Where the next opening is, for the empty state.
  const nextOpening = $derived.by(() => {
    if (!noOpenings) return null;
    for (const d of days) {
      if (d <= app.day) continue;
      const found = earliest(withMine(dayData(d), app.bookings, d), len);
      if (found) return { day: d, ...found };
    }
    return null;
  });

  const dayIdx = $derived(Math.max(0, days.indexOf(app.day)));
  const dayLabels = days.map(dayShort);
  const dogOptions = dogs.map((d) => ({ value: d.id, label: `${d.name}, ${d.breed}` }));
  const serviceOptions = $derived(services.map((s) => ({ value: s.id, label: s.name })));

  const laneFirst = $derived(view?.lanes.find((l) => l.id === app.pick?.lane)?.first ?? '');
  const endMin = $derived(app.pick ? slotMinutes(app.pick.s) + len * STEP : 0);

  function onpick(lane, s) { app.pick = { lane, s }; }
  function jump() {
    if (!nextOpening) return;
    app.day = nextOpening.day;
    app.pick = { lane: nextOpening.lane, s: nextOpening.s };
  }
</script>

<section class="book" aria-labelledby="book-title">
  <div class="book-main">
    <h1 id="book-title" class="screen-title">Pick a time for <em>{dog.name}</em>’s groom</h1>

    <div class="pickers">
      <Select label="Dog" options={dogOptions} bind:value={app.dogId} />
      <Select label="Groom" options={serviceOptions} bind:value={app.serviceId} />
    </div>
    <p class="length-note"><Mono name={dog.name} size={22} /><span>{service.name} for a {dog.size} dog takes <strong><Dur min={currentMinutes()} /></strong>, so only gaps that long are open.</span></p>

    <div class="daytabs">
      <Tabs label="Day" tabs={dayLabels} selected={dayIdx} onselectedchange={(i) => (app.day = days[i])}>
        {#snippet panel(tab, i)}
          {#if i === dayIdx}
            <div class="tape-frame" data-fgu-signature>
              {#if status === 'loading'}
                <div class="tape-state skeleton" aria-busy="true" aria-label="Loading openings">
                  <div class="sk-lanes"><span></span><span></span></div>
                  <p class="sr-only">Loading openings for {dayLong(app.day)}</p>
                </div>
              {:else if status === 'error'}
                <div class="tape-state" role="alert">
                  <p class="state-title">We couldn’t load {dayMid(app.day)}.</p>
                  <p class="state-body">Your choices for {dog.name} are kept. Check your connection and try again.</p>
                  <Button variant="primary" onclick={fetchDay}>{#snippet icon()}<Icon name="refresh" size="sm" />{/snippet}Try again</Button>
                </div>
              {:else if noOpenings}
                <div class="tape-state">
                  <span class="stripe" aria-hidden="true"></span>
                  <p class="state-title">{view.closed ? 'The salon is closed on ' + dayLong(app.day).split(' ')[0] + 's.' : 'No gap long enough on ' + dayMid(app.day) + '.'}</p>
                  <p class="state-body">{view.closed ? 'Grooming runs Monday to Saturday, 08:00 to 17:00.' : 'A ' + service.name.toLowerCase() + ' for ' + dog.name + ' needs a clear stretch the length of the towel.'}</p>
                  {#if nextOpening}
                    <Button variant="primary" onclick={jump}>Next opening: {dayMid(nextOpening.day)}, {slotClock(nextOpening.s)}</Button>
                  {/if}
                </div>
              {:else}
                <DayTape data={view} {len} pick={app.pick} day={app.day} dogName={dog.name} {onpick} />
              {/if}
            </div>
          {/if}
        {/snippet}
      </Tabs>
    </div>
  </div>

  <aside class="ticket" aria-label="Your groom" aria-live="polite">
    {#if app.pick && view && !noOpenings}
      <div class="ticket-who"><Mono name={dog.name} size={32} /><span><strong>{dog.name}</strong> · {service.name}</span></div>
      <p class="ticket-time"><span class="ticket-clock">{slotClock(app.pick.s)}</span><span class="ticket-until">to {clock(endMin)}</span></p>
      <p class="ticket-meta">{dayLong(app.day)} · with {laneFirst}</p>
      <p class="ticket-price"><Dur min={currentMinutes()} /> · {money(currentPrice())}</p>
      <div class="ticket-act">
        <Button variant="primary" onclick={() => go('details')}>Book {slotClock(app.pick.s)}</Button>
      </div>
    {:else}
      <div class="ticket-who"><Mono name={dog.name} size={32} /><span><strong>{dog.name}</strong> · {service.name}</span></div>
      <p class="ticket-meta">{status === 'loading' ? 'Finding openings…' : 'Nothing to book on this day yet.'}</p>
      <div class="ticket-act"><Button variant="primary" disabled>Book a time</Button></div>
    {/if}
  </aside>
</section>
