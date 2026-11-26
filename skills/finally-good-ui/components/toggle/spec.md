# Component: toggle

**Intent:** one native `<input type="checkbox">` that sets a value on or off, in two shapes (checkbox, switch), shows its state without colour alone, and takes its whole look from tokens and a style profile.

**Cards:** a11y.semantic-first · a11y.keyboard-complete · a11y.focus-visible · a11y.target-size · color.color-not-sole-signal · usability.system-status · motion.purpose-only · motion.compositor-only

**When NOT to use:** an action that happens now (a button); one choice out of several (radio group or segmented control); a setting that needs a confirm step to take effect (checkbox plus a save button, not a switch); a list of options with filtering (a listbox).

**Tokens:** `--color-primary` / `--color-primary-foreground` (checked) · `--color-input` (box, track) · `--color-background` · `--color-destructive` (invalid) · `--color-ring` · `--radius-*` · `--icon-md` · `--size-control-md` · `--space-1..4` · `--border-width-hairline|strong` (outlined material) · `--ring-width` · `--ring-offset` · `--shadow-sm` · `--duration-micro|short|standard` · `--ease-snappy|move`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there.

## Shapes
| Shape | Use for | Role on the input |
|---|---|---|
| checkbox | a value submitted with a form, a consent, a multi-select list; can be mixed | `checkbox` (native) |
| switch | a setting that takes effect immediately (Wi-Fi, sync) | `role="switch"` on the same native input |

Follow the WAI-ARIA APG [checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) and [switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) patterns for roles and state; this spec does not repeat them.

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | the `<label>` that wraps the input and the text, so the whole row is the click target (at least `--size-control-md` tall); carries `data-variant` |
| `control` | the native `<input type="checkbox">`, `appearance: none`; its `::after` draws the check mark or the switch thumb |
| `label` | visible text (slot `default`) |

A toggle with no visible text needs `aria-label` on the control. Group related checkboxes in a `<fieldset><legend>`.

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| unchecked | empty box; switch thumb at the start | none |
| checked | `--color-primary` fill; check mark appears, switch thumb moves to the end | `:checked` (property; `checked` in markup) |
| mixed | minus mark, checkbox only; set via `data-indeterminate`, cleared by the first change | `:indeterminate` |
| hover | none required; the whole row is the target | none |
| focus-visible | ring of `--ring-width`, offset `--ring-offset`, never removed | `:focus-visible` |
| disabled | dimmed, `not-allowed` cursor, out of the tab order | native `disabled` |
| invalid | destructive border plus an error text near it (never colour alone) | `aria-invalid="true"` |

Only checked, disabled and invalid have attributes, so only they are in `states` in `spec.json`; pseudo-classes are covered by the style profile layer. State changes never change the control's size: the mark is always in the box and only fades, the thumb only translates.

## Keyboard
| Key | Result |
|---|---|
| Tab / Shift+Tab | moves focus to / from the control (disabled is skipped) |
| Space | toggles (native) |

- Enter does not toggle a checkbox; do not add it. No custom key handling: the native input does everything. Do not build a checkbox from a `<div role="checkbox">`.
- `attach` only sets `role="switch"` when the markup left it out and manages the mixed state; it adds no key listener.

## Motion
The thumb `transform`s and the mark's `opacity` fades (`motion.compositor-only`), `--duration-standard` for the thumb, `--duration-micro` for the mark. Under `prefers-reduced-motion` the thumb jumps and the mark only fades. Do not animate `width`.

## Markup
```html
<label data-part="root" data-variant="checkbox">
  <input type="checkbox" data-part="control" name="news">
  <span data-part="label">Send me product news</span>
</label>

<label data-part="root" data-variant="switch">
  <input type="checkbox" role="switch" data-part="control" name="sync" checked>
  <span data-part="label">Sync on this device</span>
</label>
```

## Reference
`reference/index.html`, `toggle.css`, `toggle.js` (`attach(root): detach`). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.

## Scaffold API
Props `variant` (checkbox | switch), `checked` (initial state; the DOM owns it afterwards), `disabled`, `invalid`, `name`, `value`; slot `default` is the label text. Native attributes and listeners (`onChange`, `@change`) go to the input, not the label. A `switch` gets `role="switch"` in the markup.
