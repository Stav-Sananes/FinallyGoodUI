# Recipe: item-enter-exit

**Intent:** when the person adds or removes one item from a list, the list makes room or closes the gap smoothly, so they see where the item went and nothing else jumps. A new item is briefly marked so the eye finds it; a removed item leaves with an Undo.

**Cards:** motion.spatial-continuity · usability.system-status · usability.user-control-undo · states.optimistic-feedback · motion.compositor-only · motion.frequency-budget · motion.reduced-motion

**When NOT to use:** first load (list-stagger-enter, once); sort and filter (list-reorder-flip moves the survivors); more than a handful of items at once (bulk delete swaps instantly, then one toast); virtualised lists (never animate row height there); keyboard-driven triage where the person removes items in quick succession (motion.frequency-budget: collapse instantly, keep the Undo).

**Tokens:** `--duration-short` (150, exit) · `--duration-medium` (300, enter) · `--duration-medium` (300, new-item tint fade, after the row opens) · `--ease-enter` · `--ease-exit` · `--ease-move` · `--color-accent` (new-item tint)

## Baseline
Each row sits in a grid-rows wrapper, so its height animates to and from its real size without measuring (the same technique as accordion-auto-height).
```html
<ul class="items">
  <li class="item" data-state="in"><div class="item-inner">Chicken tray bake · Tue</div></li>
</ul>
```
```css
.item {
  display: grid; grid-template-rows: 1fr; opacity: 1;
  transition: grid-template-rows var(--duration-medium) var(--ease-move), /* fgu-allow: animate-layout-prop */
              opacity var(--duration-medium) var(--ease-enter),
              transform var(--duration-medium) var(--ease-enter);
}
.item-inner { overflow: hidden; min-block-size: 0; }
.item[data-state="entering"] { grid-template-rows: 0fr; opacity: 0; transform: translateY(-12px); }
.item[data-state="leaving"] {
  grid-template-rows: 0fr; opacity: 0; transform: translateX(-24px);
  transition-duration: var(--duration-short); transition-timing-function: var(--ease-exit);
  pointer-events: none;
}
.item[data-new] .item-inner { animation: item-new var(--duration-medium) var(--ease-move) var(--duration-standard) both; }
@keyframes item-new { from { background: var(--color-accent); } }
@media (prefers-reduced-motion: reduce) {
  .item { transition-property: opacity; }
  .item[data-state="entering"], .item[data-state="leaving"] { transform: none; }
}
```
`translateX(-24px)` on exit says "moved aside", not "flew away"; in RTL use logical direction (`[dir=rtl] .item[data-state="leaving"] { transform: translateX(24px); }`).

## Script
```js
import { ms, msMotion } from "./motion-tokens"; // recipes/INDEX.md
export function addItem(list, li) {
  li.dataset.state = "entering";
  li.setAttribute("data-new", "");
  list.prepend(li);
  requestAnimationFrame(() => requestAnimationFrame(() => (li.dataset.state = "in")));  // after first paint
  li.addEventListener("animationend", () => li.removeAttribute("data-new"), { once: true });
}
export function removeItem(li, { onUndo } = {}) {
  const parent = li.parentNode, next = li.nextSibling;
  li.dataset.state = "leaving";
  setTimeout(() => li.remove(), ms("short"));       // wait for the exit, then drop it from the DOM
  showUndoToast("Removed “Chicken tray bake”.", () => { // toast-stack recipe
    parent.insertBefore(li, next); addItem(parent, li); onUndo?.();
  });
  moveFocusAfterDelete(li);                           // patterns/focus-after-delete
}
```
The double `requestAnimationFrame` lets the browser paint the collapsed state before it opens. Under reduced motion the rows fade but don't grow, and `ms("short")` still waits for the fade.

## Swipe to act (phone)
Rows that can be swiped (archive, delete) use recipes/motion/swipe-row-actions.md; on release past the threshold they call `removeItem`.

## React + Motion
With Motion already present, `AnimatePresence` + `m.li` with `initial={{ height: 0, opacity: 0 }}`, `animate={{ height: "auto", opacity: 1 }}`, `exit={{ height: 0, opacity: 0 }}` and `transition={{ duration: sec("standard"), ease: ease("move") }}`; `height: auto` needs `domMax` only if you also use `layout`. Keep `key` stable (the item id), never the index.

## Vue / Svelte
Vue `<TransitionGroup tag="ul" name="item">` with `.item-enter-from`, `.item-leave-to` holding the `entering`/`leaving` rules above. Svelte `transition:slide={{ duration: msMotion("standard"), easing: easeFn("move") }}` on each `<li>` (slide animates height, the standard way there).

## A11y
- Announce the change in a polite live region ("Added to Tuesday", "Removed. Undo available"), not the animation.
- After a removal, focus goes to the next item, or the previous one, or the list's heading (focus-after-delete).
- The Undo is reachable by keyboard and stays long enough to reach (toast-stack).

## Upgrade trigger
Motion's `AnimatePresence` when exits must be interruptible mid-flight (the person undoes before the exit ends) in a React app that already uses Motion.
