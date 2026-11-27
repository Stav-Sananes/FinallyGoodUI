# Component: select

**Intent:** choose one value from a list, in two shapes: a native `<select>` for the simple case (the platform's picker, best on phones) and a combobox-style button with a native `popover` listbox, optionally searchable, when the options need filtering or a designed list.

**Cards:** a11y.semantic-first · a11y.keyboard-complete · a11y.focus-visible · a11y.target-size · usability.recognition-over-recall · usability.error-prevention · color.color-not-sole-signal · motion.reduced-motion

**When NOT to use:** two or three choices that fit on screen (radio group or segmented control); a yes/no (toggle); free text with suggestions (an input with a datalist); commands (menu); several values at once (a checkbox group).

**Tokens:** `--color-input` (border) · `--color-background` · `--color-card` (list) · `--color-accent` (focused option) · `--color-destructive` (invalid) · `--color-ring` · `--size-control-md` (trigger, option) · `--space-1..3` · `--text-sm` · `--border-width-*`, `--radius-*`, `--shadow-*` (profile) · `--duration-micro|short` · `--ease-snappy|exit`. The full list is `tokens` in `spec.json`.

## Shapes
| Shape | Use for |
|---|---|
| listbox | the default: a button plus a popover list; `searchable` adds a filter field |
| native | a plain `<select>` styled by the same tokens; `data-variant="native"` on the root |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper; `data-variant` |
| `label` | `<label>`, for the trigger or the control; `hideLabel` hides only the pixels |
| `control` | native shape only: the `<select>` with `<option data-part="option">` children |
| `trigger` | listbox shape: `<button role="combobox" aria-haspopup="listbox">` (popover invoker, `aria-expanded`, `aria-controls`) |
| `display` | inside the trigger: the chosen label or the placeholder; written by `attach` |
| `listbox` | `popover`, `role="listbox"`; holds `search`, the options and `empty` |
| `search` | optional `<input type="search">` that filters options by text |
| `option` | `role="option"`, `data-value`, `aria-selected`, `aria-disabled` for options that cannot be chosen |
| `empty` | `role="status"` shown when the filter matches nothing |
| `value` | hidden input with the chosen value (name = `name`), for forms |

## States
Open (`aria-expanded` on the trigger), invalid (`aria-invalid`), disabled (`disabled`); the selected option shows a check as well as weight, never colour alone.

## Keyboard (listbox shape)
| Key | Result |
|---|---|
| Enter, Space, ArrowDown on the trigger | opens; focus to the search field, else the selected option, else the first |
| ArrowDown / ArrowUp / Home / End | move between visible, enabled options (from the search field too) |
| letters (no search field) | typeahead to the next option starting with them |
| Enter / Space / click on an option | selects, closes, focus back on the trigger |
| Escape / outside click | closes (native popover) |

## Scaffold API
Props `variant`, `options` (`{ value, label, disabled? }[]`), `value` (bound: `v-model`, `bind:value`, `[(value)]`, `onValueChange`), `label`, `hideLabel`, `placeholder`, `name`, `searchable`, `emptyText`, `invalid`, `disabled`. No slots. `attach` fires a bubbling `selectchange` (detail: value); `selectValue(scope, value)` is exported for code. The `display` text is written by `attach`, so it is empty before hydration.
