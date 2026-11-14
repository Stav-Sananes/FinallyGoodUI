# Recipe: tabs-indicator

**Intent:** in tabs and segmented controls, one indicator slides from the old choice to the new one, so the eye follows the change; arrow keys move between choices with one tab stop for the whole group.

**Cards:** motion.spatial-continuity · motion.compositor-only · motion.frequency-budget · a11y.keyboard-complete · ia-nav.wayfinding-location · motion.reduced-motion

**When NOT to use:** navigation between pages (a nav with `aria-current="page"`, see app-shell-nav; route-transition handles the page); more than about six choices (a select, see menu-select-combobox); a binary on/off (a switch).

**Tokens:** `--duration-standard` (250) · `--ease-move` · `--color-primary` (underline) · `--color-card` (segmented thumb) · `--radius-md` · `--shadow-sm`

## Structure and keyboard (WAI-ARIA APG tabs)
```html
<div role="tablist" aria-label="Invoice views" class="tabs">
  <button role="tab" id="tab-open" aria-selected="true" aria-controls="panel-open">Open</button>
  <button role="tab" id="tab-paid" aria-selected="false" aria-controls="panel-paid" tabindex="-1">Paid</button>
  <button role="tab" id="tab-void" aria-selected="false" aria-controls="panel-void" tabindex="-1">Void</button>
  <span class="tabs-indicator" aria-hidden="true"></span>
</div>
<div role="tabpanel" id="panel-open" aria-labelledby="tab-open" tabindex="0">…</div>
```
| Key | Does |
|---|---|
| ← / → (↑ / ↓ if `aria-orientation="vertical"`) | previous / next tab, wrapping |
| Home / End | first / last tab |
| Tab | leaves the tablist, into the panel |

Selection follows focus when panels are already loaded and cheap to show. When a panel fetches data, move focus with the arrows and select with Enter or Space instead. A segmented control that filters one view is the same widget; if it changes a value in a form, use a radio group (`role="radiogroup"`) with the same visual.

## Indicator CSS
Underline: one element moved with `transform` only (`translateX` + `scaleX`; at 2px tall the scale doesn't distort).
```css
.tabs { position: relative; display: flex; gap: var(--space-1); }
.tabs-indicator {
  position: absolute; left: 0; bottom: 0; height: 2px; width: 1px;
  background: var(--color-primary); transform-origin: 0 0;
  transform: translateX(var(--indicator-x, 0px)) scaleX(var(--indicator-w, 0));
}
.tabs[data-ready] .tabs-indicator { transition: transform var(--duration-standard) var(--ease-move); }
@media (prefers-reduced-motion: reduce) { .tabs[data-ready] .tabs-indicator { transition: none; } }
```
Segmented control (a pill thumb with rounded ends that mustn't stretch): animate a clip instead of a scale.
```css
.segmented { position: relative; display: inline-grid; grid-auto-flow: column; padding: 2px; border-radius: var(--radius-md); background: var(--color-muted); }
.segmented .tabs-indicator {
  position: absolute; inset: 2px; width: auto; height: auto; transform: none;
  background: var(--color-card); box-shadow: var(--shadow-sm);
  clip-path: inset(0 calc(100% - var(--indicator-x, 0px) - var(--indicator-w-px, 0px)) 0 var(--indicator-x, 0px) round var(--radius-md));
}
.segmented[data-ready] .tabs-indicator { transition: clip-path var(--duration-standard) var(--ease-move); }
.segmented [role="tab"] { position: relative; z-index: 1; } /* labels above the thumb */
```
`clip-path` repaints but never moves layout. No transition on first paint (`data-ready` is set after the first measure), so the indicator doesn't fly in from the left when the page loads.

## Script (keyboard + measuring)
```js
export function tabs(list) {
  const tabsOf = () => [...list.querySelectorAll('[role="tab"]')];
  const place = () => {
    const tab = list.querySelector('[aria-selected="true"]');
    const box = list.getBoundingClientRect(), r = tab.getBoundingClientRect();
    const inset = list.classList.contains("segmented") ? 2 : 0;   // the thumb's inset
    list.style.setProperty("--indicator-x", `${r.left - box.left - inset}px`);
    list.style.setProperty("--indicator-w", `${r.width}`);
    list.style.setProperty("--indicator-w-px", `${r.width}px`);
  };
  const select = (tab) => {
    for (const t of tabsOf()) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    }
    tab.focus(); place();
  };
  list.addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
  list.addEventListener("keydown", (e) => {
    const all = tabsOf(), i = all.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1 + all.length, Home: 0, End: all.length - 1 }[e.key];
    if (next === undefined || i < 0) return;
    e.preventDefault(); select(all[next % all.length]);
  });
  new ResizeObserver(place).observe(list);   // fonts load, labels change, the window resizes
  place(); requestAnimationFrame(() => list.setAttribute("data-ready", ""));
}
```
Right-to-left: swap ArrowLeft/ArrowRight when `getComputedStyle(list).direction === "rtl"`.

## Libraries
| Stack | Indicator |
|---|---|
| `primitives` has `base-ui` | `<Tabs.Indicator>` exposes the active tab's box as `--active-tab-left` and `--active-tab-width`; use them in the transform above |
| Radix / shadcn (`data-state="active"`) | no indicator part: measure the active trigger as in the script, or draw a per-tab underline that fades (no slide) |
| Motion (`animation` lists `motion`) | render `<m.span layoutId="tab-indicator" transition={{ duration: sec("standard"), ease: ease("move") }} />` inside the selected tab |
| Reka / Bits / Ark | `TabsIndicator` where the library ships one (it sets the active tab's size and position as CSS variables); otherwise the script |

## Panel change
The panel swaps instantly or crossfades at `--duration-short`; it never slides sideways (tabs are siblings: route-transition's "lateral" rule).

## A11y
- One tab stop for the tablist; the panel is the next stop (`tabindex="0"` when it has no focusable content).
- The selected state is also shown by weight or colour of the label, not by the indicator alone (it is `aria-hidden`).

## Upgrade trigger
None. The installed tabs component's own indicator if it has one, else this script.
