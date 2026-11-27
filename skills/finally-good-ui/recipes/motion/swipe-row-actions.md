# Recipe: swipe-row-actions

**Intent:** on a phone, a list row can be swiped sideways to reveal its one or two most common actions (archive, delete, mark done). The row follows the finger exactly, shows what will happen before release, then either commits or springs back. The same actions are always reachable without swiping.

**Cards:** motion.spatial-continuity · a11y.keyboard-complete · usability.user-control-undo · usability.self-evident · a11y.target-size · motion.easing-roles · motion.reduced-motion

**When NOT to use:** desktop pointer lists (use a visible row menu or hover actions); rows that scroll horizontally or contain sliders; the only way to reach an action (swipe is a shortcut, never the path); destructive actions with no Undo.

**Tokens:** `--duration-standard` (250, settle back or out) · `--duration-micro` (100, action label tint) · `--ease-snappy` (release) · `--ease-exit` · `--color-destructive`, `--color-success`, `--color-muted`

## Baseline
The row content slides over an action layer; during the drag nothing animates (the finger is the animation), only the release does.
```html
<li class="swipe" data-action="archive">
  <div class="swipe-under" aria-hidden="true"><span class="swipe-label">Archive</span></div>
  <div class="swipe-row">Rex · Full groom · Thu 10:30 <button class="row-menu" aria-label="Actions for Rex">⋯</button></div>
</li>
```
```css
.swipe { position: relative; overflow: hidden; touch-action: pan-y; }   /* vertical scroll stays native */
.swipe-under {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: flex-end;
  padding-inline: var(--space-4); background: var(--color-muted); color: var(--color-foreground);
  transition: background-color var(--duration-micro) var(--ease-move);
}
.swipe[data-armed] .swipe-under { background: var(--color-success); color: var(--color-success-foreground); }
.swipe[data-action="delete"][data-armed] .swipe-under { background: var(--color-destructive); color: var(--color-destructive-foreground); }
.swipe-row { position: relative; background: var(--color-background); transform: translateX(var(--dx, 0px)); }
.swipe[data-releasing] .swipe-row { transition: transform var(--duration-standard) var(--ease-snappy); }
.swipe[data-committing] .swipe-row { transition: transform var(--duration-standard) var(--ease-exit); }
@media (prefers-reduced-motion: reduce) {
  .swipe[data-releasing] .swipe-row, .swipe[data-committing] .swipe-row { transition: none; }
}
```

## Script
```js
import { ms } from "./motion-tokens"; // recipes/INDEX.md
const ARM_AT = 0.35;   // fraction of the row width that commits on release (business threshold, not motion)
const FLICK = 0.5;     // px per ms: a fast flick commits even below the threshold
export function swipeable(li, commit) {
  const row = li.querySelector(".swipe-row");
  let x0 = 0, y0 = 0, t0 = 0, dx = 0, dragging = false;
  row.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    x0 = e.clientX; y0 = e.clientY; t0 = e.timeStamp; dx = 0; dragging = false;
    li.removeAttribute("data-releasing");
    row.setPointerCapture(e.pointerId);
  });
  row.addEventListener("pointermove", (e) => {
    if (!row.hasPointerCapture(e.pointerId)) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!dragging && Math.abs(my) > Math.abs(mx)) { row.releasePointerCapture(e.pointerId); return; } // a scroll
    dragging = true;
    dx = Math.min(0, mx);                                                    // left only; mirror for RTL
    const over = Math.abs(dx) > row.offsetWidth * ARM_AT;
    li.toggleAttribute("data-armed", over);
    row.style.setProperty("--dx", `${dx}px`);
  });
  row.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    const fast = Math.abs(dx) / (e.timeStamp - t0) > FLICK;
    if (li.hasAttribute("data-armed") || fast) {
      li.setAttribute("data-committing", "");
      row.style.setProperty("--dx", `${-row.offsetWidth}px`);
      setTimeout(() => commit(li), ms("standard"));                         // then item-enter-exit removes the row
    } else {
      li.setAttribute("data-releasing", "");
      row.style.setProperty("--dx", "0px");
    }
    li.removeAttribute("data-armed");
  });
}
```
`commit` should go through item-enter-exit's `removeItem`, which collapses the gap and offers Undo. Pointer events cover touch and pen; mouse users get the row menu.

## React + Motion
Motion's `drag="x"` with `dragConstraints={{ left: -width, right: 0 }}`, `dragElastic={0}`, `onDragEnd` checking `info.offset.x` and `info.velocity.x`, then `animate(x, target, { duration: sec("standard"), ease: ease("snappy") })`. Only if Motion is already in the app.

## Vue / Svelte
Use the script as an action/directive (`use:swipeable={commit}` in Svelte, a `v-swipeable` directive in Vue).

## A11y
- Every swipe action also lives in the row's visible menu (⋯) and has a keyboard path (a11y.keyboard-complete).
- The revealed label says what will happen ("Archive"), in words, not only colour or an icon.
- Announce the result and the Undo in a polite live region.

## Upgrade trigger
A gesture library only if the app already has one (Motion, `@use-gesture`); the script above is enough for one direction and one action.
