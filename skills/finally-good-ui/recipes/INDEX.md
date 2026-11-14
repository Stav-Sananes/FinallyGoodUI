# Recipes index

Load a recipe only when building the thing it names. Each recipe: intent · cards · when NOT to use · tokens · CSS baseline (framework-agnostic, reduced-motion included) · React + Motion (only where it adds value) · Vue/Svelte notes · a11y · upgrade trigger. Patterns also cover structure and every state-matrix cell.

Rules that apply to all recipes:
- Use the project's tokens (`--duration-*`, `--ease-*`, `--color-*`, `--space-*`); the numbers shown in recipes are the defaults from `tokens/default.tokens.json` (`duration`, `easing` groups), for reading only.
- **No duration or easing literals in shipped code**, JS included. CSS: `var(--duration-standard) var(--ease-move)`. JS (Motion, WAAPI, Svelte/Vue transition props, timers that wait on a transition): import one generated helper instead of pasting `0.25` or `[0.2, 0, 0, 1]`. Generate it, never hand-write it:
  ```
  node "${CLAUDE_SKILL_DIR}/scripts/emit-tokens.mjs" --in .design/tokens.json --format js > src/lib/motion-tokens.js
  ```
  It exports `ms("standard")` → 250, `sec("standard")` → 0.25 (Motion uses seconds), `ease("move")` → `[0.2, 0, 0, 1]`, plus `durations`/`easings` name lists, and one helper per input format libraries expect:

  | Library wants | Helper | Used by |
  |---|---|---|
  | seconds | `sec("standard")` | Motion, GSAP |
  | a CSS easing string | `cssEase("move")` → `"cubic-bezier(0.2, 0, 0, 1)"` | WAAPI `el.animate`, dnd-kit, SortableJS, AutoAnimate, Number Flow |
  | an easing function | `easeFn("enter")` → `(t) => y` | Svelte `transition:`, React Spring, Lenis, Vue/Solid JS hooks |
  | a bezier string | `bezierString("move")` → `"0.2,0,0,1"` | GSAP `CustomEase.create("fgu-move", …)` |
  | a spring | `spring("medium", { bounce: 0.2 })` | Motion `transition` |
  | reduced motion | `reduced()`, `msMotion()`, `secMotion()` (0 under reduce) | movement only; fades may keep `ms()` |

  Motion (`motion/react`): put one `<MotionConfig reducedMotion="user">` at the app root instead of branching per component. Tailwind v4: the emitted `@utility duration-*` gives `duration-standard`, `duration-short`… as classes. Call them when animating, not at module load: the live `--duration-*`/`--ease-*` variable wins (theme overrides), the token value is the fallback on the server, and a misspelt name throws instead of silently animating at 0. Re-run the command whenever `tokens.json` changes. The recipes' `import … from "./motion-tokens"` means this file.
  Under reduced motion pass `0` for spatial durations. MUI projects read `theme.transitions` (emitted by `emit-tokens --format mui`).
