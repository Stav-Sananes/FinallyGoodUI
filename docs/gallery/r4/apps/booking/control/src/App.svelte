<script>
  import { SIZES, SERVICES, GROOMERS, SEED_DOGS, priceFor, durationFor } from './data.js';
  import { loadSlots, createBooking, dayKey, isClosed, fmtTime } from './api.js';

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
  const firstOpen = () => days.findIndex((d) => !isClosed(d));
  const longDate = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); };

  function seedBooking() {
    let d = days[2]; if (isClosed(d)) d = days[3];
    return [{ id: 'B7K2Q', dog: 'Biscuit', service: 'Full Groom', groomer: 'Mara', day: dayKey(d), time: 10, price: priceFor(SERVICES[1], 'L'), mins: 135 }];
  }

  let tab = $state('book');
  let step = $state(0); // 0 dog, 1 service, 2 time, 3 review, 4 done
  let dogs = $state(store.get('dogs', SEED_DOGS));
  let bookings = $state(store.get('bookings', seedBooking()));
  let dogId = $state(dogs[0]?.id ?? null);
  let serviceId = $state(null);
  let groomer = $state('any');
  let dayIdx = $state(firstOpen());
  let time = $state(null);
  let slots = $state({ status: 'idle', list: [] });
  let submit = $state({ status: 'idle', error: '' });
  let confirmed = $state(null);
  let adding = $state(false);
  let newDog = $state({ name: '', breed: '', size: 'M' });
  let cancelId = $state(null);
  let reqToken = 0;

  const dog = $derived(dogs.find((d) => d.id === dogId));
  const service = $derived(SERVICES.find((s) => s.id === serviceId));
  const price = $derived(service && dog ? priceFor(service, dog.size) : 0);
  const mins = $derived(service && dog ? durationFor(service, dog.size) : 0);
  const date = $derived(days[dayIdx]);
  const groomerName = $derived(GROOMERS.find((g) => g.id === groomer).name);
  const upcoming = $derived([...bookings].sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time)));
  const openCount = $derived(slots.list.filter((s) => s.open).length);
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
  const endLabel = (t, m) => fmtTime(Math.round((t + m / 60) * 2) / 2);

  async function fetchSlots() {
    const tok = ++reqToken;
    slots = { status: 'loading', list: [] };
    time = null;
    try {
      const list = await loadSlots(date, groomer, mins, bookings);
      if (tok === reqToken) slots = { status: 'ready', list };
    } catch (e) {
      if (tok === reqToken) slots = { status: 'error', list: [], offline: e.message === 'offline' };
    }
  }

  $effect(() => {
    if (step === 2 && service && dog) { dayIdx; groomer; fetchSlots(); }
  });

  function addDog() {
    if (!newDog.name.trim()) return;
    const d = { id: 'd' + Date.now(), name: newDog.name.trim(), breed: newDog.breed.trim() || 'Mixed breed', size: newDog.size };
    dogs = [...dogs, d]; store.set('dogs', dogs);
    dogId = d.id; adding = false; newDog = { name: '', breed: '', size: 'M' };
  }

  async function confirm() {
    submit = { status: 'saving', error: '' };
    const payload = { dog: dog.name, service: service.name, groomer: groomer === 'any' ? ['Mara', 'Jun', 'Tess'][Math.floor(dayIdx % 3)] : groomerName, day: dayKey(date), time, price, mins };
    try {
      confirmed = await createBooking(payload);
      bookings = [...bookings, confirmed]; store.set('bookings', bookings);
      submit = { status: 'idle', error: '' }; step = 4;
    } catch (e) {
      if (e.code === 'taken') { submit = { status: 'error', error: `${fmtTime(time)} was just taken by another owner. Pick a different time.`, taken: true }; }
      else submit = { status: 'error', error: e.code === 'offline' ? 'You are offline. Reconnect and try again.' : 'Something went wrong on our side. Your spot is not booked yet.' };
    }
  }

  function backToTimes() { submit = { status: 'idle', error: '' }; step = 2; }
  function reset() { step = 0; serviceId = null; time = null; groomer = 'any'; dayIdx = firstOpen(); confirmed = null; submit = { status: 'idle', error: '' }; }
  function cancelBooking() { bookings = bookings.filter((b) => b.id !== cancelId); store.set('bookings', bookings); cancelId = null; }
  function back() { if (step > 0 && step < 4) step -= 1; }
  const titles = ['Who is getting groomed?', 'Pick a service', 'Choose a time', 'Review and confirm'];
</script>

