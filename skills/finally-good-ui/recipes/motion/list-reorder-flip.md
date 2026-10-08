# Recipe: list-reorder-flip

**Intent:** when items sort, filter, insert or delete, each one glides to its new place so the user can track what changed.

**Cards:** motion.spatial-continuity · usability.system-status · motion.compositor-only · motion.duration-by-distance · motion.reduced-motion · data.dense-tables

**When NOT to use:** on large lists (> ~50 visible items) or virtualised tables — animate only the changed row's highlight instead; on live data that updates every second (motion becomes noise — motion.frequency-budget); when the whole list is replaced (crossfade instead).

**Tokens:** `--duration-standard` (250) · `--ease-move` · `--duration-short` (150, removal) · `--ease-exit`

## CSS/JS baseline (FLIP with the Web Animations API)
First → Last → Invert → Play: measure, change the DOM, then animate each item from its old offset back to zero with `transform` only.
```js
import { ms, ease } from './motion-tokens.js'; // recipes/INDEX.md
const bez = (name) => `cubic-bezier(${ease(name)})`;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Items need a stable data-id. `mutate` may reorder, insert or remove children (sync).
export function flip(container, mutate, { duration = ms('standard') } = {}) {
  const first = new Map([...container.children].map(el => [el.dataset.id, el.getBoundingClientRect()]));
  mutate();
  for (const el of container.children) {
    const f = first.get(el.dataset.id);
    if (!f) { // inserted
      el.animate([{ opacity: 0, transform: reduce() ? 'none' : 'scale(0.97)' }, { opacity: 1, transform: 'none' }],
                 { duration, easing: bez('move') });
      continue;
    }
    if (reduce()) continue;
    const l = el.getBoundingClientRect();
    const dx = f.left - l.left, dy = f.top - l.top;
    if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                             { duration, easing: bez('move') });
  }
}

// Removal: fade the item out first, then FLIP the rest into the gap.
export async function removeWithFlip(container, el) {
  await el.animate([{ opacity: 1 }, { opacity: 0 }],
                   { duration: ms('short'), easing: bez('exit'), fill: 'forwards' }).finished;
  flip(container, () => el.remove());
}
```
Usage: `flip(list, () => sorted.forEach(el => list.append(el)))`.
- Scale distortion: if item *sizes* change too, children stretch — animate size changes with a crossfade instead, or use Motion's `layout` (it corrects children).
- Keep `duration` 200–300ms regardless of travel; long lists moving far should not take longer (motion.frequency-budget beats distance here).

## Alternative: same-document View Transitions (Baseline)
Give each item `style="view-transition-name: row-<id>"` and wrap the DOM change: `document.startViewTransition?.(() => mutate()) ?? mutate()`. Simpler, but snapshots the page and blocks interaction for the duration; prefer FLIP for frequent actions.

## React + Motion
Motion's `layout` is FLIP with scale correction — this is where Motion earns its size.
```tsx
import { sec, ease } from "./motion-tokens"; // recipes/INDEX.md
<LazyMotion features={domMax}>   {/* layout animations need domMax */}
  <ul>
    <AnimatePresence initial={false} mode="popLayout">
      {rows.map(r => (
        <m.li key={r.id} layout={!reduce}
              transition={{ layout: { duration: sec('standard'), ease: ease('move') } }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: sec('short') } }}>
          {r.label}
        </m.li>
      ))}
    </AnimatePresence>
  </ul>
</LazyMotion>
```
`domMax` is larger than `domAnimation`; load it only on screens that reorder.

## Vue / Svelte
- Vue: `<TransitionGroup tag="ul" name="list">` + `.list-move { transition: transform var(--duration-standard) var(--ease-move) }`; for removals add `.list-leave-active { position: absolute }` so siblings can move.
- Svelte: `{#each rows as r (r.id)}<li animate:flip={{ duration: ms('standard') }} out:fade={{ duration: ms('short') }}>` — keyed each is required. Under reduced motion pass `duration: 0`.

## A11y
- Announce the result, not the motion: "Sorted by due date, ascending" in a polite live region; sortable headers use `aria-sort`.
- Keep focus on the moved item (same DOM node) — don't re-create nodes on sort.
- Reduced motion: skip movement, keep the insertion fade.

## Upgrade trigger
Drag-to-reorder → suggest a library (React: `dnd-kit` or Motion `Reorder` if Motion is present; Vue/Svelte/vanilla: SortableJS). State the size and that keyboard reordering must be supported.