- Start from the CSS baseline. Use the stack's built-ins next (Vue `<Transition>`/`<TransitionGroup>`, Svelte `transition:`/`animate:flip`, Angular `animate.enter`/`animate.leave`).
- **Angular:** put the recipe's CSS in a class and bind it with `animate.enter="pop-in"` / `animate.leave="pop-out"`; Angular adds the class, waits for the CSS transition or animation, then removes the element. Don't use `@angular/animations` (`trigger()`, `state()`): it is deprecated with removal planned for v23, and it can't be mixed with `animate.enter`. The stack profile flags it as `angular-animations-legacy`. Reach for a library only at the recipe's upgrade trigger, and ask first with the reason and size cost.
- Motion (`motion/react`): wrap in `LazyMotion` + `m` (`domAnimation` ≈ 4.6kb initial); `domMax` only for layout/`layoutId` recipes.
- **Libraries the project already has** (stack profile `animation[]` and `interaction[]`): feed them our tokens in the unit each one expects. The units differ, and a wrong unit is the usual bug.

  | Profile name | Timing input | Ours | Reduced motion |
  |---|---|---|---|
  | `animejs` | `duration` ms, `ease: cubicBezier(…)` | `ms("standard")`, `cubicBezier(...ease("move"))` | not built in: `msMotion()` |
  | `number-flow` | `transformTiming`/`opacityTiming` `{duration: ms, easing: CSS}` | `{ duration: ms("long"), easing: cssEase("move") }` | built in (`respectMotionPreference`) |
  | `lenis` | `duration` **seconds**, `easing` function | `lenis.scrollTo(t, { duration: sec("long"), easing: easeFn("move") })` | built in |
  | `lottie`, `dotlottie`, `rive` | own timeline; only speed | for empty and success states only; prefer dotLottie (lottie-web is barely maintained) | not built in: show a static final frame |
  | `sonner` | hard-coded `400ms` in its CSS | `[data-sonner-toast] { transition-duration: var(--duration-medium); transition-timing-function: var(--ease-move); }` | built in (removes fades too) |
  | `vaul-unmaintained` | hard-coded `0.5s` | don't add it to new code: use the primitive library's Drawer (Base UI, Reka) or native `<dialog>` | – |
  | `cmdk` | `--cmdk-list-height` | `.cmdk-list { height: var(--cmdk-list-height); transition: height var(--duration-short) var(--ease-move); }`; open instantly (used many times a day) | no animation to reduce |
  | `floating-ui` | `useTransitionStyles({ duration: ms or {open, close} })` | `{ open: ms("standard"), close: ms("short") }` | not built in: `msMotion()` |
  | `dnd-kit-next` | `transition: {duration: ms, easing: CSS}` | `{ duration: ms("standard"), easing: cssEase("snappy") }` | built in |
  | `dnd-kit` (classic), `sortablejs` | ms + CSS easing string | `msMotion("standard")`, `cssEase("move")` | not built in: `msMotion()` |
  | `pragmatic-dnd` | no motion in core | its post-move flash, not a slide, for big boards | – |
  | `embla` | `duration` is a physics value (20–60), **not ms** | leave the default; don't map tokens | `breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } }` |
  | `react-day-picker` | `--rdp-animation_duration`, `--rdp-animation_timing` | `.rdp-root { --rdp-animation_duration: var(--duration-medium); --rdp-animation_timing: var(--ease-move); }` | not built in: set the duration to `0s` under reduce |
  | `tanstack-virtual` | none | never FLIP or stagger virtualised rows | – |

