<script>
// The identity motif: a stub with half-round notches at the tear line. `stub` is the part below the tear.
let { head, stub, tone = "card", label } = $props();
</script>

<section class="ticket" data-tone={tone} aria-label={label}>
  <div class="ticket-head">{@render head()}</div>
  {#if stub}
    <div class="tear" aria-hidden="true"></div>
    <div class="ticket-stub">{@render stub()}</div>
  {/if}
</section>
