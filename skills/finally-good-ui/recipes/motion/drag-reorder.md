# Recipe: drag-reorder

**Intent:** people put items in their own order by dragging, by keyboard, or with "Move up / Move down", and the other items glide aside so it is always clear where the item will land.

**Cards:** motion.spatial-continuity · a11y.keyboard-complete · usability.user-control-undo · states.optimistic-feedback · motion.compositor-only · motion.reduced-motion

**When NOT to use:** order that the data already defines (date, priority, name: offer a sort instead); lists longer than about 50 visible items or virtualised lists (the stack profile's `interaction` lists `tanstack-virtual`): use a "Move to position…" action; between two separate lists only on boards (see Libraries).

**Tokens:** `--duration-standard` (250, neighbours glide) · `--duration-short` (150, drop settle) · `--ease-move` · `--ease-snappy` (settle) · `--shadow-lg` (lifted item) · `--color-ring`

## Three ways to move, all required
1. **Pointer drag** from a visible handle (a library, below).
2. **Keyboard**, on the handle button:
   | Key | Does |
   |---|---|
   | Space / Enter | pick up; again drops |
   | ↑ / ↓ (← / → in a horizontal list) | move one place while held |
   | Escape | cancel, item returns to where it started |
   | Tab | drops, then moves on |
3. **A visible alternative** with no dragging (WCAG 2.5.7): "Move up", "Move down", "Move to top" in the row's menu.

Announce every step in a polite live region: "Picked up Invoice 12, position 3 of 8.", "Moved to position 2 of 8.", "Dropped Invoice 12 at position 2.", "Cancelled. Invoice 12 is back at position 3."

## Visual
```css
.reorder-handle { touch-action: none; cursor: grab; }      /* only the handle: the row still scrolls the page */
.reorder-item { transition: box-shadow var(--duration-short) var(--ease-snappy), scale var(--duration-short) var(--ease-snappy); }
.reorder-item[data-dragging] {
  scale: 1.02; box-shadow: var(--shadow-lg); z-index: 1;
  cursor: grabbing; user-select: none;
}
.reorder-item[data-grabbed] { outline: 2px solid var(--color-ring); outline-offset: 2px; } /* keyboard pick-up */
@media (prefers-reduced-motion: reduce) {
  .reorder-item { transition: none; }
  .reorder-item[data-dragging] { scale: none; }   /* keep the shadow: it says "lifted" without moving */
}
```
- No rotation or wobble on the lifted item; a small lift and a shadow are enough.
- Neighbours glide with FLIP (list-reorder-flip) at `--duration-standard` / `--ease-move`; under reduced motion they jump.
- A cloned drag preview gets `aria-hidden="true"` and `inert`, so assistive tech doesn't see the item twice.

## Keyboard reorder (no library)
Uses the `flip()` helper from list-reorder-flip for the glide.
```js
export function keyboardReorder(list, announce, onCommit) {
  let held = null, startIndex = -1;
  const items = () => [...list.children];
  const name = (el) => el.dataset.name;
  const where = (el) => `position ${items().indexOf(el) + 1} of ${items().length}`;
  const move = (el, delta) => {
    const all = items(), to = all.indexOf(el) + delta;
    if (to < 0 || to >= all.length) return;
    flip(list, () => list.insertBefore(el, delta > 0 ? all[to].nextSibling : all[to]));
    el.querySelector(".reorder-handle").focus();
    announce(`Moved to ${where(el)}.`);
  };
  const drop = (cancel) => {
    if (cancel) flip(list, () => list.insertBefore(held, items().filter((x) => x !== held)[startIndex] ?? null));
    announce(cancel ? `Cancelled. ${name(held)} is back at ${where(held)}.` : `Dropped ${name(held)} at ${where(held)}.`);
    if (!cancel && items().indexOf(held) !== startIndex) onCommit(items().map((x) => x.dataset.id));
    held.removeAttribute("data-grabbed"); held.querySelector(".reorder-handle").setAttribute("aria-pressed", "false");
    held = null;
  };
  list.addEventListener("keydown", (e) => {
    const handle = e.target.closest(".reorder-handle");
    if (!handle) return;
    const item = handle.closest("[data-id]");
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (held) return drop(false);
      held = item; startIndex = items().indexOf(item);
      item.setAttribute("data-grabbed", ""); handle.setAttribute("aria-pressed", "true");
      announce(`Picked up ${name(item)}, ${where(item)}. Use the arrow keys to move, Space to drop, Escape to cancel.`);
    } else if (held && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault(); move(held, e.key === "ArrowUp" ? -1 : 1);
    } else if (held && e.key === "Escape") { e.preventDefault(); drop(true); }
    else if (held && e.key === "Tab") drop(false);
  });
}
```
Markup per row: `<li data-id="12" data-name="Invoice 12"><button class="reorder-handle" aria-pressed="false" aria-label="Reorder Invoice 12" aria-describedby="reorder-help">⋮⋮</button>…</li>` with one hidden `#reorder-help` paragraph explaining the keys.

## Saving
Reorder optimistically, save in the background, and on failure put the item back and say so in a toast with Retry (states.optimistic-feedback). Save the whole order (ids), not "moved from 3 to 2", so two quick moves can't race.

## Libraries (pointer drag)
Use what the stack profile's `interaction` lists; if none, propose one for the framework and ask first.
| Profile name | Use | Timing | Keyboard |
|---|---|---|---|
| `dnd-kit-next` (`@dnd-kit/react`, `/vue`, `/svelte`, `/solid`) | `useSortable({ id, index, transition: { duration: ms("standard"), easing: cssEase("snappy") } })` | ms + CSS string; reduced motion built in | built in, with announcements; replace its default messages with the ones above |
| `dnd-kit` (classic `@dnd-kit/sortable`) | `useSortable({ id, transition: { duration: msMotion("standard"), easing: cssEase("snappy") } })` with `KeyboardSensor` + `sortableKeyboardCoordinates` | ms + CSS string | built in once `KeyboardSensor` is added |
| `sortablejs` (also vuedraggable) | `Sortable.create(list, { handle: ".reorder-handle", animation: msMotion("standard"), easing: cssEase("move") })` | ms + CSS string | none: add `keyboardReorder` above |
| Motion `Reorder` (`animation` lists `motion`) | `<Reorder.Group axis="y" values={items} onReorder={setItems}>` with `<Reorder.Item value={item} dragListener={false} dragControls={controls}>` started from the handle | `transition={{ duration: sec("standard"), ease: ease("move") }}` | none: add `keyboardReorder` |
| `pragmatic-dnd` | boards, trees, and moves between lists at scale | no slide; use its post-move flash to mark the moved item | build the keyboard contract and "Move to…" menu yourself |

## A11y
- The handle is a real `<button>` with a name that includes the item ("Reorder Invoice 12").
- Never make the whole row the only drag target: it steals scrolling on touch and hides the affordance.
- Focus stays on the moved item's handle after every move and after drop.

## Upgrade trigger
Pointer drag needs one of the libraries above; keyboard and "Move up/down" never do. On a board with several lists, prefer Pragmatic DnD or dnd-kit and keep the "Move to list…" menu.
