# Recipe: list-stagger-enter

**Intent:** on first load, reveal a list or grid in reading order with a short cascade so structure registers before detail.

**Cards:** motion.purpose-only · motion.frequency-budget · motion.easing-roles · motion.compositor-only · motion.reduced-motion · states.loading-perceived

**When NOT to use:** on every re-render, filter, sort or pagination (stagger on first load only — use list-reorder-flip for changes); on lists the user visits many times a day (motion.frequency-budget); on long lists — cap the cascade at ~8 items; after a skeleton that already occupied the space (see skeleton-to-content).

**Tokens:** `--duration-medium` (300) · `--ease-enter` · stagger step 30–80ms (default 40ms; store as `--stagger`)

## CSS baseline
```html
<ul class="stagger" style="--stagger: 40ms">
  <li style="--i: 0">…</li><li style="--i: 1">…</li> <!-- set --i server-side or in the template loop -->
</ul>
```
```css
.stagger > * {
  animation: stagger-in var(--duration-medium) var(--ease-enter) both;
  animation-delay: calc(min(var(--i, 0), 7) * var(--stagger, 40ms)); /* items past 8 arrive together */
}
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(8px); }
}
/* first load only: remove the class after it has run, or scope it to a one-time attribute */
.stagger.is-settled > * { animation: none; }

@media (prefers-reduced-motion: reduce) {
  .stagger > * { animation-name: stagger-fade; animation-delay: 0ms; }
  @keyframes stagger-fade { from { opacity: 0; } }
}
```
```js
// mark settled after the cascade so re-renders (e.g. SPA state updates re-mounting items) don't replay it
const list = document.querySelector('.stagger');
Promise.all(list.getAnimations({ subtree: true }).map(a => a.finished))
  .then(() => list.classList.add('is-settled'));
```
- Keyframes here (not transitions) because there is no prior state to transition from; `both` holds the start frame during the delay.
- 8px travel, not 20+: the goal is order, not spectacle. Parent/container appears first (no delay), children follow.
- Newer browsers: `sibling-index()` can replace `--i`; not Baseline yet — keep `--i`.

## React + Motion
Worth it when items mount dynamically and you want variants to orchestrate parent → children.
```tsx
const list = { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0 } } };
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0, 1] } },
};
export function StaggerList({ items }: { items: Item[] }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const v = reduce ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : item;
  return (
    <m.ul variants={list} initial="hidden" animate="show">
      {items.map((it, i) => (
        // items added after first load (or past the 8th) start settled
        <m.li key={it.id} variants={i < 8 ? v : undefined} initial={mounted ? false : undefined}>
          {it.label}
        </m.li>
      ))}
    </m.ul>
  );
}
```

## Vue / Svelte
- Vue: `<TransitionGroup appear tag="ul" name="stagger">` with `:style="{ '--i': index }"` , `.stagger-enter-from { opacity: 0; transform: translateY(8px) }` and `.stagger-enter-active { transition: opacity 300ms, transform 300ms var(--ease-enter); transition-delay: calc(min(var(--i), 7) * 40ms) }`; `appear` runs it on initial render, but later additions would also enter — bind `:css="!loaded"` and set `loaded = true` after the cascade.
- Svelte: `in:fly={{ y: 8, duration: firstLoad ? 300 : 0, delay: firstLoad ? Math.min(i, 7) * 40 : 0, easing: cubicOut }}` inside `{#each}`; set `firstLoad = false` after the cascade so later additions don't replay it.

## A11y
- Content must be in the DOM and readable immediately; the animation is purely visual (no delayed insertion).
- Total cascade ≤ ~600ms so keyboard users aren't tabbing into invisible items.
- Reduced motion: fade only, no delay.

## Upgrade trigger
None. CSS covers it. Motion only if the project already uses it for other list motion.
