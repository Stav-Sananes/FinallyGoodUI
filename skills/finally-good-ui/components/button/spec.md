# Component: button

**Intent:** one real `<button>` that starts an action, is reachable and operable from the keyboard, shows its state without colour alone, and takes its whole look from tokens and a style profile.

**Cards:** a11y.semantic-first · a11y.keyboard-complete · a11y.focus-visible · a11y.target-size · a11y.contrast-minimums · usability.system-status · motion.purpose-only · motion.compositor-only

**When NOT to use:** navigation to another page or URL (an `<a href>`); toggling a setting (a switch or checkbox); a choice among a few options (radio group or segmented control); a click target on a whole card or row (make the card's main link the target).

**Tokens:** `--color-primary` / `--color-primary-foreground` · `--color-accent` (secondary) · `--color-destructive` · `--color-foreground` (ghost) · `--color-border` · `--color-ring` · `--radius-*` · `--size-control-sm|md|lg` · `--space-1..4` · `--border-width-hairline|strong` (outlined material) · `--ring-width` · `--ring-offset` · `--shadow-sm|md` · `--duration-micro|short|standard` · `--ease-snappy|enter|enter-emphasized`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there.

## Shapes
| Shape | Use for | Surface |
|---|---|---|
| primary | the one main action of a view | `--color-primary` |
| secondary | supporting actions beside a primary | `--color-accent` plus a hairline border |
| ghost | low-emphasis actions, toolbars, cancel | transparent, `--color-foreground` text |
| destructive | delete, remove, revoke; always confirm or allow undo | `--color-destructive` |

One primary per view. A destructive button never sits where the primary would.

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | the `<button>` itself; carries `data-variant`, `disabled`, `aria-busy` |
| `icon` | optional leading icon (slot `icon`), `aria-hidden` |
| `label` | visible text (slot `default`) |
| `spinner` | always rendered, absolutely centred, `opacity` 1 only while `aria-busy="true"`, `aria-hidden` |

An icon-only button needs `aria-label`; its target stays at least `--size-control-md`.

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| default | variant surface | none |
| hover | slight opacity change, fine pointers only | `:hover` inside `(hover: hover) and (pointer: fine)` |
| active | `scale(0.97)`, interruptible | `:active` |
| focus-visible | ring of `--ring-width`, offset `--ring-offset`, never removed | `:focus-visible` |
| disabled | dimmed, `not-allowed` cursor, out of the tab order | native `disabled` (not `aria-disabled`) |
| loading | spinner overlays the centre, label fades out but stays in flow and the accessible name, so the width never changes; activation ignored, focus kept | `aria-busy="true"` |

Only disabled and loading have attributes, so only they are in `states` in `spec.json`; the rest are pseudo-classes the style profile layer already covers.

## Keyboard
| Key | Result |
|---|---|
| Tab / Shift+Tab | moves focus to / from the button (disabled buttons are skipped) |
| Enter | activates on keydown (native) |
| Space | activates on keyup (native) |

- No custom key handling: the native element does all of this. Do not add `role="button"` to a `<div>`.
- While loading the button keeps focus, and `click` is swallowed by `attach` so a double submit cannot happen.
- Announce completion elsewhere (a live region or the changed view); the button only says "busy".

## Motion
Press feedback is `transform` and `opacity` only (`motion.compositor-only`), 100 ms in, interruptible CSS transitions, never `width` or `padding`. Under `prefers-reduced-motion` the scale becomes an opacity dip and the spinner stops turning (the busy state is still conveyed by `aria-busy` and the cursor).

## Markup
```html
<button type="button" data-part="root" data-variant="primary">
  <span data-part="spinner" aria-hidden="true"></span>
  <span data-part="label">Save</span>
</button>

<!-- loading: spinner is always in the markup (opacity 0 when idle), same width, still focusable -->
<button type="button" data-part="root" data-variant="primary" aria-busy="true">
  <span data-part="spinner" aria-hidden="true"></span>
  <span data-part="label">Saving</span>
</button>

<!-- icon only -->
<button type="button" data-part="root" data-variant="ghost" aria-label="Close">
  <span data-part="icon" aria-hidden="true"></span>
</button>
```

## Reference
`reference/index.html`, `button.css`, `button.js` (`attach(root): detach`). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.
