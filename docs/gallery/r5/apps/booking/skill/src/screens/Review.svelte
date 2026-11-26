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

const when = $derived.by(() => { const d = parseISODay(app.dayISO); const [h, m] = app.slot.time.split(":").map(Number); d.setHours(h, m); return d; });
function validate(form) {
  // The field behaviour owns the message (data-msg-*): ask each invalid control to show it, as a blur would.
  const bad = [...form.querySelectorAll("[data-fgu=field] [data-part=control]")].filter((c) => !c.checkValidity());
  for (const c of bad) c.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  bad[0]?.focus();
  return bad.length === 0;
}

async function book(event) {
  event.preventDefault();
  problem = "";
  if (!validate(event.currentTarget)) return;
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
    <Field label="Your name" value={app.form.name} oninput={(e) => (app.form.name = e.target.value)} required autocomplete="name" data-msg-value-missing="Enter your name so the groomer knows who to hand the lead to." />
    <Field label="Mobile number" hint="For the reminder and if we're running late." value={app.form.phone} oninput={(e) => (app.form.phone = e.target.value)} type="tel" inputmode="tel" autocomplete="tel" required pattern={"(?:\\+44\\s?7\\d{3}|07\\d{3})\\s?\\d{3}\\s?\\d{3}"} data-msg-value-missing="Enter a UK mobile number, like 07700 900123." data-msg-pattern-mismatch="Enter a UK mobile number, like 07700 900123." />
    <Field label="Anything we should know" hint="Tender spots, allergies, how {dog().name} behaves with clippers." value={app.form.notes} oninput={(e) => (app.form.notes = e.target.value)} />
    <div class="toggles">
      <Toggle checked={app.form.nervous} onchange={(e) => (app.form.nervous = e.target.checked)}>{dog().name} is nervous with clippers</Toggle>
      <Toggle variant="switch" checked={app.form.reminder} onchange={(e) => (app.form.reminder = e.target.checked)}>Text me a reminder the day before</Toggle>
    </div>

    {#if problem}<p class="notice notice-error" role="alert"><Icon name="wifi" size="sm" /> {problem}</p>{/if}

    <div class="actionbar">
      <p class="actionbar-note num">{money(price())}</p>
      <Button type="submit" loading={busy}>{busy ? "Booking" : `Book ${dog().name} in`}</Button>
    </div>
  </form>
</div>
