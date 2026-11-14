# Recipe: tooltip-group

**Intent:** tooltips wait a moment before the first one appears (so moving the pointer across a toolbar doesn't flash labels), then open instantly for neighbours while the person is exploring, open at once on keyboard focus, and only ever one at a time.

**Cards:** motion.frequency-budget · motion.purpose-only · a11y.keyboard-complete · a11y.semantic-first · ia-nav.progressive-disclosure · usability.recognition-over-recall

**When NOT to use:** to hold information the person needs to finish the task (put it on the page); for interactive content such as links or buttons (that is a popover: popover-from-trigger); on touch-only screens, where nothing hovers (the label must be visible or the icon self-evident); on controls that already show the same text.

**Tokens:** `--duration-micro` (100, fade in) · `--ease-enter`. The two delays below are input timing, not animation, so they are named constants rather than motion tokens.

## Timing
| Moment | Behaviour |
|---|---|
| pointer rests on a trigger | open after `OPEN_DELAY_MS` (600) |
| pointer moves to a neighbour while one is open, or within `GROUP_WINDOW_MS` (300) of one closing | open instantly, **no fade** (`data-instant`) |
| keyboard focus (`:focus-visible`) | open instantly |
| pointer leaves trigger and tooltip / blur / Escape | close instantly |
| another opens | the previous closes; one at a time |

The pointer may move from the trigger onto the tooltip without it closing, and Escape always dismisses it (WCAG 1.4.13, content on hover or focus).

## Baseline
```html
<button class="icon-button" aria-labelledby="tip-archive" data-tooltip="tip-archive">
  <svg aria-hidden="true">…</svg>
</button>
<div id="tip-archive" role="tooltip" popover="manual">Archive</div>
```
For an icon-only button the tooltip text *is* the name (`aria-labelledby`). For a button that already has visible text, use `aria-describedby` for the extra hint.

```css
[role="tooltip"] {
  margin: 0; padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  pointer-events: auto;
  opacity: 1;
  transition: opacity var(--duration-micro) var(--ease-enter);
  @starting-style { opacity: 0; }
}
[role="tooltip"][data-instant] { transition: none; }
@media (prefers-reduced-motion: reduce) { [role="tooltip"] { transition: none; } }
```
Fade only: tooltips move nowhere, so they don't scale or slide. Position with CSS anchor positioning where supported and fall back to placing it from `getBoundingClientRect()` (or Floating UI if the stack profile lists `floating-ui`).

```js
const OPEN_DELAY_MS = 600;   // first hover; input timing, not a motion token
const GROUP_WINDOW_MS = 300; // neighbours open instantly within this window
let current = null, closedAt = -Infinity, timer = 0;

function show(trigger, instant) {
  const tip = document.getElementById(trigger.dataset.tooltip);
  if (current && current !== tip) hide();
  tip.toggleAttribute("data-instant", instant);
  if (!tip.matches(":popover-open")) tip.showPopover();
  current = tip;
}
function hide() {
  clearTimeout(timer);
  if (!current) return;
  current.hidePopover(); current = null; closedAt = performance.now();
}
export function tooltipGroup(root = document) {
  root.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-tooltip]");
    if (!t || e.pointerType === "touch") return;
    clearTimeout(timer);
    const warm = current || performance.now() - closedAt < GROUP_WINDOW_MS;
    if (warm) show(t, true); else timer = setTimeout(() => show(t, false), OPEN_DELAY_MS);
  });
  root.addEventListener("pointerout", (e) => {
    const to = e.relatedTarget;
    if (to && (to.closest("[data-tooltip]") || to.closest('[role="tooltip"]'))) return;
    hide();
  });
  root.addEventListener("focusin", (e) => {
    const t = e.target.closest("[data-tooltip]");
    if (t && t.matches(":focus-visible")) show(t, true);
  });
  root.addEventListener("focusout", hide);
  root.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
}
```

## Libraries
Set the same two numbers on whatever is installed:
| Library | Where |
|---|---|
| Radix / shadcn | `<Tooltip.Provider delayDuration={600} skipDelayDuration={300}>` once at the app root |
| Base UI | `<Tooltip.Provider delay={600} timeout={300}>` |
| React Aria | `<TooltipTrigger delay={600}>` (its default is longer) |
| Reka / Bits / Ark | the provider's `delayDuration` / `skipDelayDuration` equivalents |

Then style the open state with headless-primitive-motion, fade only, `--duration-micro`, and drop the fade for instant opens if the library marks them (Radix sets `data-state="instant-open"`).

## A11y
- Never put the only copy of important information in a tooltip; never put interactive content in one.
- Keyboard focus opens it; Escape closes it without moving focus.
- Touch: no long-press tooltips. Make the label visible or the icon unambiguous.

## Upgrade trigger
None. Native `popover="hint"` and `interestfor` will replace the script once they are Baseline; until then this controller or the installed library's provider.

Reference: Web Interface Guidelines ("tooltip timing"); UI SDK docs (Apache-2.0, ui-sdk.dev), Tooltip "Delay and grouping".
