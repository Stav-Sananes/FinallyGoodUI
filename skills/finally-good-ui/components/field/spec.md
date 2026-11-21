# Component: field

**Intent:** one native form control with its label, optional hint and error message tied to it by ids, validated at the right moment and announced to assistive tech, with every state taking its look from tokens and a style profile.

**Cards:** flows-forms.labels-above · flows-forms.inline-validation-timing · usability.error-prevention · writing.error-messages · color.color-not-sole-signal · a11y.semantic-first · a11y.focus-visible · a11y.target-size

**When NOT to use:** a single boolean (toggle); a group of radios or checkboxes (a `<fieldset><legend>`); a search box with no validation (a bare input with `aria-label`); a read-only value (plain text, not a disabled input).

**Tokens:** `--color-input` (border) · `--color-background` · `--color-foreground` · `--color-muted-foreground` (hint) · `--color-destructive` (error) · `--color-ring` · `--radius-*` · `--size-control-md` · `--space-1..4` · `--text-sm` · `--text-sm--line-height` · `--text-base` · `--border-width-hairline|strong` (outlined material) · `--ring-width` · `--ring-offset` · `--duration-short` · `--ease-snappy|enter`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there.

## Shapes
| Shape | Use for |
|---|---|
| stacked | the default: label above the control (flows-forms.labels-above) |
| inline | short fields or settings rows: label beside the control, hint and error under it |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper `<div>`; carries `data-variant` |
| `label` | a real `<label for>`, always visible (a placeholder is not a label) |
| `hint` | optional help text, linked by `aria-describedby` |
| `control` | the native `<input>`, `<select>` or `<textarea>` (slot `default`); carries `aria-invalid`, `aria-required` |
| `error` | always rendered, `aria-live="polite"`, empty when valid; reserves one line so a message never shifts the layout |

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| default | border `--color-input` | none |
| focus-visible | ring of `--ring-width`, never removed | `:focus-visible` |
| invalid | destructive border plus inner ring, and the error text starting with a `!` mark (never colour alone) | `aria-invalid="true"` |
| disabled | dimmed, `not-allowed` cursor, out of the tab order | native `disabled` |

Only invalid and disabled have attributes, so only they are in `states` in `spec.json`; pseudo-classes are covered by the style profile layer. Validation timing, the error summary on submit and server errors follow `recipes/patterns/form-validation.md`, not repeated here.

## Keyboard
No custom keys. Tab moves between fields in reading order; typing, selection and arrows are the native control's. `attach` listens to `focusout` and `input` (not keys), so `keys` in `spec.json` is empty.

## Announcing errors
- `aria-describedby="<hint-id> <error-id>"` on the control; the control's accessible name is the label.
- The error part is a polite live region that is in the DOM from the start; `attach` writes its text on blur, so it is announced without moving focus. Submit-time summaries use `role="alert"` and take focus (pattern file).
- `attach` only fills in what the markup omits: `label[for]`, ids and `aria-describedby` for hint and error, `aria-required` for a required control.

## Rules
- One control per field; messages say how to fix it ("Enter an email like name@company.com"), never just "Invalid".
- Do not disable the submit button to signal errors: it hides the reason (pattern file).
- Keep the user's input on a server error and map it back onto the field's `error` part.
- A required control gets the native `required` (plus `novalidate` on the form so `attach` owns the message timing).

## Motion
The error text fades in (`opacity` only, `--duration-short`, `--ease-enter`); no shake. Under `prefers-reduced-motion` it appears at once.

## Markup
```html
<div data-part="root" data-variant="stacked">
  <label data-part="label" for="email">Work email</label>
  <p data-part="hint" id="email-hint">We send the invoice copy here.</p>
  <input data-part="control" id="email" type="email" required aria-describedby="email-hint email-err"
         data-msg-value-missing="Enter your work email">
  <p data-part="error" id="email-err" aria-live="polite"></p>
</div>
```

## Reference
`reference/index.html`, `field.css`, `field.js` (`attach(root): detach`). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.
