# Recipe: slot-picker

**Intent:** picking a day and a time feels like moving through a calendar, not reloading one. Changing the week or month slides the grid in the direction of travel; choosing a day reveals that day's times beneath it; the chosen time is marked with an indicator that moves from the previous choice. Taken slots are visibly unavailable, not hidden.

**Cards:** motion.spatial-continuity · motion.duration-by-distance · ia-nav.progressive-disclosure · flows-forms.sensible-defaults · usability.error-prevention · a11y.keyboard-complete · a11y.target-size · motion.reduced-motion

**When NOT to use:** typing a known date (a date field with a format hint is faster: birthdays, card expiry); pickers inside dense admin forms used dozens of times a day (no slide, instant swap); a library date picker already in use (theme its own animation: react-day-picker's `--rdp-animation_duration`, recipes/INDEX.md).

**Tokens:** `--duration-standard` (250, week/month slide) · `--duration-short` (150, times reveal, selection indicator) · `--ease-move` · `--ease-enter` · `--color-primary`, `--color-primary-foreground`, `--color-muted-foreground`

## Week or month change slides with direction
The incoming grid comes from the side the person moved towards; the outgoing one leaves the other way. One container, two layers during the change.
```css
.cal-viewport { display: grid; overflow: hidden; }
.cal-grid { grid-area: 1 / 1; }
.cal-grid[data-enter] { animation: cal-in var(--duration-standard) var(--ease-move) both; }
.cal-grid[data-leave] { animation: cal-out var(--duration-standard) var(--ease-move) both; }
@keyframes cal-in  { from { transform: translateX(calc(var(--dir, 1) * 24px)); opacity: 0; } }
@keyframes cal-out { to   { transform: translateX(calc(var(--dir, 1) * -24px)); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .cal-grid[data-enter] { animation-name: cal-fade-in; }
  .cal-grid[data-leave] { animation-name: cal-fade-out; }
}
@keyframes cal-fade-in  { from { opacity: 0; } }
@keyframes cal-fade-out { to { opacity: 0; } }
```
```js
import { ms } from "./motion-tokens"; // recipes/INDEX.md
export function changePeriod(viewport, renderGrid, dir /* 1 = next, -1 = previous */) {
  const old = viewport.querySelector(".cal-grid:not([data-leave])");
  const next = renderGrid();
  viewport.style.setProperty("--dir", document.dir === "rtl" ? -dir : dir);
  old.setAttribute("data-leave", ""); old.inert = true;
  next.setAttribute("data-enter", "");
  viewport.append(next);
  setTimeout(() => { old.remove(); next.removeAttribute("data-enter"); }, ms("standard"));
}
```
24px of travel, not the full width: enough to show direction without making the person wait for a page to slide past.

## A day's times reveal under it
Use the grid-rows reveal from accordion-auto-height for the times panel (`grid-template-rows: 0fr → 1fr`, `--duration-short`), so the page below moves down smoothly instead of jumping. Choosing another day swaps the times inside the open panel with a crossfade, without closing and reopening it.

## The chosen slot: an indicator that travels
The selected style is one absolutely positioned element moved to the chosen slot with `transform` (the tabs-indicator technique); the slots themselves don't animate.
```css
.slots { position: relative; display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: var(--space-2); }
.slot { position: relative; z-index: 1; min-block-size: 44px; }
.slot[aria-checked="true"] { color: var(--color-primary-foreground); }
.slot[aria-disabled="true"] { color: var(--color-muted-foreground); text-decoration: line-through; }
.slot-indicator {
  position: absolute; inset-block-start: 0; inset-inline-start: 0; border-radius: var(--radius-md);
  background: var(--color-primary);
  inline-size: var(--w); block-size: var(--h); transform: translate(var(--x), var(--y));
  transition: transform var(--duration-short) var(--ease-move);
}
@media (prefers-reduced-motion: reduce) { .slot-indicator { transition: none; } }
```
```js
export function moveIndicator(indicator, slot) {
  const s = slot.getBoundingClientRect(), p = slot.parentElement.getBoundingClientRect();
  indicator.style.cssText += `--x:${s.left - p.left}px;--y:${s.top - p.top}px;--w:${s.width}px;--h:${s.height}px`;
}
```
Size changes are set, not transitioned (no layout animation); only the move is animated. When the first slot is picked, place the indicator without a transition.

## Structure and keyboard
- Days: a grid (`role="grid"`) with arrow keys between days, Page Up/Down for the period, Home/End for the week (WAI-ARIA APG date picker).
- Times: a `radiogroup` of `role="radio"` buttons (or native radios); arrow keys move the choice, unavailable slots are `aria-disabled` and skipped.
- Pre-select the soonest sensible slot only if the brief says most people take the first one (flows-forms.sensible-defaults).

## React + Motion
Motion `AnimatePresence mode="popLayout" custom={dir}` with `x: dir * 24` for the grids, and `layoutId="slot"` on the indicator for the travel (needs `domMax`). Only if Motion is already present.

## Vue / Svelte
Vue `<Transition :name="dir > 0 ? 'cal-next' : 'cal-prev'">`; Svelte `in:fly={{ x: dir * 24, duration: msMotion("standard"), easing: easeFn("move") }}` with `out:fly` mirrored.

## A11y
- Announce the visible period when it changes ("November 2026") in a polite live region.
- Disabled slots say why in their accessible name ("10:30, taken").
- The chosen slot is announced by its radio state, not by the indicator.

## Upgrade trigger
react-day-picker (or the kit's calendar) when the picker needs ranges, locales and many formats; feed it the tokens through its CSS variables.
