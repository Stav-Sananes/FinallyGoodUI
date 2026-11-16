# Recipe: submit-states

**Intent:** a button that starts work (Book, Pay, Save, Send) shows each phase in place: idle, working, done (or failed), then back. The button keeps its size, can't be pressed twice, and the outcome is announced. Status lives where the person is looking.

**Cards:** usability.system-status · states.optimistic-feedback · states.error-recovery · usability.error-prevention · motion.purpose-only · motion.frequency-budget · writing.action-labels · motion.reduced-motion

**When NOT to use:** actions that finish in under ~300ms (show the result; a spinner that flashes is noise); optimistic actions that can be undone (apply at once and offer Undo, toast-stack); forms where the next page is the confirmation (navigate; the route transition is the feedback).

**Tokens:** `--duration-short` (150, label swap) · `--duration-standard` (250, done tick) · `--ease-move` · `--ease-enter` · `--ease-linear` (spinner) · `--color-primary`, `--color-success`, `--color-destructive`

## Baseline
All three labels sit in one grid cell, so the button is always as wide as its longest label: nothing jumps when the text changes.
```html
<button class="submit" data-state="idle" type="submit">
  <span class="submit-label" data-for="idle">Book Thursday 10:30</span>
  <span class="submit-label" data-for="pending" aria-hidden="true"><span class="spinner"></span>Booking…</span>
  <span class="submit-label" data-for="done" aria-hidden="true"><svg viewBox="0 0 16 16"><path class="submit-tick" d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>Booked</span>
</button>
<p class="visually-hidden" role="status" id="submit-status"></p>
```
```css
.submit { display: inline-grid; place-items: center; min-block-size: 44px; padding-inline: var(--space-4); }
.submit-label {
  grid-area: 1 / 1; display: inline-flex; align-items: center; gap: var(--space-2);
  opacity: 0; transform: translateY(4px);
  transition: opacity var(--duration-short) var(--ease-move), transform var(--duration-short) var(--ease-move);
}
.submit[data-state="idle"]    .submit-label[data-for="idle"],
.submit[data-state="pending"] .submit-label[data-for="pending"],
.submit[data-state="done"]    .submit-label[data-for="done"] { opacity: 1; transform: none; }
.submit[data-state="pending"] { cursor: progress; }
.submit[data-state="done"] { background: var(--color-success); }
.spinner {
  inline-size: 14px; block-size: 14px; border-radius: 50%;
  border: 2px solid currentColor; border-inline-end-color: transparent;
  animation: submit-spin calc(var(--duration-long) * 2) var(--ease-linear) infinite;
}
@keyframes submit-spin { to { transform: rotate(1turn); } }
.submit-tick { fill: none; stroke: currentColor; stroke-width: 2; stroke-dasharray: 1; stroke-dashoffset: 1; }
.submit[data-state="done"] .submit-tick { stroke-dashoffset: 0; transition: stroke-dashoffset var(--duration-standard) var(--ease-enter); }
@media (prefers-reduced-motion: reduce) {
  .submit-label { transform: none; }
  .spinner { animation: none; border-inline-end-color: currentColor; opacity: 0.6; }
}
```

## Script
```js
const PENDING_DELAY_MS = 300;  // business timing, not motion: don't flash a spinner for fast work
const DONE_HOLD_MS = 1600;     // how long "Booked" stays before the button resets (or the page moves on)
export async function submitWith(button, status, work) {
  if (button.dataset.state === "pending") return;
  button.setAttribute("aria-disabled", "true");         // not `disabled`: keeps focus on the button
  const slow = setTimeout(() => (button.dataset.state = "pending"), PENDING_DELAY_MS);
  try {
    await work();
    clearTimeout(slow);
    button.dataset.state = "done";
    status.textContent = "Booked for Thursday 10:30.";
    setTimeout(() => { button.dataset.state = "idle"; button.removeAttribute("aria-disabled"); }, DONE_HOLD_MS);
  } catch (err) {
    clearTimeout(slow);
    button.dataset.state = "idle";
    button.removeAttribute("aria-disabled");
    status.textContent = "";
    showFormError(err);   // states.error-recovery: say what happened and what to do, next to the button
  }
}
```
Guard the click handler on `aria-disabled` so double clicks do nothing. Failure goes back to idle with the error beside the button; the button never turns red and stays red.

## React + Motion
Not needed. In React keep `state` in `useState` and render the same three spans; `useFormStatus().pending` (React 19) drives `pending` for form actions.

## Vue / Svelte
Same markup with `:data-state` / `data-state={state}`.

## A11y
- `role="status"` announces the outcome once; the visible pending label is `aria-hidden` so it isn't read twice.
- `aria-disabled`, not `disabled`, while pending: a disabled button drops focus to `<body>`.
- The done colour is backed by the word and the tick (color.color-not-sole-signal).

## Upgrade trigger
None. If the action runs long (uploads, exports), switch to a real progress bar with a percentage and a Cancel.
