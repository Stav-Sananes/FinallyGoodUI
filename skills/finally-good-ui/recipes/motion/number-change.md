# Recipe: number-change

**Intent:** when a figure the person is watching changes (a KPI, a total, a price, a counter), the change itself is visible: digits roll or count to the new value, the direction is clear, and the layout doesn't jitter.

**Cards:** usability.system-status · typography.tabular-numbers · motion.purpose-only · motion.frequency-budget · color.color-not-sole-signal · motion.reduced-motion

**When NOT to use:** values that update more than about once a second (live tickers, timers: swap the text, no animation); many cells in a table at once (tint only the changed cell, see data-table); the number the person is typing; the first render (show the value; don't count up from zero to look busy).

**Tokens:** `--duration-long` (400, count/roll) · `--duration-short` (150, fade of changed digits) · `--ease-move` · `--color-success` / `--color-destructive` (direction, always with an arrow or sign) · `--color-accent` (change tint)

## Baseline
```css
.figure { font-variant-numeric: tabular-nums; }       /* digits keep their width while changing */
.figure[data-changed] { animation: figure-tint var(--duration-long) var(--ease-move); }
@keyframes figure-tint { from { background: var(--color-accent); } }
.figure-delta[data-trend="up"]   { color: var(--color-success); }
.figure-delta[data-trend="down"] { color: var(--color-destructive); }
@media (prefers-reduced-motion: reduce) { .figure[data-changed] { animation: none; } }
```
```html
<p class="kpi">
  <span class="figure" aria-hidden="true">$12,480</span>
  <span class="visually-hidden">Revenue: $12,480</span>
  <span class="figure-delta" data-trend="up">▲ 4.2% vs last week</span>
</p>
```
The visible figure animates and is hidden from screen readers; the hidden copy holds only the final value, so assistive tech never reads intermediate numbers. If the change matters right now (a balance after a transfer), put the hidden copy in a polite live region.

## Counting to the new value (no library)
```js
import { ms, easeFn, reduced } from "./motion-tokens"; // recipes/INDEX.md
export function animateFigure(el, from, to, format) {
  el.setAttribute("data-changed", "");
  el.addEventListener("animationend", () => el.removeAttribute("data-changed"), { once: true });
  if (reduced() || from === to) { el.textContent = format(to); return; }
  const duration = ms("long"), ease = easeFn("move"), start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format(from + (to - from) * ease(t));
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
// format = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
```
Format every intermediate value with the same `Intl.NumberFormat` as the final one, so separators and currency never flicker. Round to the final value's precision.

## Libraries
`animation` lists `number-flow` (`@number-flow/react`, `/vue`, `/svelte`, or the `number-flow` element): it rolls each digit and keeps the text accessible.
```tsx
import NumberFlow from "@number-flow/react";
import { ms, cssEase } from "./motion-tokens";
<NumberFlow value={revenue} locales={locale} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
  transformTiming={{ duration: ms("long"), easing: cssEase("move") }}
  spinTiming={{ duration: ms("long"), easing: cssEase("move") }}
  opacityTiming={{ duration: ms("short"), easing: cssEase("exit") }} />
```
It respects reduced motion by default (`respectMotionPreference`). Put several figures that change together in one `NumberFlowGroup` so they move as one.

## A11y
- Direction is never colour alone: an arrow or a sign, and words in the hidden text ("up 4.2%").
- Don't announce routine refreshes; announce only changes the person caused or must act on.

## Upgrade trigger
Number Flow, when rolling digits are part of the product's character (a finance dashboard's hero figure) and React, Vue or Svelte is in use. Ask first with the size cost.
