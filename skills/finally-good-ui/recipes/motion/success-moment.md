# Recipe: success-moment

**Intent:** the app's main expressive moment (motion.one-signature-moment allows up to three): when the person finishes the thing they came to do (booked, paid, planned the week, closed the last issue), the confirmation arrives with a little more ceremony than anything else in the app. A ring settles, a tick draws, the key fact (time, amount, count) lands last. It happens at most once per task and finishes within 600ms.

**Cards:** motion.one-signature-moment · motion.tension-delight-speed · motion.frequency-budget · usability.system-status · motion.easing-roles · motion.reduced-motion · personality.calm · personality.playful

**When NOT to use:** routine saves and edits (submit-states or a toast); anything the person does many times a session; tools for experts in short bursts, where the signature is only the done tick of submit-states; more than three expressive moments in the same app. Never confetti, never sound, never a modal that blocks the next step.

**Tokens:** `--duration-hero` (600, the whole sequence's ceiling) · `--duration-medium` (300, tick) · `--duration-short` (150, steps between parts) · `--ease-enter-emphasized` (arrivals) · `--ease-enter` · `--color-success`, `--color-primary`

## Baseline
Three parts, staggered by one short step each, all inside 600ms: the ring scales in from 0.6 with the emphasized curve, the tick draws, then the fact rises into place. Every selector carries "signature" so check-static accepts the long duration (and still holds the 600ms ceiling).
```html
<section class="done-signature" role="status" aria-live="polite">
  <svg class="done-signature-mark" viewBox="0 0 48 48" aria-hidden="true">
    <circle class="done-signature-ring" cx="24" cy="24" r="22"/>
    <path class="done-signature-tick" d="M15 24.5l6 6 12-13" pathLength="1"/>
  </svg>
  <h2 class="done-signature-title">Booked</h2>
  <p class="done-signature-fact">Rex, full groom · Thursday 13 Nov, 10:30</p>
  <a class="button" href="/bookings">See your bookings</a>
</section>
```
```css
.done-signature { display: grid; justify-items: center; gap: var(--space-3); text-align: center; }
.done-signature-mark { inline-size: 48px; block-size: 48px; }
.done-signature-ring {
  fill: color-mix(in oklch, var(--color-success) 14%, transparent); stroke: var(--color-success); stroke-width: 2;
  transform-origin: center; transform-box: fill-box;
  animation: signature-ring var(--duration-long) var(--ease-enter-emphasized) both;
}
.done-signature-tick {
  fill: none; stroke: var(--color-success); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 1;
  animation: signature-tick var(--duration-medium) var(--ease-enter) var(--duration-standard) forwards;
}
.done-signature-title, .done-signature-fact {
  animation: signature-rise var(--duration-medium) var(--ease-enter) both;
  animation-delay: var(--duration-medium);
}
.done-signature-fact { font-variant-numeric: tabular-nums; }
@keyframes signature-ring { from { transform: scale(0.6); opacity: 0; } }
@keyframes signature-tick { to { stroke-dashoffset: 0; } }
@keyframes signature-rise { from { transform: translateY(16px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .done-signature-ring, .done-signature-title, .done-signature-fact { animation-name: signature-fade; }
  .done-signature-tick { animation: none; stroke-dashoffset: 0; }
}
@keyframes signature-fade { from { opacity: 0; } }
```
Timeline at the defaults: ring 0–400ms, tick 250–550ms, words 300–600ms. The person can act on the link immediately; nothing waits for the animation.

## Once per task
Play the moment only on the transition into "done" (after the request succeeds), not when the confirmation page is reloaded or reached from history. Otherwise show the same block already settled:
```css
.done-signature[data-settled] * { animation: none; }
.done-signature[data-settled] .done-signature-tick { stroke-dashoffset: 0; }
```
```js
// the submit handler navigates with history.pushState({ justBooked: true }, "", "/booked")
if (history.state?.justBooked) history.replaceState({}, "");   // play it this once
else block.setAttribute("data-settled", "");                    // reload, back/forward: no replay
```

## Pairing with a number
If the fact is a figure that just changed (a balance after paying, "12 of 12 done"), count it with number-change, started as the tick ends, and keep the whole sequence inside the 600ms ceiling.

## React + Motion
Not needed. If Motion is in the app: three `m` elements with `transition={{ duration: sec("standard"), ease: ease("enter"), delay: … }}` and `MotionConfig reducedMotion="user"`; the CSS above is shorter.

## Vue / Svelte
Mount the block with the classes; CSS animations start on insertion.

## A11y
- `role="status"` reads the title and fact once; the mark is `aria-hidden`.
- The confirmation text is complete without the animation (the reduced-motion version is the same page, faded in).
- Focus moves to the title (`tabindex="-1"`) after a full-page step, so keyboard and screen-reader users land on the result.

## Upgrade trigger
dotLottie or Rive only when the brand has a drawn mascot or mark that must move; keep the same 600ms ceiling and a static final frame under reduced motion.
