<script>
import Button from "../components/fgu/button/button.svelte";
import Field from "../components/fgu/field/field.svelte";
import Toggle from "../components/fgu/toggle/toggle.svelte";
import Icon from "../lib/Icon.svelte";
import Ticket from "../lib/Ticket.svelte";
import { dayLong, parseISODay, duration, money, timeLabel } from "../lib/data.js";
import { confirmSlot } from "../lib/slots.js";
import { app, dog, service, minutes, price, addVisit, toast } from "../lib/store.svelte.js";

let busy = $state(false);
let problem = $state("");
let errors = $state({ name: "", phone: "" });

const when = $derived.by(() => { const d = parseISODay(app.dayISO); const [h, m] = app.slot.time.split(":").map(Number); d.setHours(h, m); return d; });
const PHONE = /^(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/;

function validate() {
  errors.name = app.form.name.trim() ? "" : "Enter your name so the groomer knows who to hand the lead to.";
  errors.phone = PHONE.test(app.form.phone.trim()) ? "" : "Enter a UK mobile number, like 07700 900123.";
  return !errors.name && !errors.phone;
}

async function book(event) {
  event.preventDefault();
  problem = "";
  if (!validate()) { document.querySelector('[aria-invalid="true"]')?.focus(); return; }
  busy = true;
  const res = await confirmSlot(app.dayISO, app.slot.time);
  busy = false;
  if (res.ok) {
    addVisit();
    toast(`${dog().name} is booked in. We'll text a reminder.`);
    location.hash = "#/book/done";
  } else if (res.reason === "taken") {
    app.conflict = `${timeLabel(when)} on ${dayLong(when)} was just taken by someone else. Your details are saved; pick another time.`;
    app.slot = null;
    location.hash = "#/book/when";
  } else {
    problem = "You are offline, so we couldn't book. Your details are kept; try again when you're back.";
  }
}
</script>

<div class="page">
  <a class="back" href="#/book/when"><Icon name="back" size="sm" /> Change time</a>
  <h1 class="display">Check and book</h1>

  <Ticket label="Your booking" tone="card">
    {#snippet head()}
      <p class="label">{dog().name}'s groom</p>
      <p class="summary-big">{service().name}</p>
      <p class="summary-line">{dayLong(when)}</p>
      <p class="summary-line num">{timeLabel(when)} with {app.slot.groomer}, about {duration(minutes())}</p>
    {/snippet}
    {#snippet stub()}
      <div class="price-row"><span>Total, pay at the salon</span><strong class="num">{money(price())}</strong></div>
      <p class="muted">Free to cancel up to 24 hours before. Later than that costs half.</p>
    {/snippet}
  </Ticket>

  <form class="form" onsubmit={book} novalidate>
    <Field label="Your name" bind:value={app.form.name} required autocomplete="name" error={errors.name} data-msg-value-missing="Enter your name so the groomer knows who to hand the lead to." />
    <Field label="Mobile number" hint="For the reminder and if we're running late." bind:value={app.form.phone} type="tel" inputmode="tel" autocomplete="tel" required error={errors.phone} data-msg-value-missing="Enter a UK mobile number, like 07700 900123." />
    <Field label="Anything we should know" hint="Tender spots, allergies, how {dog().name} behaves with clippers." multiline rows="3" bind:value={app.form.notes} />
    <div class="toggles">
      <Toggle bind:checked={app.form.nervous}>{dog().name} is nervous with clippers</Toggle>
      <Toggle variant="switch" bind:checked={app.form.reminder}>Text me a reminder the day before</Toggle>
    </div>

    {#if problem}<p class="notice notice-error" role="alert"><Icon name="wifi" size="sm" /> {problem}</p>{/if}

    <div class="actionbar">
      <p class="actionbar-note num">{money(price())}</p>
      <Button type="submit" loading={busy}>{busy ? "Booking" : `Book ${dog().name} in`}</Button>
    </div>
  </form>
</div>
