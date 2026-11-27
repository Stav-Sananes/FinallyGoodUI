<script>
  import Field from '../components/fgu/field/field.svelte';
  import Toggle from '../components/fgu/toggle/toggle.svelte';
  import Button from '../components/fgu/button/button.svelte';
  import Disclosure from '../components/fgu/disclosure/disclosure.svelte';
  import { pushToast } from '../components/fgu/toast/toast-store.js';
  import Mono from '../lib/Mono.svelte';
  import Dur from '../lib/Dur.svelte';
  import { app, currentDog, currentService, currentLen, currentMinutes, currentPrice, addBooking, nextId } from '../lib/state.svelte.js';
  import { route, go } from '../lib/router.svelte.js';
  import { saveBooking } from '../lib/api.js';
  import { slotClock, clock, slotMinutes, STEP } from '../lib/schedule.js';
  import { dayLong } from '../lib/dates.js';
  import { groomerById, money } from '../lib/data.js';

  const dog = $derived(currentDog());
  const service = $derived(currentService());
  const len = $derived(currentLen());
  const groomer = $derived(app.pick ? groomerById(app.pick.lane) : null);
  let saving = $state(false);
  let failed = $state('');
  let ownerError = $state('');
  let phoneError = $state('');

  function validate() {
    ownerError = app.draft.owner.trim() ? '' : 'Add your name so we can greet you at the door.';
    phoneError = /^[0-9 +()-]{9,}$/.test(app.draft.phone.trim()) ? '' : 'Add a mobile number we can text, like 07700 900123.';
    return !ownerError && !phoneError;
  }

  async function confirm() {
    failed = '';
    if (!validate() || !app.pick) return;
    saving = true;
    const booking = {
      id: nextId(), dogId: dog.id, dogName: dog.name, serviceId: service.id, serviceName: service.name,
      day: app.day, lane: app.pick.lane, s: app.pick.s, len, price: currentPrice(),
      owner: app.draft.owner.trim(), phone: app.draft.phone.trim(), notes: app.draft.notes.trim(), nervous: app.draft.nervous, status: 'booked',
    };
    try {
      await saveBooking(booking, route.q.state);
      addBooking(booking);
      app.last = booking;
      pushToast({ message: `Booked: ${dog.name}, ${dayLong(app.day)}, ${slotClock(booking.s)}.`, timeout: 5000 });
      go('ticket');
    } catch {
      failed = 'We couldn’t save that booking. What you typed is kept; try again.';
    } finally {
      saving = false;
    }
  }
</script>

<section class="details" aria-labelledby="details-title">
  {#if !app.pick}
    <div class="empty-block">
      <span class="stripe" aria-hidden="true"></span>
      <h1 id="details-title" class="screen-title">No time picked yet</h1>
      <p>Pick an opening on the tape first, then come back here for the last step.</p>
      <Button variant="primary" onclick={() => go('book')}>Back to the tape</Button>
    </div>
  {:else}
    <p class="step">Step 2 of 2</p>
    <h1 id="details-title" class="screen-title">Last step for <em>{dog.name}</em></h1>
    <div class="summary">
      <Mono name={dog.name} size={40} />
      <p><strong>{service.name}</strong>, <Dur min={currentMinutes()} /><br />{dayLong(app.day)}, {slotClock(app.pick.s)} to {clock(slotMinutes(app.pick.s) + len * STEP)} with {groomer.first}<br /><span class="muted">{money(currentPrice())}, paid at pick-up</span></p>
      <Button variant="ghost" onclick={() => go('book')}>Change time</Button>
    </div>

    <form class="form" onsubmit={(e) => { e.preventDefault(); confirm(); }} novalidate>
      <Field label="Your name" name="owner" autocomplete="name" bind:value={app.draft.owner} error={ownerError} invalid={!!ownerError} required />
      <Field label="Mobile number" name="phone" type="tel" autocomplete="tel" hint="We text you the day before, and when {dog.name} is ready." bind:value={app.draft.phone} error={phoneError} invalid={!!phoneError} required />
      <Field label="Anything the groomer should know" name="notes" multiline rows={3} hint="Optional. Matting, sore spots, tricks." bind:value={app.draft.notes} />
      <Toggle variant="switch" bind:checked={app.draft.nervous}>{dog.name} is nervous around dryers and clippers</Toggle>

      <Disclosure variant="single">
        {#snippet trigger()}Cancellation and lateness{/snippet}
        <p>Cancel free up to 24 hours before. After that we keep half the price. If you’re more than 15 minutes late we may have to shorten the groom.</p>
      </Disclosure>

      {#if failed}<p class="form-error" role="alert">{failed}</p>{/if}
      <div class="form-act">
        <Button type="submit" variant="primary" loading={saving}>Confirm {slotClock(app.pick.s)} on {dayLong(app.day).split(',')[0]}</Button>
        <Button variant="secondary" onclick={() => go('book')}>Back</Button>
      </div>
    </form>
  {/if}
</section>
