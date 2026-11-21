# Component: dialog

**Intent:** a modal task or decision in a native `<dialog>` opened with `showModal()`, so the platform supplies the focus trap, the inert page behind it and Escape; it is named by its title, and focus returns to what opened it.

**Cards:** a11y.semantic-first · a11y.keyboard-complete · a11y.focus-visible · a11y.target-size · usability.user-control-undo · motion.easing-roles · motion.compositor-only · motion.reduced-motion

**When NOT to use:** content to compare with the page behind it (a side panel or inline expansion); a confirmation that could be undone (an undo toast instead); a long form on mobile (a page or bottom sheet); a non-modal panel (popover); an error the user must keep reading (inline, on the page).

**Tokens:** `--color-background` · `--color-foreground` · `--color-muted-foreground` (description) · `--color-overlay` (scrim) · `--color-ring` · `--size-control-md` (close target) · `--space-2..8` · `--text-sm` · `--text-lg` · `--icon-md` · `--z-overlay` · `--duration-short|standard|medium` · `--ease-enter|exit`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there. Radius, shadow, border and scrim colour are the profile's call, not this spec's.

## Shapes
| Shape | Use for |
|---|---|
| modal | the default: a task or detail view with a close button |
| confirm | a short question with two actions and no close button (`data-variant="confirm"` on the root); backdrop click never closes it |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | the native `<dialog>` (implicit role `dialog`, so no `role` attribute); carries `data-variant`, `aria-labelledby`, `aria-describedby` |
| `title` | `<h2>`; the dialog's accessible name |
| `description` | `<p>`; optional, wired to `aria-describedby` |
| `close` | `<button>` with `aria-label`; at least `--size-control-md` square; absent from the `confirm` shape |
| `actions` | `<div>` holding the buttons; the primary action last |

Everything else is slot `default`, the body, between description and actions. Each part is a real element that holds its own content.

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| closed | not rendered | no `open` attribute |
| open | shown in the top layer over a dimmed backdrop | `open` |
| focus-visible | ring of `--ring-width` on every control, never removed | `:focus-visible` |

Only open has an attribute, so only it is in `states` in `spec.json`. The close button sits at a fixed corner and the title reserves its width, so no state changes the layout.

## Keyboard
| Key | Result |
|---|---|
| Tab / Shift+Tab | cycles inside the dialog (native modal trap) |
| Escape | closes (native `cancel` then `close`); never add a key listener |
| Enter, Space | activate the focused button (native) |

- Focus starts on the first focusable element; put `autofocus` on the safe choice of a `confirm`, never on the destructive one.
- `attach` wires `[data-dialog-open="<id>"]` triggers, `[data-part="close"]` and `[data-dialog-close]` buttons, and puts focus back on the opener on every `close`.
- Backdrop click closes only when the root says `data-backdrop-close` (and the click lands outside the box); leave it off when the dialog holds unsaved input.

## Motion
Enter and exit (opacity, a short lift on `transform`, a fading backdrop, `@starting-style`) are in `recipes/motion/dialog-enter-exit.md`; this spec does not repeat them. `--duration-standard` in, `--duration-short` out. Under `prefers-reduced-motion` only opacity animates.

## Markup
```html
<button type="button" data-dialog-open="archive">Archive...</button>
<dialog data-part="root" data-variant="modal" id="archive">
  <h2 data-part="title">Archive 3 projects?</h2>
  <p data-part="description">They leave the sidebar but stay searchable.</p>
  <button type="button" data-part="close" aria-label="Close">x</button>
  <div data-part="actions">
    <button type="button" data-dialog-close autofocus>Cancel</button>
    <button type="button" data-dialog-close>Archive</button>
  </div>
</dialog>
```

## Reference
`reference/index.html`, `dialog.css`, `dialog.js` (`attach(root): detach`; `root` is any ancestor of the triggers and dialogs). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.
