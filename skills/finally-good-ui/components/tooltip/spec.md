# Component: tooltip

**Intent:** a short plain-text hint for a control that is already labelled, shown on hover after a short delay and at once on keyboard focus, dismissed by Escape, pointer leave, blur or activating the control, never holding anything you can click.

**Cards:** a11y.keyboard-complete · a11y.semantic-first · a11y.focus-visible · usability.recognition-over-recall · motion.reduced-motion · motion.purpose-only

**When NOT to use:** the only label of an icon button (`aria-label` it first); content with links, buttons or form controls (a popover); a long explanation (inline help text); an error (the field); anything a touch user must read (a tap never opens a tooltip: put the text on the page).

**Tokens:** `--color-foreground` (fill) · `--color-background` (text) · `--space-1..2` · `--text-sm` · `--radius-*` and `--shadow-*` (profile) · `--duration-micro|short` · `--ease-enter|exit`. The full list is `tokens` in `spec.json`.

## Shapes
| Shape | Use for |
|---|---|
| top | the default: above the trigger, flipped below when there is no room |
| bottom | below the trigger, flipped above when there is no room (`data-placement` on the root) |

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper; carries `data-placement`, `data-delay` (ms, default 500, hover only), `data-open`, `data-side` (the side it ended on) |
| `trigger` | wraps the control (slot `default`); `aria-describedby` goes on the first focusable inside it, else the wrapper gets `tabindex="0"` |
| `content` | `role="tooltip"`, `popover="manual"` (top layer); slot `content`, plain text only |

## States
| State | How it shows | Attribute |
|---|---|---|
| open | content visible in the top layer | `data-open` on the root, `:popover-open` on the content |

## Keyboard and pointer
| Input | Result |
|---|---|
| focus (keyboard) | shows at once; blur hides |
| hover | shows after the delay; leaving the trigger and the content hides (the content is hoverable) |
| Escape | hides, wherever focus is while it is open |
| touch | hover never opens it; a tap that only focuses a button does not either (`:focus-visible`) |

## Scaffold API
Props `variant` (top | bottom), `delay` (ms); slots `default` (the control) and `content` (text). Programmatic: `showTooltip(scope)` / `hideTooltip(scope)` from `<name>.behaviour.js`. No controlled `open`: a tooltip is transient, so it is not bound.
