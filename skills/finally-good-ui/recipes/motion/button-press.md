# Recipe: button-press

**Intent:** confirm a press instantly with a small, interruptible scale-down so the button feels physical.

**Cards:** usability.system-status · motion.purpose-only · motion.frequency-budget · motion.compositor-only · a11y.focus-visible · a11y.target-size

**When NOT to use:** on links inside running text; on large surfaces (cards, rows) where scale shifts content noticeably — use a background/opacity change instead; on disabled buttons.

**Tokens:** `--duration-micro` (100) · `--duration-short` (150) · `--ease-snappy`

## CSS baseline
```css
.btn {
  transition:
    transform var(--duration-micro) var(--ease-snappy),
    background-color var(--duration-short) var(--ease-snappy);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.btn:active:not(:disabled) { transform: scale(0.97); }

@media (hover: hover) and (pointer: fine) {
  .btn:hover:not(:disabled) { background-color: var(--color-primary-hover, var(--color-primary)); }
}

.btn:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .btn { transition: background-color var(--duration-short) linear; }
  .btn:active:not(:disabled) { transform: none; opacity: 0.85; }
}
```
- CSS transitions (not keyframes) so a quick tap-release reverses mid-way without a jump.
- Scale .97 is enough; below .95 reads as a glitch. Never animate `width`/`padding`.
- Hover colour only for fine pointers — touch devices get sticky hover otherwise.

## React + Motion
Only worth it when the button already uses Motion for other states (loading → success morph). Otherwise use the CSS.
```tsx
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { sec, ease } from "./motion-tokens"; // recipes/INDEX.md

export function PressButton(props: React.ComponentProps<typeof m.button>) {
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={domAnimation}>
      <m.button
        whileTap={reduce ? { opacity: 0.85 } : { scale: 0.97 }}
        transition={{ duration: sec('micro'), ease: ease('snappy') }}
        {...props}
      />
    </LazyMotion>
  );
}
```

## Vue / Svelte
Pure CSS — put the class on the component's root `<button>`. No framework transition needed.

## A11y
- Use a real `<button>`; press feedback must not replace a visible `:focus-visible` ring.
- Target ≥ 24×24px (44 on touch). The scale must not shrink the hit area — `transform` doesn't.
- Loading state: keep the width stable (reserve spinner space), set `aria-busy="true"`, keep the label readable.

## Upgrade trigger
None. Suggest Motion only if the project already ships it and the button morphs between states (label → spinner → check).
