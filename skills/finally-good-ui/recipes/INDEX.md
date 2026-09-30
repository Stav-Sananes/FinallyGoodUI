# Recipes index

Load a recipe only when building the thing it names. Each recipe: intent · cards · when NOT to use · tokens · CSS baseline (framework-agnostic, reduced-motion included) · React + Motion (only where it adds value) · Vue/Svelte notes · a11y · upgrade trigger. Patterns also cover structure and every state-matrix cell.

Rules that apply to all recipes:
- Use the project's tokens (`--duration-*`, `--ease-*`, `--color-*`, `--space-*`); the values in recipes are the §4 defaults.
- Start from the CSS baseline. Use the stack's built-ins next (Vue `<Transition>`/`<TransitionGroup>`, Svelte `transition:`/`animate:flip`). Reach for a library only at the recipe's upgrade trigger, and ask first with the reason and size cost.
- Motion (`motion/react`): wrap in `LazyMotion` + `m` (`domAnimation` ≈ 4.6kb initial); `domMax` only for layout/`layoutId` recipes.

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
| [skeleton-to-content](motion/skeleton-to-content.md) | real-shape placeholder, fade in, no shift | states.loading-perceived, usability.system-status, layout.intrinsic-responsive | No |

## Patterns
| Recipe | Intent | Cards | Needs library? |
|---|---|---|---|
| [app-shell-nav](patterns/app-shell-nav.md) | persistent frame, nav model by destination count | ia-nav.nav-model-by-count, ia-nav.visible-destinations, ia-nav.wayfinding-location | No |
| [empty-state](patterns/empty-state.md) | explain the emptiness by cause + one next step | states.empty-state-teaches, writing.action-labels, flows-forms.primary-action-clarity | No |
| [form-validation](patterns/form-validation.md) | validate on blur, clear on fix, summary on submit | flows-forms.inline-validation-timing, writing.error-messages, usability.error-prevention | Optional (form lib + schema for large/multi-step forms) |
| [data-table](patterns/data-table.md) | dense, sortable, fully-stated tables | data.dense-tables, data.tension-density-clarity, typography.tabular-numbers | Optional (TanStack Table/Virtual at scale) |
| [settings-page](patterns/settings-page.md) | grouped options, one save model per group | layout.proximity-grouping, usability.user-control-undo, states.optimistic-feedback | No |

## Pick by situation
- Something opens → popover-from-trigger (anchored) or dialog-enter-exit (modal).
- Something changes place → list-reorder-flip; changes page → route-transition; becomes something else → shared-element-view-transition.
- Something is waiting → skeleton-to-content (regions) or button loading state (button-press).
- Something succeeded quietly → toast-stack (with Undo) or inline "Saved" (settings-page).
