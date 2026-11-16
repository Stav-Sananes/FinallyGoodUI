# Recipe: control-states

**Intent:** the small controls people touch all day answer at once and show what changed. A checkbox draws its tick, a switch thumb slides to the side that means "on", a radio dot grows into place, an icon that toggles (play/pause, menu/close) turns into its counterpart, and a clickable card lifts slightly under a mouse. None of it delays the state change; the state is true the instant it's clicked.

**Cards:** usability.system-status · motion.frequency-budget · motion.compositor-only · motion.easing-roles · a11y.focus-visible · a11y.target-size · color.color-not-sole-signal · motion.reduced-motion

**When NOT to use:** bulk selection (a "select all" ticking 200 rows animates nothing: swap states instantly); controls driven from the keyboard in a dense expert list where the change is already obvious (motion.frequency-budget: keep the tick, drop the hover lift); hover lift on things that aren't clickable as a whole (a card with three buttons inside lifts nothing); touch screens (no hover).

**Tokens:** `--duration-micro` (100, thumb, dot, icon swap) · `--duration-short` (150, tick draw, hover lift) · `--ease-snappy` (direct manipulation) · `--ease-move` · `--color-primary`, `--color-primary-foreground` · `--color-border` · `--color-ring`

## Checkbox with a drawn tick
Native input, restyled; the tick is an SVG path drawn by `stroke-dashoffset` (a compositor-friendly paint, no layout).
```html
<label class="check">
  <input type="checkbox" name="done">
  <svg class="check-box" viewBox="0 0 16 16" aria-hidden="true"><path class="check-tick" d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>
  Walk booked
</label>
```
```css
.check { display: inline-flex; align-items: center; gap: var(--space-2); min-block-size: 44px; cursor: pointer; }
.check input { position: absolute; opacity: 0; inline-size: 1px; block-size: 1px; }
.check-box {
  inline-size: 18px; block-size: 18px; flex: none; border-radius: var(--radius-sm);
  border: 1.5px solid var(--color-border); background: var(--color-background);
  transition: background-color var(--duration-micro) var(--ease-move), border-color var(--duration-micro) var(--ease-move);
}
.check-tick {
  fill: none; stroke: var(--color-primary-foreground); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 1;
  transition: stroke-dashoffset var(--duration-short) var(--ease-move);
}
.check input:checked + .check-box { background: var(--color-primary); border-color: var(--color-primary); }
.check input:checked + .check-box .check-tick { stroke-dashoffset: 0; }
.check input:focus-visible + .check-box { outline: 2px solid var(--color-ring); outline-offset: 2px; }
.check input:active + .check-box { transform: scale(0.94); transition: transform var(--duration-instant) var(--ease-snappy); }
```
Unticking runs the same path backwards. `pathLength="1"` makes the dash maths independent of the path's real length.

## Switch
A `button role="switch"` or a native checkbox with `switch` semantics; the thumb moves with `transform`, never `left`.
```html
<button class="switch" role="switch" aria-checked="false"><span class="switch-thumb"></span><span class="visually-hidden">Reminders</span></button>
```
```css
.switch {
  inline-size: 40px; block-size: 24px; padding: 2px; border-radius: 999px; border: 0;
  background: var(--color-muted); cursor: pointer;
  transition: background-color var(--duration-micro) var(--ease-move);
}
.switch-thumb {
  display: block; inline-size: 20px; block-size: 20px; border-radius: 50%;
  background: var(--color-background); box-shadow: 0 1px 2px oklch(0 0 0 / 0.2);
  transition: transform var(--duration-micro) var(--ease-snappy);
}
.switch[aria-checked="true"] { background: var(--color-primary); }
.switch[aria-checked="true"] .switch-thumb { transform: translateX(16px); }
[dir="rtl"] .switch[aria-checked="true"] .switch-thumb { transform: translateX(-16px); }
.switch:active .switch-thumb { transform: scaleX(1.15); }          /* the thumb stretches under the finger */
.switch[aria-checked="true"]:active .switch-thumb { transform: translateX(14px) scaleX(1.15); }
.switch:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
```
```js
switchEl.addEventListener("click", () => switchEl.setAttribute("aria-checked", String(switchEl.getAttribute("aria-checked") !== "true")));
```
On is never colour alone: the thumb's side carries it, and the label says what it controls.

