# Component: tabs

**Intent:** a tablist of native buttons that switches between sibling panels, one tab stop for the whole list, arrow keys between tabs with selection following focus, and one indicator that slides to the chosen tab so the eye follows the change.

**Cards:** a11y.keyboard-complete · a11y.semantic-first · a11y.focus-visible · a11y.target-size · ia-nav.wayfinding-location · motion.spatial-continuity · motion.compositor-only · motion.reduced-motion

**When NOT to use:** navigation between pages (a nav with `aria-current="page"`, the route transition handles the change); more than about six choices (a select); a binary on/off (a switch); a value that belongs to a form (a radio group); content most users need to read all of (show it, or use disclosure).

**Tokens:** `--color-foreground` (selected) · `--color-muted-foreground` (unselected) · `--color-primary` (indicator) · `--color-border` (list rule) · `--color-ring` · `--size-control-md` (tab height) · `--space-1..4` · `--text-sm` · `--border-width-hairline|strong` · `--duration-standard` · `--ease-move`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there.

## Shapes
| Shape | Use for |
|---|---|
| underline | the only shape: a rule under the list and one sliding indicator; a segmented thumb is in the recipe and needs a clip instead of a scale |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper holding the list and its panels |
| `list` | the element with `role="tablist"` and an `aria-label`; `aria-orientation="vertical"` for a vertical list |
| `tab` | native `<button role="tab">` with `aria-selected` and `aria-controls`; at least `--size-control-md` tall |
| `indicator` | one element inside the list, `aria-hidden`, moved with `transform` only |
| `panel` | `role="tabpanel"` with `aria-labelledby` its tab and `tabindex="0"`; `hidden` while its tab is not selected |

Panels are siblings of the list, in the same order as the tabs. `attach` fills in roles, ids, `aria-controls` (paired by order) and `aria-labelledby` where the markup left them out.

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| unselected | muted colour, out of the tab order, panel `hidden` | `aria-selected="false"` |
| selected | full-strength colour, indicator under it, panel visible | `aria-selected="true"` |
| focus-visible | ring of `--ring-width`, never removed | `:focus-visible` |

Only selected has an attribute, so only it is in `states` in `spec.json`. Selection never changes a tab's size; the indicator is out of flow.

## Keyboard
The key table is the tabs section of `recipes/motion/tabs-indicator.md` (WAI-ARIA APG tabs); this spec does not repeat it. `spec.json` `a11y.keys` lists the keys a scaffold must not re-handle.

- Automatic activation: selection follows focus, which suits panels that are already loaded. A panel that fetches data would select on Enter or Space instead.
- Tab leaves the tablist for the active panel (native, no listener). Arrows wrap; they swap in right-to-left lists and become ArrowUp and ArrowDown for a vertical list.
- `attach` roves `tabindex`, toggles `hidden` on the panels, and writes `--indicator-x` and `--indicator-scale` on the list, again on resize.

## Motion
The indicator transitions `transform` over `--duration-standard` with `--ease-move`, only after the first measure (`data-ready` on the list), so it never flies in on load. Recipe: `recipes/motion/tabs-indicator.md`. Under `prefers-reduced-motion` the indicator jumps.

## Markup
```html
<div data-part="root">
  <div data-part="list" role="tablist" aria-label="Invoice views">
    <button type="button" data-part="tab" role="tab" id="tab-open" aria-selected="true" aria-controls="panel-open">Open</button>
    <button type="button" data-part="tab" role="tab" id="tab-paid" aria-selected="false" aria-controls="panel-paid" tabindex="-1">Paid</button>
    <span data-part="indicator" aria-hidden="true"></span>
  </div>
  <div data-part="panel" role="tabpanel" id="panel-open" aria-labelledby="tab-open" tabindex="0">...</div>
  <div data-part="panel" role="tabpanel" id="panel-paid" aria-labelledby="tab-paid" tabindex="0" hidden>...</div>
</div>
```

## Reference
`reference/index.html`, `tabs.css`, `tabs.js` (`attach(root): detach`; `root` is any ancestor of the tablists). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.