<div class="shell">
  <header class="top">
    <div class="brand"><span class="logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><ellipse cx="6" cy="10" rx="2.2" ry="3"/><ellipse cx="18" cy="10" rx="2.2" ry="3"/><ellipse cx="10" cy="5.5" rx="2.2" ry="3"/><ellipse cx="14" cy="5.5" rx="2.2" ry="3"/><path d="M12 11c-3.5 0-6 3-6 5.5 0 1.8 1.4 2.5 3 2.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.6 0 3-.7 3-2.5 0-2.5-2.5-5.5-6-5.5z"/></svg>
    </span> Pawlish</div>
    <span class="loc">Maple St, Portland</span>
  </header>

  <main>
    {#if tab === 'book'}
      {#if step < 4}
        <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow={step + 1} aria-label="Booking progress">
          {#each [0, 1, 2, 3] as i}<i class:on={i <= step}></i>{/each}
        </div>
        <div class="heading">
          {#if step > 0}<button class="back" onclick={back} aria-label="Back">&#8592;</button>{/if}
          <div><p class="eyebrow">Step {step + 1} of 4</p><h1>{titles[step]}</h1></div>
        </div>
      {/if}

      {#if step === 0}
        <ul class="list">
          {#each dogs as d (d.id)}
            <li><label class="card choice" class:sel={dogId === d.id}>
              <input type="radio" name="dog" value={d.id} bind:group={dogId} />
              <span class="avatar">{d.name[0]}</span>
              <span class="grow"><strong>{d.name}</strong><small>{d.breed} &middot; {SIZES.find((s) => s.id === d.size).label}</small></span>
              <span class="tick" aria-hidden="true"></span>
            </label></li>
          {/each}
        </ul>
        {#if adding}
          <form class="card form" onsubmit={(e) => { e.preventDefault(); addDog(); }}>
            <label>Name<input bind:value={newDog.name} placeholder="e.g. Waffles" required autocomplete="off" /></label>
            <label>Breed <span class="opt">(optional)</span><input bind:value={newDog.breed} placeholder="e.g. Corgi" autocomplete="off" /></label>
            <fieldset><legend>Size</legend>
              <div class="seg">
                {#each SIZES as s}<label class:sel={newDog.size === s.id}><input type="radio" name="size" value={s.id} bind:group={newDog.size} />{s.label}<small>{s.hint}</small></label>{/each}
              </div>
            </fieldset>
            <div class="row"><button type="button" class="ghost" onclick={() => (adding = false)}>Cancel</button><button class="btn sm" type="submit" disabled={!newDog.name.trim()}>Save dog</button></div>
          </form>
        {:else}
          <button class="add" onclick={() => (adding = true)}>+ Add a dog</button>
        {/if}
        {#if !dogs.length && !adding}<p class="empty">No dogs yet. Add your first one to start booking.</p>{/if}

      {:else if step === 1}
        <ul class="list">
          {#each SERVICES as s (s.id)}
            <li><label class="card choice" class:sel={serviceId === s.id}>
              <input type="radio" name="svc" value={s.id} bind:group={serviceId} />
              <span class="grow"><strong>{s.name}</strong><small>{s.desc}</small><em>{dur(durationFor(s, dog.size))}</em></span>
              <span class="price">${priceFor(s, dog.size)}</span>
            </label></li>
          {/each}
        </ul>
        <p class="note">Prices for {dog.name} ({SIZES.find((x) => x.id === dog.size).label.toLowerCase()} dog).</p>

      {:else if step === 2}
        <div class="days" role="listbox" aria-label="Date">
          {#each days as d, i}
            <button role="option" aria-selected={dayIdx === i} class="day" class:sel={dayIdx === i} class:closed={isClosed(d)} onclick={() => (dayIdx = i)}>
              <span>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span><b>{d.getDate()}</b>
              <small>{isClosed(d) ? 'Closed' : d.toLocaleDateString('en-US', { month: 'short' })}</small>
            </button>
          {/each}
        </div>
        <div class="chips" role="radiogroup" aria-label="Groomer">
          {#each GROOMERS as g}<button role="radio" aria-checked={groomer === g.id} class="chip" class:sel={groomer === g.id} onclick={() => (groomer = g.id)}>{g.name}</button>{/each}
        </div>
        <h2 class="sub">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>

        {#if slots.status === 'loading'}
          <div class="grid" aria-busy="true" aria-label="Loading times">{#each Array(8) as _}<span class="skel"></span>{/each}</div>
        {:else if slots.status === 'error'}
          <div class="state err" role="alert">
            <strong>{slots.offline ? 'You are offline' : 'Could not load times'}</strong>
            <p>{slots.offline ? 'Check your connection and try again.' : 'The schedule did not respond. Nothing is lost, just try again.'}</p>
            <button class="btn sm" onclick={fetchSlots}>Try again</button>
          </div>
        {:else if slots.status === 'ready' && isClosed(date)}
          <div class="state"><strong>Closed on Sundays</strong><p>We rest on Sundays. Try Monday, we open at 9 AM.</p>
            <button class="btn sm" onclick={() => (dayIdx = firstOpen() === dayIdx ? dayIdx + 1 : dayIdx + 1)}>Next day</button></div>
        {:else if slots.status === 'ready' && openCount === 0}
          <div class="state"><strong>Fully booked</strong><p>No {dur(mins)} openings{groomer !== 'any' ? ` with ${groomerName}` : ''} this day.</p>
            <div class="row">
              {#if groomer !== 'any'}<button class="ghost" onclick={() => (groomer = 'any')}>Any groomer</button>{/if}
              <button class="btn sm" onclick={() => { let n = dayIdx + 1; while (n < days.length && isClosed(days[n])) n++; if (n < days.length) dayIdx = n; }}>Next day</button>
            </div></div>
        {:else if slots.status === 'ready'}
          <div class="grid" role="radiogroup" aria-label="Time">
            {#each slots.list as s}
              <button role="radio" aria-checked={time === s.time} class="slot" class:sel={time === s.time} disabled={!s.open} onclick={() => (time = s.time)}>{fmtTime(s.time)}</button>
            {/each}
          </div>
          <p class="note">{openCount} open &middot; {dur(mins)} appointment</p>
        {/if}

      {:else if step === 3}
        <div class="card summary">
          <div class="srow"><span>Dog</span><b>{dog.name}</b></div>
          <div class="srow"><span>Service</span><b>{service.name}</b></div>
          <div class="srow"><span>When</span><b>{longDate(dayKey(date))}<br />{fmtTime(time)} &ndash; {endLabel(time, mins)}</b></div>
          <div class="srow"><span>Groomer</span><b>{groomerName}</b></div>
          <div class="srow total"><span>Total, pay at pickup</span><b>${price}</b></div>
        </div>
        {#if submit.status === 'error'}
          <div class="state err" role="alert"><strong>Not booked</strong><p>{submit.error}</p>
            {#if submit.taken}<button class="btn sm" onclick={backToTimes}>Choose another time</button>
            {:else}<button class="btn sm" onclick={confirm}>Try again</button>{/if}
          </div>
        {/if}
        <p class="note">Free cancellation up to 24 hours before. Please arrive 5 minutes early.</p>

      {:else}
        <div class="done">
          <div class="check" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
          <h1>{confirmed.dog} is booked</h1>
          <p>{confirmed.service} with {confirmed.groomer}<br /><b>{longDate(confirmed.day)}, {fmtTime(confirmed.time)}</b></p>
          <p class="note">Confirmation {confirmed.id}</p>
          <button class="btn" onclick={() => { reset(); tab = 'trips'; }}>View my bookings</button>
          <button class="ghost" onclick={reset}>Book another</button>
        </div>
      {/if}
    {:else}
      <div class="heading"><div><p class="eyebrow">Your appointments</p><h1>My bookings</h1></div></div>
      {#if upcoming.length === 0}
        <div class="state"><strong>Nothing booked</strong><p>When you book a groom it shows up here.</p>
          <button class="btn sm" onclick={() => (tab = 'book')}>Book a groom</button></div>
      {:else}
        <ul class="list">
          {#each upcoming as b (b.id)}
            <li class="card appt">
              <div class="datebox"><small>{longDate(b.day).split(',')[0].slice(0, 3)}</small><b>{b.day.slice(-2)}</b></div>
              <div class="grow"><strong>{b.dog} &middot; {b.service}</strong>
                <small>{fmtTime(b.time)} &ndash; {endLabel(b.time, b.mins)} with {b.groomer}</small>
                <small>${b.price} &middot; ref {b.id}</small></div>
              <button class="ghost danger" onclick={() => (cancelId = b.id)}>Cancel</button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </main>

  {#if tab === 'book' && step < 4}
    <div class="cta">
      {#if step === 0}<button class="btn" disabled={!dog} onclick={() => (step = 1)}>Continue</button>
      {:else if step === 1}<button class="btn" disabled={!service} onclick={() => (step = 2)}>{service ? `Continue, $${price}` : 'Continue'}</button>
      {:else if step === 2}<button class="btn" disabled={time === null} onclick={() => { submit = { status: 'idle', error: '' }; step = 3; }}>{time === null ? 'Select a time' : `Continue, ${fmtTime(time)}`}</button>
      {:else}<button class="btn" disabled={submit.status === 'saving'} onclick={confirm}>{submit.status === 'saving' ? 'Booking...' : `Confirm booking, $${price}`}</button>{/if}
    </div>
  {/if}

  <nav class="tabs" aria-label="Main">
    <button class:on={tab === 'book'} onclick={() => (tab = 'book')} aria-current={tab === 'book'}>Book</button>
    <button class:on={tab === 'trips'} onclick={() => (tab = 'trips')} aria-current={tab === 'trips'}>My bookings{#if bookings.length}<span class="badge">{bookings.length}</span>{/if}</button>
  </nav>

  {#if cancelId}
    <div class="scrim" role="presentation" onclick={() => (cancelId = null)}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Cancel booking" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && (cancelId = null)}>
        <h2>Cancel this appointment?</h2>
        <p>The slot goes back to other owners. This cannot be undone.</p>
        <button class="btn danger-fill" onclick={cancelBooking}>Yes, cancel booking</button>
        <button class="ghost" onclick={() => (cancelId = null)}>Keep it</button>
      </div>
    </div>
  {/if}
</div>
