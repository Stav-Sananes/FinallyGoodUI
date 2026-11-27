# Recipe: bottom-sheet

**Intent:** on phones, a short task or a set of options rises from the bottom edge within thumb reach, can be dragged between heights or flicked away, and still works fully with a keyboard and a screen reader.

**Cards:** motion.spatial-continuity · motion.easing-roles · a11y.keyboard-complete · a11y.target-size · usability.user-control-undo · motion.reduced-motion

**When NOT to use:** on wide screens (switch to a centred dialog or a side panel above `640px`); for long forms or multi-step flows (a full page); for a single confirmation (dialog-enter-exit); when the content must stay visible next to the page (a non-modal panel). Don't add Vaul to new code: it is unmaintained (the stack profile reports it as `vaul-unmaintained`).

**Tokens:** `--duration-medium` (300, rise) · `--duration-short` (150, dismiss) · `--ease-snappy` (rise and snap) · `--ease-exit` · `--color-overlay` · `--radius-lg` · `--shadow-lg`

## Baseline: native `<dialog>`
`showModal()` gives the focus trap, Escape, the inert page and the backdrop.
```html
<dialog class="sheet" aria-labelledby="sheet-title">
  <button class="sheet-handle" aria-label="Resize sheet" aria-describedby="sheet-handle-help"></button>
  <p id="sheet-handle-help" hidden>Arrow keys change the height. Escape closes.</p>
  <h2 id="sheet-title">Filter orders</h2>
  <div class="sheet-body">…</div>
</dialog>
```
```css
.sheet {
  --sheet-y: 0px;
  inset: auto 0 0; margin: 0; width: 100%; max-width: none;
  max-height: calc(100dvh - 48px);
  border: 0; border-radius: var(--radius-lg) var(--radius-lg) 0 0; box-shadow: var(--shadow-lg);
  padding: 0 var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  transform: translateY(var(--sheet-y));
  transition:
    transform var(--duration-medium) var(--ease-snappy),
    overlay var(--duration-medium) allow-discrete, display var(--duration-medium) allow-discrete;
}
.sheet[open] { @starting-style { transform: translateY(100%); } }
.sheet:not([open]) { transform: translateY(100%); transition-duration: var(--duration-short); transition-timing-function: var(--ease-exit); }
.sheet[data-dragging] { transition: none; }            /* follow the finger exactly */
.sheet::backdrop { background: var(--color-overlay); opacity: 1;
  transition: opacity var(--duration-medium) var(--ease-snappy), overlay var(--duration-medium) allow-discrete, display var(--duration-medium) allow-discrete; }
.sheet[open]::backdrop { @starting-style { opacity: 0; } }
.sheet:not([open])::backdrop { opacity: 0; }
.sheet-handle { display: block; margin: var(--space-2) auto; width: 44px; height: 24px; /* target size; draw the 4px bar inside */
  background: linear-gradient(var(--color-border) 0 0) center / 36px 4px no-repeat; border: 0; touch-action: none; }
.sheet-body { overflow: auto; overscroll-behavior: contain; }

@media (prefers-reduced-motion: reduce) {
  .sheet, .sheet[open] { @starting-style { transform: none; opacity: 0; } }
  .sheet { transition: opacity var(--duration-short) linear, overlay var(--duration-short) allow-discrete, display var(--duration-short) allow-discrete; }
  .sheet:not([open]) { transform: none; opacity: 0; }   /* fade, don't slide */
}
@media (min-width: 640px) { /* wide screens: a centred dialog instead (dialog-enter-exit) */ }
```

## Drag, flick and snap
Drag only from the handle and the header, or from the body when it is scrolled to the top and the finger moves down; otherwise the body scrolls. Past the top snap point the sheet resists (rubber band).
```js
const FLICK_PX_PER_MS = 0.5;       // a flick dismisses even if the sheet barely moved
const PROJECTION_MS = 200;         // where a flick would carry the sheet, to pick the snap point
export function sheetDrag(sheet, snapFractions = [0]) {   // e.g. [0, 0.5]: full and half open (fraction hidden)
  const handle = sheet.querySelector(".sheet-handle");
  const snaps = () => snapFractions.map((f) => f * sheet.offsetHeight);
  let startY = 0, startOffset = 0, offset = 0, lastY = 0, lastT = 0, velocity = 0, index = 0;
  const set = (px) => { offset = px; sheet.style.setProperty("--sheet-y", `${px}px`); };
  const settle = (target) => { sheet.removeAttribute("data-dragging"); if (target === null) sheet.close(); else set(target); };

  sheet.addEventListener("pointerdown", (e) => {
    const body = sheet.querySelector(".sheet-body");
    if (!e.target.closest(".sheet-handle, h2") && !(body.contains(e.target) && body.scrollTop === 0)) return;
    startY = lastY = e.clientY; lastT = e.timeStamp; startOffset = offset; velocity = 0;
    sheet.setPointerCapture(e.pointerId); sheet.setAttribute("data-dragging", "");
  });
  sheet.addEventListener("pointermove", (e) => {
    if (!sheet.hasAttribute("data-dragging")) return;
    const dy = startOffset + e.clientY - startY;
    set(dy < 0 ? dy / (1 + Math.abs(dy) / 40) : dy);      // rubber band above the top
    velocity = (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT); lastY = e.clientY; lastT = e.timeStamp;
  });
  sheet.addEventListener("pointerup", () => {
    if (!sheet.hasAttribute("data-dragging")) return;
    const projected = offset + velocity * PROJECTION_MS;
    if (velocity > FLICK_PX_PER_MS || projected > sheet.offsetHeight * 0.6) return settle(null);
    const s = snaps(); index = s.reduce((best, y, i) => Math.abs(y - projected) < Math.abs(s[best] - projected) ? i : best, 0);
    settle(s[index]);
  });
  sheet.addEventListener("close", () => set(0));
  handle.addEventListener("keydown", (e) => {                 // the gesture's keyboard alternative
    const s = snaps(), last = s.length - 1;
    const next = { ArrowUp: Math.max(0, index - 1), ArrowDown: index + 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    if (next > last) return sheet.close();
    index = next; set(s[index]);
  });
}
```
Open with `sheet.showModal()`; move focus to the first control, or to the title (`tabindex="-1"`) when the first control would trigger something.

## Libraries
| Stack | Use | Timing |
|---|---|---|
| `primitives` has `base-ui` | Base UI `Drawer` | its open/close hooks per headless-primitive-motion; our tokens in CSS |
| `primitives` has `reka` (Vue) | Reka UI `Drawer` (replaces vaul-vue) | same |
| `interaction` has `vaul-unmaintained` | keep it working, plan the move to the primitive library's Drawer; its `0.5s` transition can be overridden with `[data-vaul-drawer] { transition-duration: var(--duration-medium); transition-timing-function: var(--ease-snappy); }` | – |
| none | the native baseline above | – |

## A11y
- Close is always possible without the gesture: Escape, a visible "Done" or "Close" button, and the backdrop.
- The handle is a button with arrow-key resizing; Home is fully open, End is the lowest snap point, ArrowDown past it closes.
- Return focus to the control that opened the sheet (native `<dialog>` does this).

## Upgrade trigger
Nested sheets, scroll-to-snap content inside the sheet, or iOS-style background scaling: use the installed primitive library's Drawer; if none, suggest Base UI (React) or Reka (Vue) and ask first.
