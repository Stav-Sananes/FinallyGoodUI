# Recipe: headless-primitive-motion

**Intent:** overlays from an unstyled component library (dialog, popover, menu, select, tooltip, sheet) enter and leave with the project's motion tokens, through the state hooks that library exposes, so the library still owns focus, dismissal and unmounting.

**Cards:** motion.easing-roles · motion.duration-by-distance · motion.compositor-only · motion.reduced-motion · motion.spatial-continuity · a11y.keyboard-complete

**When NOT to use:** when the project has no primitive library (use popover-from-trigger or dialog-enter-exit on native `[popover]`/`<dialog>`); for content that should appear instantly because it is used hundreds of times a day, such as a command palette after the first open or tooltips within a group (opacity only, `--duration-micro`, or none).

**Tokens:** `--duration-short` (150, enter) · `--duration-micro` (100, exit) · `--duration-standard` (250, dialogs) · `--ease-snappy` / `--ease-enter` (enter) · `--ease-exit` · `--color-overlay` (backdrops)

## Which hook to use

The stack profile's `primitives` list (and `shadcn.base` for shadcn projects) says which library is installed. Each one tells you differently that an element is entering or leaving, and they wait for different things before unmounting:

| `primitives` value | Library | Enter / exit hook | Waits for | Origin variable (popover; confirm per component) |
|---|---|---|---|---|
| `radix` | Radix Primitives (shadcn `radix-*`, `new-york`, `default`) | `[data-state="open"]` / `[data-state="closed"]` | CSS **animation** (keyframes) | `--radix-<part>-content-transform-origin` |
| `reka` | Reka UI (shadcn-vue) | `[data-state="open"]` / `[data-state="closed"]` | CSS animation | `--reka-<part>-content-transform-origin` |
| `ark` | Ark UI | `[data-state="open"]` / `[data-state="closed"]` | CSS animation | `--transform-origin` |
| `base-ui` | Base UI (shadcn `base-*`) | `[data-starting-style]` / `[data-ending-style]` | CSS **transition** | `--transform-origin` |
| `bits` | Bits UI (shadcn-svelte) | `[data-starting-style]` / `[data-ending-style]` | CSS transition | `--bits-<part>-transform-origin` |
| `ui-sdk` | Vercel UI SDK | `[data-starting-style]` / `[data-ending-style]` | CSS transition | `--transform-origin` |
| `react-aria` | React Aria Components (shadcn `aria-*`) | `[data-entering]` / `[data-exiting]` | transition or animation | `--trigger-anchor-point` (popovers) |
| `kobalte` | Kobalte (Solid) | `[data-expanded]` on open; exit is the element without it | CSS animation | `--kb-<part>-content-transform-origin` |
| `headlessui` | Headless UI | `data-closed` / `data-enter` / `data-leave` with `transition` prop | transition | n/a (set it from the anchor side) |

Exact origin-variable names vary by component; check the component's docs page for the one it exposes. If none, set the origin from the resolved side (`data-side`), as popover-from-trigger does.

## CSS baseline per hook family

**Transitions (Base UI, Bits UI, UI SDK):** the preferred family, because a transition can reverse midway.
```css
.popup {
  transform-origin: var(--transform-origin);
  transition:
    opacity var(--duration-short) var(--ease-snappy),
    transform var(--duration-short) var(--ease-snappy);
}
.popup[data-starting-style],
.popup[data-ending-style] { opacity: 0; transform: scale(0.96); }
.popup[data-ending-style] {
  transition-duration: var(--duration-micro);
  transition-timing-function: var(--ease-exit);
}
```

**Keyframes (Radix, Reka, Ark, Kobalte):** these libraries keep the element mounted only while a CSS *animation* runs; a transition alone makes the exit cut off.
```css
@keyframes fgu-pop-in  { from { opacity: 0; transform: scale(0.96); } }
@keyframes fgu-pop-out { to   { opacity: 0; transform: scale(0.96); } }

.popup { transform-origin: var(--radix-popover-content-transform-origin); }
.popup[data-state="open"]   { animation: fgu-pop-in  var(--duration-short) var(--ease-snappy); }
.popup[data-state="closed"] { animation: fgu-pop-out var(--duration-micro) var(--ease-exit) forwards; }
/* Kobalte: .popup[data-expanded] { animation: fgu-pop-in … }  .popup { animation: fgu-pop-out … } */
```

**React Aria:** either form works; transitions shown.
```css
.popup { transition: opacity var(--duration-short) var(--ease-snappy), transform var(--duration-short) var(--ease-snappy); }
.popup[data-entering], .popup[data-exiting] { opacity: 0; transform: scale(0.96); }
.popup[data-exiting] { transition-duration: var(--duration-micro); transition-timing-function: var(--ease-exit); }
```

**Dialogs and sheets:** same hooks, with `--duration-standard` to enter and `--duration-short` to exit; the backdrop fades on `--color-overlay` and never scales. Sheets translate from their edge (`translateY(100%)` for a bottom sheet) instead of scaling.

**Reduced motion** (all families): keep the fade, drop the movement.
```css
@media (prefers-reduced-motion: reduce) {
  .popup, .popup[data-starting-style], .popup[data-ending-style],
  .popup[data-entering], .popup[data-exiting] { transform: none; }
  @keyframes fgu-pop-in  { from { opacity: 0; } }
  @keyframes fgu-pop-out { to   { opacity: 0; } }
}
```

## Tailwind v4
Arbitrary variants carry the same hooks: `data-[starting-style]:opacity-0 data-[starting-style]:scale-96 duration-short ease-snappy` (Base UI, Bits, UI SDK) or `data-[state=open]:animate-[fgu-pop-in_var(--duration-short)_var(--ease-snappy)]` (Radix family). shadcn's generated components already contain one of these; replace their fixed durations (`duration-200`) with the token utilities (`duration-short`).

## React + Motion
Only when the transition needs something CSS can't do (shared layout, springs). Radix-family content takes `forceMount` plus `<AnimatePresence>` (see popover-from-trigger); Base UI takes Motion through its `render` prop with `keepMounted`. Use `sec()`/`ease()` or `spring()` from `motion-tokens`.

## A11y
The library already handles focus, `Escape`, outside click and ARIA. Don't add `role` or key handlers of your own, and don't remove the element yourself on exit: let the library unmount it after the hook finishes.

## Upgrade trigger
None. This recipe *is* the library path. If the project has no primitive library and needs a menu, select or combobox keyboard model, suggest the one that matches its framework (Base UI or React Aria for React, Reka for Vue, Bits UI for Svelte, Kobalte for Solid), and ask first.
