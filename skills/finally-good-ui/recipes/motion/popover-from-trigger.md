# Recipe: popover-from-trigger

**Intent:** menus, popovers and tooltips grow out of the control that opened them, so the eye links cause and effect.

**Cards:** motion.spatial-continuity · motion.duration-by-distance · motion.easing-roles · motion.compositor-only · motion.reduced-motion · usability.user-control-undo

**When NOT to use:** tooltips on keyboard-heavy expert UIs shown on every hover (use opacity only, ≤100ms, and a delay); full dialogs (see dialog-enter-exit); anything opened hundreds of times a day — consider instant.

**Tokens:** `--duration-short` (150, enter) · `--duration-micro` (100, exit) · `--ease-snappy` (enter) · `--ease-exit`

## CSS baseline (Popover API + `@starting-style`, Baseline)
```html
<button popovertarget="menu" id="menu-btn">Sort</button>
<div id="menu" popover class="popover" data-side="bottom-start" role="menu">…</div>
```
```css
.popover {
  /* exit state + exit timing (applies when closing) */
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity var(--duration-micro) var(--ease-exit),
    transform var(--duration-micro) var(--ease-exit),
    display var(--duration-micro) allow-discrete,
    overlay var(--duration-micro) allow-discrete;
}
.popover:popover-open {
  opacity: 1;
  transform: scale(1);
  transition-duration: var(--duration-short);
  transition-timing-function: var(--ease-snappy);
}
@starting-style {
  .popover:popover-open { opacity: 0; transform: scale(0.95); }
}
/* origin = the corner nearest the trigger */
.popover[data-side="bottom-start"] { transform-origin: top left; }
.popover[data-side="bottom-end"]   { transform-origin: top right; }
.popover[data-side="top-start"]    { transform-origin: bottom left; }
.popover[data-side="top-end"]      { transform-origin: bottom right; }

@media (prefers-reduced-motion: reduce) {
  .popover, .popover:popover-open { transform: none; }
  @starting-style { .popover:popover-open { transform: none; } }
}
```
- Never `scale(0)`: nothing in the real world appears from a point. .95 → 1 is enough.
- Positioning: use CSS anchor positioning where the stack's browser targets support it, else Floating UI / the component library; set `data-side` from the resolved placement so the origin follows flips.
- `transition: overlay` is Chromium-only; harmless elsewhere (the exit may just cut sooner).

## React + Motion
Use when the stack already has Radix/shadcn (they expose the origin as a CSS var).
```tsx
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import * as Popover from "@radix-ui/react-popover";

export function AnimatedPopover({ open, onOpenChange, trigger, children }: Props) {
  const reduce = useReducedMotion();
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 };
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content asChild forceMount sideOffset={6}>
                <m.div
                  style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
                  initial={hidden}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                  exit={{ ...hidden, transition: { duration: 0.1, ease: [0.3, 0, 1, 1] } }}
                >
                  {children}
                </m.div>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>
      </LazyMotion>
    </Popover.Root>
  );
}
```
Without Motion, shadcn's `data-[state=open]:animate-in zoom-in-95` utilities are acceptable — check they use `--radix-*-transform-origin`.

## Vue / Svelte
- Vue: `<Transition name="pop">` with `.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(.95) }` and the enter/leave timings above on `.pop-enter-active` / `.pop-leave-active`.
- Svelte: `transition:scale={{ start: 0.95, opacity: 0, duration: 150, easing: cubicOut }}`; set `transform-origin` via a style bound to the placement. Use `in:`/`out:` separately for a faster exit.

## A11y
- Focus moves into menus on open and back to the trigger on close; `Escape` closes (the Popover API and Radix handle this).
- `aria-expanded` on the trigger; `role="menu"` only for true action menus, otherwise `dialog` or none.
- Tooltips: show on focus too, not only hover; never hold essential info.

## Upgrade trigger
Suggest `@floating-ui/dom` (a few kb gzipped) only if popovers must flip/shift in scroll containers and the stack has no component library doing it.
