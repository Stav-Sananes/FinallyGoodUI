# Recipe: popover-from-trigger

**Intent:** menus, popovers and tooltips grow out of the control that opened them, so the eye links cause and effect.

**Cards:** motion.spatial-continuity · motion.duration-by-distance · motion.easing-roles · motion.compositor-only · motion.reduced-motion · usability.user-control-undo

**When NOT to use:** tooltips (use tooltip-group: delay, then instant neighbours, opacity only); full dialogs (see dialog-enter-exit); anything opened hundreds of times a day — consider instant.

**Tokens:** `--duration-short` (150, enter) · `--duration-micro` (100, exit) · `--ease-snappy` (enter) · `--ease-exit`

## CSS baseline (Popover API + `@starting-style`, Baseline)
```html
<button popovertarget="filters" id="filters-btn">Filters</button>
<div id="filters" popover class="popover" data-side="bottom-start" aria-labelledby="filters-btn">
  <!-- form controls; Tab moves through them natively -->
  <label><input type="checkbox" autofocus> Unpaid only</label> …
</div>
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
import { sec, ease } from "./motion-tokens"; // recipes/INDEX.md

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
                  animate={{ opacity: 1, scale: 1, transition: { duration: sec('short'), ease: ease('snappy') } }}
                  exit={{ ...hidden, transition: { duration: sec('micro'), ease: ease('exit') } }}
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
- Svelte: `transition:scale={{ start: 0.95, opacity: 0, duration: ms('short'), easing: easeFn('snappy') }}`; set `transform-origin` via a style bound to the placement. Use `in:`/`out:` separately for a faster exit.

## A11y
- What the Popover API gives you: light dismiss, `Escape` to close, focus back to the trigger on close, and `aria-expanded` on a `popovertarget` button. What it does **not** give you: moving focus in on open (put `autofocus` on the first control, as above, or focus it in script), arrow keys, Home/End or typeahead.
- So the CSS baseline is for **panels of ordinary controls** (filters, a date field, a share box), where Tab is the whole keyboard model. Leave `role` off, or use `role="dialog"` for a labelled panel.
- An **action menu** (`role="menu"`, a list of commands) needs the full menu-button keyboard model: focus the first item on open, arrow keys move between items, Home/End, typeahead, Enter/Space activate, Escape returns to the trigger ([WAI-ARIA APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)). Use the installed component library's Menu/DropdownMenu (Radix, Base UI, React Aria, Reka, Bits, Headless UI, Ark), or with none installed the menu in patterns/menu-select-combobox; animate it with this recipe's motion. Don't put `role="menu"` on a plain popover: `check-static` flags it as `role-no-keyboard`.
- Tooltips: timing, grouping and focus behaviour are in tooltip-group; never hold essential info.

## Upgrade trigger
Suggest `@floating-ui/dom` (a few kb gzipped) only if popovers must flip/shift in scroll containers and the stack has no component library doing it.