## Radio dot
```css
.radio input { position: absolute; opacity: 0; }
.radio-dot { inline-size: 18px; block-size: 18px; border-radius: 50%; border: 1.5px solid var(--color-border); display: grid; place-items: center; }
.radio-dot::after {
  content: ""; inline-size: 8px; block-size: 8px; border-radius: 50%; background: var(--color-primary-foreground);
  transform: scale(0.4); opacity: 0;
  transition: transform var(--duration-micro) var(--ease-snappy), opacity var(--duration-micro) var(--ease-move);
}
.radio input:checked + .radio-dot { background: var(--color-primary); border-color: var(--color-primary); }
.radio input:checked + .radio-dot::after { transform: scale(1); opacity: 1; }
```
The dot starts at 0.4, never 0 (things don't appear from nowhere).

## Icon morph (play/pause, menu/close, copy/copied)
Two icons stacked in one box; the outgoing one turns and fades while the incoming one turns in. One button, its label swapped with the state.
```html
<button class="icon-toggle" aria-pressed="false" aria-label="Play">
  <svg class="icon-a" aria-hidden="true">…play…</svg>
  <svg class="icon-b" aria-hidden="true">…pause…</svg>
</button>
```
```css
.icon-toggle { display: grid; place-items: center; inline-size: 44px; block-size: 44px; }
.icon-toggle > svg {
  grid-area: 1 / 1; inline-size: 20px; block-size: 20px;
  transition: transform var(--duration-micro) var(--ease-move), opacity var(--duration-micro) var(--ease-move);
}
.icon-toggle .icon-b { opacity: 0; transform: rotate(-90deg) scale(0.6); }
.icon-toggle[aria-pressed="true"] .icon-a { opacity: 0; transform: rotate(90deg) scale(0.6); }
.icon-toggle[aria-pressed="true"] .icon-b { opacity: 1; transform: none; }
```
"Copied" confirmations swap back after a timer: that timer is business logic, not motion (name it `COPIED_RESET_MS`, not a duration token).

## Hover lift on a clickable card
Only where the whole card is one link, and only for a real mouse.
```css
@media (hover: hover) and (pointer: fine) {
  .card-link { transition: transform var(--duration-short) var(--ease-move), box-shadow var(--duration-short) var(--ease-move); }
  .card-link:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .card-link:active { transform: translateY(0); transition-duration: var(--duration-instant); }
}
```
Two pixels, not eight: the lift says "this is one target", it isn't an event.

## Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  .switch-thumb, .radio-dot::after, .icon-toggle > svg { transition-property: opacity; }
  .switch[aria-checked="true"] .switch-thumb { transition: none; }   /* jump, don't slide */
  .card-link:hover { transform: none; }
}
```
The tick still draws (it is a short fade-like reveal in place, not movement across the screen).

## React + Motion
Not needed: CSS covers every state. With Motion already in use, `whileTap={{ scale: 0.94 }}` on the box is the only addition worth making.

## Vue / Svelte
Bind `:aria-checked` / `aria-checked={on}`; the CSS does the rest.

## A11y
- Native inputs where possible; a styled `button role="switch"` must toggle on Space and Enter and announce its state.
- The hit area is the whole label row, at least 44px tall on touch (a11y.target-size).
- Focus ring on the visible box, not the hidden input.

## Upgrade trigger
None: these stay CSS. A primitive library (Radix, Base UI, React Aria) brings its own `data-state`/`data-checked` hooks; key these selectors on them (headless-primitive-motion).
