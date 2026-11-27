# Component: popover

**Intent:** a non-modal panel anchored to a button, for a small group of related controls or a short explanation that may hold links and buttons: light dismiss, Escape, focus into the panel on open and back to the button on close, no focus trap and no page behind it made inert.

**Cards:** a11y.keyboard-complete · a11y.semantic-first · a11y.focus-visible · a11y.target-size · usability.user-control-undo · motion.spatial-continuity · motion.reduced-motion

**When NOT to use:** a hint on hover or focus (tooltip); a list of commands (menu); a choice that blocks the page or needs an answer (dialog); choosing one value (select); content the user must keep seeing while they work elsewhere (an inline panel).

**Tokens:** `--color-card` / `--color-card-foreground` (panel) · `--color-border` · `--color-accent` (open trigger) · `--space-1..4` · `--text-sm` · `--ring-width` · `--duration-micro|short` · `--ease-snappy|exit` · `--radius-*`, `--shadow-*`, `--border-width-*` (profile). The full list is `tokens` in `spec.json`.

## Shapes
| Shape | Use for |
|---|---|
| panel | the only shape: a button plus an anchored panel (placement is automatic: below, flipped above when there is no room) |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper; `data-anchor="css"` when the browser has CSS anchor positioning, `data-side` for the script fallback |
| `trigger` | native `<button>` and the popover's invoker: `popovertarget`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`; slot `trigger` is its label |
| `panel` | `popover="auto"`, `role="dialog"` named by the trigger (or `aria-label`); slot `default` |

## States
| State | How it shows | Attribute |
|---|---|---|
| closed / open | panel absent / in the top layer; trigger filled | `aria-expanded` on the trigger, `:popover-open` on the panel |

## Keyboard
| Key | Result |
|---|---|
| Enter / Space on the trigger | toggles (native invoker); focus moves to the first `[autofocus]` or focusable in the panel |
| Escape | closes, focus back on the trigger (native) |
| Tab out of the panel | closes without stealing focus back |
| outside click | closes (native light dismiss) |

## Scaffold API
Props `open` (controlled, bound: `v-model:open`, `bind:open`, `[(open)]`, `onOpenChange`) and `label` (the panel's accessible name when there is no visible one); slots `trigger` (button label) and `default` (panel content). `attach` fires a bubbling `popoverchange` (detail: open). Programmatic: `openPopover(scope)` / `closePopover(scope)` from `<name>.behaviour.js`.
