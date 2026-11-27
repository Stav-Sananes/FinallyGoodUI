<script>
  // The Day Tape: the signature. A working schedule control. Two groomers' day, booked time hatched,
  // open starts as tiles that only exist where the chosen groom (len slots) fits; the towel sits on the pick.
  import { SLOTS, slotClock, slotMinutes, clock, validStarts, STEP } from './schedule.js';
  import { dayLong } from './dates.js';
  import Mono from './Mono.svelte';

  let { data, len, pick, day, dogName, onpick } = $props();

  const hours = Array.from({ length: SLOTS / 4 + 1 }, (_, i) => ({ s: i * 4, label: String(8 + i).padStart(2, '0') }));
  const starts = $derived(Object.fromEntries(data.lanes.map((l) => [l.id, validStarts(l.blocks, len)])));
  // Free runs per lane: those the groom fits in are open (tiled white), the rest are too short.
  function freeRuns(blocks) {
    const busy = new Array(SLOTS).fill(false);
    for (const b of blocks) for (let i = b.s; i < b.s + b.l && i < SLOTS; i++) busy[i] = true;
    const runs = [];
    let from = -1;
    for (let i = 0; i <= SLOTS; i++) {
      if (i < SLOTS && !busy[i]) { if (from < 0) from = i; }
      else if (from >= 0) { runs.push({ s: from, l: i - from }); from = -1; }
    }
    return runs;
  }
  const runs = $derived(Object.fromEntries(data.lanes.map((l) => [l.id, freeRuns(l.blocks)])));
  const laneIndex = $derived(pick ? data.lanes.findIndex((l) => l.id === pick.lane) : 0);
  const focusKey = $derived(
    pick && starts[pick.lane]?.includes(pick.s)
      ? `${pick.lane}:${pick.s}`
      : (() => {
          for (const l of data.lanes) if (starts[l.id].length) return `${l.id}:${starts[l.id][0]}`;
          return '';
        })()
  );
  const endClock = (s) => clock(slotMinutes(s) + len * STEP);

  let scroller;
  let towelEl = $state();

  $effect(() => {
    // Keep the towel in view when the pick moves (day change, service change, arrow keys).
    if (!pick || !scroller || !towelEl) return;
    const top = pick.s * unitPx();
    const bottom = top + len * unitPx();
    const view = scroller.clientHeight - headHeight();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (top < scroller.scrollTop || bottom > scroller.scrollTop + view) {
      scroller.scrollTo({ top: Math.max(0, top - unitPx() * 4), behavior: reduce ? 'auto' : 'smooth' });
    }
  });

  function unitPx() {
    return parseFloat(getComputedStyle(scroller).getPropertyValue('--u')) || 22;
  }
  function headHeight() {
    return scroller.querySelector('.tape-head')?.offsetHeight ?? 0;
  }

  function onkey(event) {
    const t = event.target.closest('[data-tile]');
    if (!t) return;
    const lane = t.dataset.lane;
    const s = Number(t.dataset.s);
    const li = data.lanes.findIndex((l) => l.id === lane);
    let target = null;
    const list = starts[lane];
    if (event.key === 'ArrowDown') target = [lane, list.find((x) => x > s)];
    else if (event.key === 'ArrowUp') target = [lane, [...list].reverse().find((x) => x < s)];
    else if (event.key === 'Home') target = [lane, list[0]];
    else if (event.key === 'End') target = [lane, list[list.length - 1]];
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const other = data.lanes[li + (event.key === 'ArrowRight' ? 1 : -1)];
      if (other && starts[other.id].length) {
        const near = starts[other.id].reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a));
        target = [other.id, near];
      }
    }
    if (!target || target[1] === undefined) return;
    event.preventDefault();
    const el = scroller.querySelector(`[data-tile][data-lane="${target[0]}"][data-s="${target[1]}"]`);
    el?.focus();
  }
</script>

<!-- Arrow keys are delegated here from the focusable tiles inside; the group itself is not a control. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="tape" role="group" aria-label="Day tape for {dayLong(day)}: open times for {dogName}" onkeydown={onkey}>
  <div class="tape-scroll" bind:this={scroller} tabindex="-1">
    <div class="tape-head" style="--cols:{data.lanes.length}">
      <span></span>
      {#each data.lanes as lane, i (lane.id)}
        <span class="lane-head"><Mono name={lane.name} hue={i === 0 ? 195 : 55} size={24} />{lane.first}</span>
      {/each}
    </div>
    <div class="tape-body" style="--cols:{data.lanes.length}">
      <ol class="rail" aria-hidden="true">
        {#each hours as h (h.s)}<li style="--s:{h.s}">{h.label}</li>{/each}
      </ol>
      <div class="tracks">
        {#each data.lanes as lane (lane.id)}
          <div class="track">
            {#each runs[lane.id] as r (r.s)}
              <div class="run" data-open={r.l >= len ? '' : undefined} style="--s:{r.s}; --l:{r.l}"></div>
            {/each}
            {#each lane.blocks as b (b.id)}
              <div class="busy" data-mine={b.mine ? '' : undefined} style="--s:{b.s}; --l:{b.l}">
                {#if b.l >= 3}<span class="busy-label"><strong>{b.mine ? 'You: ' : ''}{b.dog}</strong><span>{b.service}</span></span>{/if}
              </div>
            {/each}
            {#each starts[lane.id] as s (s)}
              <button
                type="button"
                class="tile"
                data-tile
                data-lane={lane.id}
                data-s={s}
                style="--s:{s}"
                aria-pressed={pick?.lane === lane.id && pick?.s === s ? 'true' : 'false'}
                tabindex={focusKey === `${lane.id}:${s}` ? 0 : -1}
                aria-label="{dayLong(day)}, {slotClock(s)} with {lane.first}, ready by {endClock(s)}"
                onclick={() => onpick(lane.id, s)}
              ><span class="tile-time">{slotClock(s)}</span></button>
            {/each}
          </div>
        {/each}
        {#if pick}
          <div class="towel" bind:this={towelEl} style="--lane:{laneIndex}; --s:{pick.s}; --len:{len}" data-short={len < 4 ? '' : undefined} aria-hidden="true">
            <span class="towel-text"><strong>{dogName}</strong><span>{slotClock(pick.s)} to {endClock(pick.s)}</span></span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
