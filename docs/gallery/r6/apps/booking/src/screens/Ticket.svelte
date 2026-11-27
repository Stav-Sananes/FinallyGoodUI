<script>
  import RecordCard from '../components/fgu/record-card/record-card.svelte';
  import Button from '../components/fgu/button/button.svelte';
  import Icon from '../lib/Icon.svelte';
  import { app } from '../lib/state.svelte.js';
  import { go } from '../lib/router.svelte.js';
  import { slotClock, clock, slotMinutes, STEP } from '../lib/schedule.js';
  import { dayLong, dateOf } from '../lib/dates.js';
  import { groomerById, money } from '../lib/data.js';

  const b = $derived(app.last ?? [...app.bookings].reverse().find((x) => x.status === 'booked'));

  function toIcs(x) {
    const d = dateOf(x.day);
    const fmt = (min) => {
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(min / 60), min % 60);
      const p = (n) => String(n).padStart(2, '0');
      return `${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}T${p(t.getHours())}${p(t.getMinutes())}00`;
    };
    const start = slotMinutes(x.s);
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pawprint//Booking//EN', 'BEGIN:VEVENT', `UID:${x.id}@pawprint`, `DTSTAMP:${fmt(0)}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(start + x.len * STEP)}`, `SUMMARY:${x.dogName}: ${x.serviceName} at Pawprint`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function addToCalendar() {
    const blob = new Blob([toIcs(b)], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${b.dogName.toLowerCase()}-groom.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

<section class="ticket-screen" aria-labelledby="ticket-title">
  {#if b}
    <h1 id="ticket-title" class="screen-title">{b.dogName} is booked</h1>
    <div class="ticket-wrap">
      <RecordCard variant="default">
        {#snippet lead()}{b.id}{/snippet}
        {b.dogName}’s {b.serviceName.toLowerCase()}
        {#snippet meta()}{dayLong(b.day)}, {slotClock(b.s)} to {clock(slotMinutes(b.s) + b.len * STEP)} with {groomerById(b.lane).first}{/snippet}
        {#snippet status()}Booked · {money(b.price)} at pick-up{/snippet}
        {#snippet action()}
          <Button variant="primary" onclick={addToCalendar}>{#snippet icon()}<Icon name="calendar" size="sm" />{/snippet}Add to calendar</Button>
          <Button variant="secondary" onclick={() => go('visits')}>See my visits</Button>
        {/snippet}
      </RecordCard>
      <span class="stamp-signature" aria-hidden="true">Booked</span>
    </div>
    <p class="after">We text {b.phone} the day before. Free cancellation until 24 hours ahead, from Visits.</p>
  {:else}
    <div class="empty-block">
      <span class="stripe" aria-hidden="true"></span>
      <h1 id="ticket-title" class="screen-title">No ticket yet</h1>
      <p>Book a time and your ticket shows up here.</p>
      <Button variant="primary" onclick={() => go('book')}>Pick a time</Button>
    </div>
  {/if}
</section>
