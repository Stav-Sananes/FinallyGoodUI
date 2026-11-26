# Component: toast

**Intent:** a brief, non-blocking message in a live region that is always in the page, announced without taking focus, dismissed by its own timer (paused while the person is reading it) or by a button, and leaving with a short slide.

**Cards:** usability.system-status · usability.user-control-undo · states.optimistic-feedback · motion.frequency-budget · motion.spatial-continuity · motion.compositor-only · motion.reduced-motion · a11y.keyboard-complete · writing.error-messages · color.color-not-sole-signal

**When NOT to use:** the only place an error appears (put it inline, on the page, or in a dialog when it needs a decision; a toast may repeat it); a form field's error (field); anything the user must read later; a blocking choice (dialog); more than three at once (queue the rest).

**Tokens:** `--color-card` · `--color-card-foreground` · `--color-destructive` (error edge and icon) · `--color-border` · `--color-ring` · `--size-control-md` (action and dismiss targets) · `--space-2..4` · `--text-sm` · `--z-toast` · `--duration-short|medium` · `--ease-enter|exit`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there. Radius, shadow and surface are the profile's call.

## Shapes
| Shape | Use for |
|---|---|
| status | confirmation or progress ("Saved", "Moved to archive") with an optional Undo action; the default |
| error | a failure that is also shown where it happened (`data-variant="error"` on the toast): does not auto-dismiss and is announced as `role="alert"` |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | the live region: `role="status"` (polite), `aria-label="Notifications"`, in the DOM from page load, never created with its first toast; fixed in a corner, click-through while empty |
| `toast` | one `<div>` per message, a direct child of the region (never an `<li>`: a status role strips list semantics); carries `data-variant`, `data-timeout`, `data-leaving` |
| `message` | `<p>` with the text |
| `action` | optional `<button>` (Undo); stays reachable by keyboard until the toast goes |
| `dismiss` | `<button>` with `aria-label`, at least `--size-control-md` square |

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| shown | in place at full opacity | none |
| paused | countdown stopped while the pointer is over the region or focus is inside it | `:hover`, `:focus-within` |
| leaving | slides out and fades, then removed | `data-leaving` |

Only leaving has an attribute, so only it is in `states` in `spec.json`. Toasts share one column with a fixed width, so a state never resizes a neighbour.

## Keyboard
| Key | Result |
|---|---|
| Tab / Shift+Tab | reaches the action and dismiss buttons in order (toasts are never focus-stolen) |
| Enter, Space | activate the focused button (native) |

- No key listeners. `attach` never calls `focus()` on a toast; when a dismissed toast held focus, focus goes back to the element it came from.
- Auto-dismiss is 5000 ms by default (`data-timeout` in ms, `0` for none; error toasts default to none) and pauses on hover and focus, WCAG 2.2.1.
- `attach` watches the region, so toasts that a framework adds later get a timer. It fires a cancelable `dismiss` event before removing a toast: a framework that owns the node calls `preventDefault()` and drops it from its own state.

## Motion
Enter: `transform` and `opacity` over `--duration-medium` with `--ease-enter`, from `@starting-style`; exit `--duration-short` with `--ease-exit`. Recipe: `recipes/motion/toast-stack.md` (its stacking and Sonner upgrade notes apply). Under `prefers-reduced-motion` only opacity animates.

## Markup
```html
<div data-part="root" role="status" aria-label="Notifications">
  <div data-part="toast" data-variant="status">
    <p data-part="message">Moved to archive</p>
    <button type="button" data-part="action">Undo</button>
    <button type="button" data-part="dismiss" aria-label="Dismiss">x</button>
  </div>
</div>
```

## Reference
`reference/index.html`, `toast.css`, `toast.js` (`attach(root): detach`; `root` is the live region or an ancestor). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.

## Scaffold API
Props `toasts` (`{ id, message, variant?, timeout?, action?, onAction? }[]`) and `label`; slot `default` for anything extra in the region. You own the list: when a toast leaves (timer or the dismiss button) the component keeps the node, calls `onDismiss(id)` (Vue `@dismiss`, Svelte `ondismiss`, Angular `(dismissed)`) and you remove it from `toasts`. The region is rendered once at the app root and never conditionally.
