<script>
import Icon from "../lib/Icon.svelte";
import Ticket from "../lib/Ticket.svelte";
import { dogById, serviceById, dayLong, duration, money, timeLabel } from "../lib/data.js";
import { app, startBooking } from "../lib/store.svelte.js";

const v = $derived(app.lastBooked);
const dog = $derived(dogById(v.dogId));
const when = $derived(new Date(v.start));
function another() { startBooking({ serviceId: null }); location.hash = "#/book"; }
</script>

<div class="page done">
  <h1 class="display">{dog.name} is booked in</h1>
  <div class="ticket-wrap">
    <Ticket label="Confirmation" tone="card">
      {#snippet head()}
        <p class="label">Appointment card</p>
        <p class="summary-big">{serviceById(v.serviceId).name}</p>
        <p class="summary-line">{dog.name}, {dog.breed}</p>
        <p class="summary-line">{dayLong(when)}</p>
        <p class="summary-big num">{timeLabel(when)}</p>
      {/snippet}
      {#snippet stub()}
        <div class="price-row"><span>With {v.groomer}, about {duration(v.minutes)}</span><strong class="num">{money(v.price)}</strong></div>
        <p class="muted">Pay at the salon. 14 Mill Lane, bring {dog.name}'s lead and vaccination card.</p>
      {/snippet}
    </Ticket>
    <span class="stamp-signature" aria-hidden="true"><Icon name="check" size="lg" /><span>Booked</span></span>
  </div>
  <div class="actionbar">
    <a class="btn-link" href="#/visits">See my visits</a>
    <button type="button" class="btn-ghost" onclick={another}>Book another groom</button>
  </div>
</div>
