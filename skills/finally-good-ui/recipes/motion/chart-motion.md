# Recipe: chart-motion

**Intent:** charts move only to explain data. On first view a line draws from left to right and bars grow from their baseline, once. When the person changes the range or series, the marks move from their old values to the new ones, so they can see what went up and what went down. Progress bars and meters fill to their value. Live refreshes don't animate.

**Cards:** data.data-ink · data.chart-choice · motion.purpose-only · motion.frequency-budget · motion.spatial-continuity · motion.compositor-only · color.color-not-sole-signal · motion.reduced-motion

**When NOT to use:** data that refreshes on its own (polling, streaming: update in place); charts the person flips between many times a minute (range scrubbing: instant); sparklines in table cells (dozens at once: static); a chart whose library already animates (theme its timing instead, patterns/chart.md and `chart-theme.js`).

**Tokens:** `--duration-long` (400, first line draw and bar grow) · `--duration-medium` (300, range change) · `--duration-instant` (50, step between bars, at most 8 steps) · `--ease-move` (value changes) · `--ease-enter` (first draw) · `--color-chart-1`…`--color-chart-8`

## Line draws in (SVG)
`pathLength="1"` turns the dash maths into 0→1 whatever the path's real length.
```html
<svg class="chart" viewBox="0 0 600 200" role="img" aria-labelledby="cash-title cash-desc">
  <title id="cash-title">Cash in the bank, last 13 weeks</title>
  <desc id="cash-desc">Dips after each payroll; lowest $397,000 on 19 Oct; now $486,210.</desc>
  <path class="chart-line" d="M0 120 L50 98 …" pathLength="1"/>
  <circle class="chart-last" cx="600" cy="40" r="4"/>
</svg>
```
```css
.chart-line {
  fill: none; stroke: var(--color-chart-1); stroke-width: 2; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 0;
}
.chart[data-first] .chart-line { animation: chart-draw var(--duration-long) var(--ease-enter) both; }
.chart[data-first] .chart-last { animation: chart-dot var(--duration-standard) var(--ease-enter) var(--duration-long) both; }
@keyframes chart-draw { from { stroke-dashoffset: 1; } }
@keyframes chart-dot { from { opacity: 0; transform: scale(0.6); } }
.chart-last { transform-box: fill-box; transform-origin: center; fill: var(--color-chart-1); }
```
The final point appears after the line reaches it: the eye ends on "now".

## Bars grow from the baseline
```css
.bar {
  transform-box: fill-box; transform-origin: bottom;   /* left for horizontal bars */
  transition: transform var(--duration-medium) var(--ease-move);
}
.chart[data-first] .bar {
  animation: bar-grow var(--duration-long) var(--ease-enter) both;
  animation-delay: calc(min(var(--i, 0), 7) * var(--duration-instant));
}
@keyframes bar-grow { from { transform: scaleY(0.02); } }
```
Set `--i` per bar; the stagger stops at the eighth bar so a 30-bar chart still finishes in time. Bars grow from a sliver, not from nothing.

## Range or series change: move, don't redraw
Bars: keep one element per category and change its height through `transform: scaleY(value / max)` (CSS transitions it, compositor-only), or animate the `height`/`y` attributes with WAAPI. Lines: interpolate the points, not the path string (paths with different point counts morph badly).
```js
import { ms, easeFn, reduced } from "./motion-tokens"; // recipes/INDEX.md
export function morphLine(path, fromYs, toYs, toPath) {
  if (reduced() || fromYs.length !== toYs.length) { path.setAttribute("d", toPath(toYs)); return; }
  const start = performance.now(), d = ms("medium"), e = easeFn("move");
  const step = (now) => {
    const t = Math.min(1, (now - start) / d), k = e(t);
    path.setAttribute("d", toPath(fromYs.map((y, i) => y + (toYs[i] - y) * k)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```
When the point count changes (week → month), crossfade the two charts in place instead (`opacity` over `--duration-short`); axes update without animation.

## Progress and meters fill
```html
<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="12" aria-valuenow="9" aria-label="Issues closed this sprint">
  <span class="meter-fill" style="--v: 0.75"></span>
</div>
```
```css
.meter { block-size: 6px; border-radius: 999px; background: var(--color-muted); overflow: hidden; }
.meter-fill {
  display: block; block-size: 100%; background: var(--color-primary);
  transform-origin: left; transform: scaleX(var(--v));
  transition: transform var(--duration-medium) var(--ease-move);
}
[dir="rtl"] .meter-fill { transform-origin: right; }
```

## First view only, then reduced motion
Put `data-first` on the chart when it first scrolls into view (an `IntersectionObserver`, once), and remove it after `animationend`, so a later re-render doesn't replay.
```css
@media (prefers-reduced-motion: reduce) {
  .chart[data-first] .chart-line, .chart[data-first] .bar, .chart[data-first] .chart-last { animation: none; }
  .bar, .meter-fill { transition: none; }
}
```

## React + Motion
Libraries (Recharts, Nivo, visx with react-spring) animate themselves: pass the tokens (`animationDuration={ms("medium")}`, `isAnimationActive={!reduced()}`). Hand-drawn SVG in React: the CSS above plus `morphLine` in an effect keyed on the data.

## Vue / Svelte
Svelte `tweened` stores for the point arrays (`duration: msMotion("medium"), easing: easeFn("move")`) give the morph for free.

## A11y
- Every chart has a title and a one-sentence description of what it shows (the takeaway, not "a chart").
- Motion never carries meaning on its own: up and down are also in the numbers and labels.
- Meters and progress bars expose their value (`role="meter"` / `progressbar` with `aria-valuenow`).

## Upgrade trigger
A chart library when the chart needs axes, tooltips, zoom or many series (patterns/chart.md); keep its animation within these tokens.
