<script>
import Button from "../components/fgu/button/button.svelte";
import Icon from "../lib/Icon.svelte";
import Choice from "../lib/Choice.svelte";
import Monogram from "../lib/Monogram.svelte";
import { DOGS, SERVICES, SIZES, priceFor, minutesFor, money, duration } from "../lib/data.js";
import { app, dog, service, startBooking } from "../lib/store.svelte.js";

const chosen = $derived(service());
function pickDog(id) { startBooking({ dogId: id }); }
function pickService(id) { startBooking({ serviceId: id }); }
function next() { location.hash = "#/book/when"; }
</script>

<div class="page">
  <h1 class="display">Book a groom</h1>
  <p class="lede">Pick your dog and the groom. We work out the price and how long it takes from their size.</p>

  <fieldset class="group">
    <legend class="label">Who is it for</legend>
    <div class="dogs">
        {#each DOGS as d (d.id)}
          <Choice class="dog" name="dog" checked={app.dogId === d.id} onpick={() => pickDog(d.id)} label="{d.name}, {d.breed}, {d.weight} kilos">
            <Monogram dog={d} size="lg" />
            <span class="dog-name">{d.name}</span>
            <span class="dog-meta">{d.breed}</span>
            <span class="dog-meta">{d.weight} kg, {d.size === "S" ? "small" : d.size === "M" ? "medium" : "large"}</span>
          </Choice>
        {/each}
    </div>
  </fieldset>

  <fieldset class="group">
    <legend class="label">What {dog().name} needs</legend>
    <ul class="services">
      {#each SERVICES as s (s.id)}
        <li>
          <Choice class="service" name="service" checked={app.serviceId === s.id} onpick={() => pickService(s.id)} label="{s.name}, {money(priceFor(s, dog()))}, {duration(minutesFor(s, dog()))}">
            <span class="service-main">
              <span class="service-name">{s.name}</span>
              <span class="service-blurb">{s.blurb}</span>
            </span>
            <span class="service-nums">
              <span class="num">{money(priceFor(s, dog()))}</span>
              <span class="unit"><Icon name="clock" size="sm" /> {duration(minutesFor(s, dog()))}</span>
            </span>
          </Choice>
        </li>
      {/each}
    </ul>
  </fieldset>

  <div class="actionbar">
    <p class="actionbar-note" aria-live="polite">
      {#if chosen}<strong>{chosen.name}</strong> for {dog().name}: <span class="num">{money(priceFor(chosen, dog()))}</span>, about {duration(minutesFor(chosen, dog()))}.
      {:else}Choose a groom to see times.{/if}
    </p>
    <Button disabled={!chosen} onclick={next}>Choose a time</Button>
  </div>
</div>
