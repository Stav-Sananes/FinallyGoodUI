# Component: disclosure

**Intent:** a native `<button aria-expanded>` that shows or hides a panel of content, alone or as an accordion of several, with closed content out of the tab order and the reading order, and the height change animated without layout jumps.

**Cards:** ia-nav.progressive-disclosure · a11y.semantic-first · a11y.keyboard-complete · a11y.focus-visible · a11y.target-size · motion.spatial-continuity · motion.compositor-only · motion.reduced-motion

**When NOT to use:** content most users need to read (show it); a very tall panel (more than about 60vh: navigate or snap open); switching between sibling views (tabs); a floating panel on top of the page (menu or popover); a modal task (dialog). For a single FAQ-style block with no custom styling, a native `<details>` is enough.

**Tokens:** `--color-border` (item divider) · `--color-foreground` · `--color-muted-foreground` (disabled) · `--color-ring` · `--size-control-md` · `--icon-md` · `--space-1..4` · `--border-width-hairline|strong` (outlined material) · `--ring-width` · `--ring-offset` · `--duration-short|standard` · `--ease-move|exit`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there.

## Shapes
| Shape | Use for |
|---|---|
| multiple | independent sections, the default: users compare, so nothing auto-closes |
| single | accordion where opening one section closes the others (`data-variant="single"` on the root) |

Heading, trigger and panel structure follow the WAI-ARIA APG [accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) pattern. The open and close animation, its two CSS baselines and the reduced-motion rule are in `recipes/motion/accordion-auto-height.md`; this spec does not repeat them.

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | wrapper for one or more items; carries `data-variant` |
| `item` | one trigger plus its panel |
| `heading` | the real heading element (`<h3>`) around the trigger; pick the level that fits the page outline |
| `trigger` | native `<button>` (slot `trigger`) with `aria-expanded` and `aria-controls`; fills the row, at least `--size-control-md` tall |
| `indicator` | chevron, `aria-hidden`; rotates, never changes the trigger's size |
| `panel` | the controlled region, `role="region"` with `aria-labelledby` the trigger (skip the role when there are more than about six panels); `inert` while closed |
| `content` | the slot `default` content; `overflow: hidden` so the panel can collapse to zero |

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| closed | panel height zero, content inert, chevron down | `aria-expanded="false"` |
| open | panel at content height, chevron turned half a turn | `aria-expanded="true"` |
| focus-visible | ring of `--ring-width` on the trigger, never removed | `:focus-visible` |
| disabled | dimmed, out of the tab order | native `disabled` on the trigger |

Only open and disabled have attributes, so only they are in `states` in `spec.json`. The trigger's size is fixed in every state; only the panel changes height.

## Keyboard
| Key | Result |
|---|---|
| Tab / Shift+Tab | moves between triggers and any focusable content of open panels |
| Enter, Space | toggles the focused trigger (native `<button>`) |

- No custom key handling: do not add Enter or Space listeners. Arrow, Home and End between triggers are optional in the APG and left out here.
- `attach` toggles on `click`, sets `inert` on the panel to match `aria-expanded`, and closes the siblings only when the root says `data-variant="single"`.

## Motion
`grid-template-rows` 0fr to 1fr plus `opacity` (the one sanctioned layout-property exception, marked `fgu-allow: animate-layout-prop`), `--duration-standard` open, `--duration-short` close. The chevron only rotates. Under `prefers-reduced-motion` only opacity animates.

## Markup
```html
<div data-part="root" data-variant="single">
  <div data-part="item">
    <h3 data-part="heading"><button type="button" data-part="trigger" id="t-ship" aria-expanded="false" aria-controls="p-ship"><span>Shipping</span><span data-part="indicator" aria-hidden="true"></span></button></h3>
    <div data-part="panel" id="p-ship" role="region" aria-labelledby="t-ship" inert><div data-part="content">...</div></div>
  </div>
</div>
```

## Reference
`reference/index.html`, `disclosure.css`, `disclosure.js` (`attach(root): detach`). The CSS is the neutral baseline; a project adapter replaces it with the project's own primitive and only keeps the contract above.

## Scaffold API
One component is one item (root, item, heading, trigger, panel). Props `variant`, `open` (initial; the trigger owns it afterwards), `disabled`; slots `trigger` (heading text) and `default` (the panel content). Single-open across several items: wrap them in an element with `data-disclosure-group` and `data-variant="single"`; `attach` closes the others. A native `<button aria-expanded aria-controls>`; closed panels are `inert`.
