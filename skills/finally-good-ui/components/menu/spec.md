# Component: menu

**Intent:** a menu button: a native `<button>` that opens a popover list of commands, with real focus moving into the list, arrow keys, typeahead and Escape returning focus to the button, so every command is reachable from the keyboard.

**Cards:** a11y.keyboard-complete · a11y.semantic-first · a11y.focus-visible · a11y.target-size · usability.recognition-over-recall · usability.consistency-standards · motion.spatial-continuity · motion.reduced-motion

**When NOT to use:** navigation links (a nav list of `<a>`, never `role="menu"`); choosing one value for a form field (native `<select>`); a filter-as-you-type list (combobox); two or three actions that fit on screen (visible buttons); a popover holding form controls (a plain popover, not a menu).

**Tokens:** `--color-card` · `--color-card-foreground` · `--color-accent` and `--color-accent-foreground` (highlighted item) · `--color-muted-foreground` (disabled) · `--color-ring` · `--size-control-md` (item height) · `--space-1..4` · `--text-sm` · `--z-overlay` · `--duration-micro|short` · `--ease-snappy|exit`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there. Radius, shadow and border treatment are the profile's call.

## Shapes
| Shape | Use for |
|---|---|
| menu-button | the only shape: a button plus a list of commands; submenus, checkable items and groups are out of scope |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper holding the trigger and the list |
| `trigger` | native `<button>` that is the popover's invoker: `popovertarget` the list, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`; its label names the menu |
| `list` | the element with `role="menu"`, `popover`, `aria-labelledby` the trigger; opens in the top layer under the trigger |
| `item` | native `<button role="menuitem" tabindex="-1">` holding one command (slot `default` of the list is the items) |

Items that the user cannot run right now stay in the list with `aria-disabled="true"`: they keep their place so people learn they exist.

`attach` fills what the markup left out: `role="menuitem"`, `tabindex="-1"`, `aria-haspopup`, `aria-controls`, `aria-labelledby`, `popover`, `popovertarget` (on the trigger, pointing at the list; the scaffold does not emit it), and writes `--menu-x` and `--menu-y` (the trigger's left and bottom edge) before showing the list.

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| closed | list not rendered | `aria-expanded="false"` on the trigger |
| open | list shown, trigger filled | `aria-expanded="true"` on the trigger |
| highlighted | fill plus focus ring (never colour alone) | `:focus-visible` on the item |
| disabled | dimmed, `not-allowed` cursor, focusable, not activatable | `aria-disabled="true"` on the item |

Open and disabled have attributes, so they are in `states` in `spec.json`; the highlight is a pseudo-class. The trigger and every item keep a fixed size in all states.

## Keyboard
The key table (trigger and list, typeahead, wrap, Escape, Tab) is the menu column of `recipes/patterns/menu-select-combobox.md`; this spec does not repeat it. `spec.json` `a11y.keys` lists the keys a scaffold must not re-handle.

- Enter and Space on the trigger are its native click, and the click is the platform's invoker toggle: no key or click listener for the trigger. A click handler would reopen a menu that light dismiss had just closed (it treats the trigger as outside).
- `attach` roves `tabindex` (one tab stop, the focused item), wraps at both ends, and calls `stopPropagation` on Escape so an enclosing dialog stays open.
- A click on a disabled item is swallowed in the capture phase, so handlers on the item never run.

## Motion
`opacity` plus a short `transform` drop, `--duration-short` open, `--duration-micro` close, `--ease-snappy` in, `--ease-exit` out, per `recipes/motion/popover-from-trigger.md`; this spec does not repeat the CSS. Under `prefers-reduced-motion` only opacity animates.

## Markup
```html
<div data-part="root">
  <button type="button" data-part="trigger" id="row-actions" aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu" popovertarget="row-menu">Actions</button>
  <div data-part="list" id="row-menu" role="menu" aria-labelledby="row-actions" popover>
    <button type="button" data-part="item" role="menuitem" tabindex="-1">Rename</button>
    <button type="button" data-part="item" role="menuitem" tabindex="-1" aria-disabled="true">Move</button>
    <button type="button" data-part="item" role="menuitem" tabindex="-1">Delete...</button>
  </div>
</div>
```

## Reference
`reference/index.html`, `menu.css`, `menu.js` (`attach(root): detach`; `root` is any ancestor of the menus). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.

## Scaffold API
Props `items` (`{ label, disabled?, onSelect? }[]`); slot `default` is the trigger's label. Programmatic: `openMenu(scope, start?)` and `closeMenu(scope, { restoreFocus? })` from `<name>.behaviour.js` (scope: the menu root, trigger or list). The list is a native `popover`; `onSelect` runs from the item's click, which also closes the menu.

Round 6: the trigger button takes the same surface from the style profile as the list (radius, border, shadow).