## Motion
| Recipe | Intent | Cards | Needs library? |
|---|---|---|---|
| [button-press](motion/button-press.md) | instant, interruptible press feedback (scale .97) | usability.system-status, motion.frequency-budget, motion.compositor-only | No |
| [popover-from-trigger](motion/popover-from-trigger.md) | menus/popovers grow from their trigger (.95→1) | motion.spatial-continuity, motion.easing-roles, motion.duration-by-distance | No (Floating UI only for complex positioning) |
| [dialog-enter-exit](motion/dialog-enter-exit.md) | modal lifts in over backdrop, exits faster | motion.easing-roles, usability.user-control-undo, a11y.keyboard-complete | No |
| [toast-stack](motion/toast-stack.md) | non-blocking confirmation + undo, stacked | usability.system-status, usability.user-control-undo, states.optimistic-feedback | Optional (Sonner family for swipe/promise toasts) |
| [accordion-auto-height](motion/accordion-auto-height.md) | smooth expand to unknown height | ia-nav.progressive-disclosure, motion.spatial-continuity, motion.compositor-only | No |
| [list-stagger-enter](motion/list-stagger-enter.md) | first-load cascade, 30–80ms steps | motion.purpose-only, motion.frequency-budget, states.loading-perceived | No |
| [list-reorder-flip](motion/list-reorder-flip.md) | items glide to new positions on sort/filter | motion.spatial-continuity, usability.system-status, data.dense-tables | No (Motion `layout` if present; drag → dnd-kit/SortableJS) |
| [shared-element-view-transition](motion/shared-element-view-transition.md) | list item becomes the detail header | motion.spatial-continuity, motion.one-signature-moment, ia-nav.wayfinding-location | No (Motion `layoutId` for interruptible SPA) |
| [route-transition](motion/route-transition.md) | forward/back/lateral page motion, shell still | motion.spatial-continuity, ia-nav.wayfinding-location, motion.frequency-budget | No |
| [react-view-transition](motion/react-view-transition.md) | React 19.3+ / Next App Router: shared element, Suspense reveal, directional route and crossfade through `<ViewTransition>` and transition types | motion.spatial-continuity, motion.frequency-budget, motion.reduced-motion | No (React built-in) |
| [scroll-linked](motion/scroll-linked.md) | reading progress, condensing sticky header, reveal-on-view on a CSS scroll timeline | motion.purpose-only, motion.compositor-only, motion.reduced-motion | No (GSAP ScrollTrigger only for pinned storytelling) |
| [headless-primitive-motion](motion/headless-primitive-motion.md) | overlays from Radix, Base UI, React Aria, Reka, Bits, Ark, Kobalte, Headless UI, UI SDK animate on each library's own state hooks | motion.easing-roles, motion.compositor-only, motion.reduced-motion | Uses the installed one |
| [drag-reorder](motion/drag-reorder.md) | put items in your own order by drag, keyboard or Move up/down; neighbours glide aside | motion.spatial-continuity, a11y.keyboard-complete, states.optimistic-feedback | Pointer drag: dnd-kit, SortableJS, Motion `Reorder` or Pragmatic DnD; keyboard: no |
| [bottom-sheet](motion/bottom-sheet.md) | phone sheet that rises from the bottom, snaps between heights, flicks away; keyboard handle | motion.spatial-continuity, motion.easing-roles, a11y.keyboard-complete | No (native `<dialog>`; Base UI / Reka Drawer if installed) |
| [tabs-indicator](motion/tabs-indicator.md) | tabs and segmented controls: one indicator slides to the choice, arrow keys, one tab stop | motion.spatial-continuity, motion.compositor-only, a11y.keyboard-complete | No |
| [tooltip-group](motion/tooltip-group.md) | first tooltip waits, neighbours open instantly, focus opens at once, one at a time | motion.frequency-budget, a11y.keyboard-complete, ia-nav.progressive-disclosure | No (sets the installed library's provider delays) |
| [skeleton-to-content](motion/skeleton-to-content.md) | real-shape placeholder, fade in, no shift | states.loading-perceived, usability.system-status, layout.intrinsic-responsive | No |

## Patterns
| Recipe | Intent | Cards | Needs library? |
|---|---|---|---|
| [app-shell-nav](patterns/app-shell-nav.md) | persistent frame, nav model by destination count | ia-nav.nav-model-by-count, ia-nav.visible-destinations, ia-nav.wayfinding-location | No |
| [empty-state](patterns/empty-state.md) | explain the emptiness by cause + one next step | states.empty-state-teaches, writing.action-labels, flows-forms.primary-action-clarity | No |
| [form-validation](patterns/form-validation.md) | validate on blur, clear on fix, summary on submit | flows-forms.inline-validation-timing, writing.error-messages, usability.error-prevention | Optional (form lib + schema for large/multi-step forms) |
| [data-table](patterns/data-table.md) | dense, sortable, fully-stated tables | data.dense-tables, data.tension-density-clarity, typography.tabular-numbers | Optional (TanStack Table/Virtual at scale) |
| [menu-select-combobox](patterns/menu-select-combobox.md) | pick from a list: menu of commands, select one value, filter-as-you-type, full keyboard contract | a11y.keyboard-complete, a11y.semantic-first, usability.recognition-over-recall | Uses the installed primitive library; otherwise native or hand-rolled menu |
| [command-palette](patterns/command-palette.md) | ⌘K search-and-run for pages, records and actions, ranked, near-instant | usability.recognition-over-recall, ia-nav.search-vs-browse, motion.frequency-budget | Optional (cmdk in React, Bits UI Command in Svelte) |
| [settings-page](patterns/settings-page.md) | grouped options, one save model per group | layout.proximity-grouping, usability.user-control-undo, states.optimistic-feedback | No |

## Pick by situation

| The person needs to… | Use |
|---|---|
| see what a press did, instantly | button-press |
| open choices or details next to a control | popover-from-trigger (a panel of controls; an action menu comes from the component library, see its A11y notes); with a primitive library installed, headless-primitive-motion |
| stop and confirm, or finish a short focused task | dialog-enter-exit (modal) |
| know a background action worked, and undo it | toast-stack, or an inline "Saved" (settings-page) |
| reveal more without leaving the page | accordion-auto-height |
| see a list arrive without a jolt | list-stagger-enter (first load only) |
| keep track of items when a list is sorted or filtered | list-reorder-flip |
| put items in their own order | drag-reorder |
| pick options or do a short task on a phone without leaving the page | bottom-sheet (phones), dialog-enter-exit (wide screens) |
| switch between views of the same thing | tabs-indicator |
| follow a list item into its detail page | shared-element-view-transition; in React 19.3+ (`viewTransitions: "react"`), react-view-transition |
| know where they went when the page changes | route-transition; in React 19.3+, react-view-transition |
| see how far through a long page they are, or keep the header out of the way while reading | scroll-linked |
| wait for a region without the layout jumping | skeleton-to-content |
| find their way around the app | app-shell-nav |
| run a command, choose a value, or narrow a long list from the keyboard | menu-select-combobox |
| jump to anything or run any action without the mouse | command-palette |
| learn what an icon-only control does without clutter | tooltip-group |
| understand why a screen is empty and what to do | empty-state |
| catch a form mistake as soon as they leave the field | form-validation |
| scan, sort and compare many rows | data-table |
| change preferences and trust they stuck | settings-page |
