# Pattern: chart

**Intent:** charts use the project's palette, type and grid colours in both themes, through whatever chart library the project has, and every reader can match each series to its label.

**Cards:** data.chart-palette · data.chart-choice · data.data-ink · color.color-not-sole-signal · states.loading-perceived · motion.frequency-budget

**When NOT to use:** exact values people need to look up (a table, data-table); a single number with its change (a KPI tile, number-change); decoration with no question behind it (data.chart-choice).

**Tokens:** `--color-chart-1…8` (series, in order) · `--color-border` (grid, axis lines) · `--color-muted-foreground` (tick labels, legend) · `--color-foreground` (titles, values) · `--color-card` (tooltip) · `--font-sans` · `--duration-standard` (one entrance, or none)

## Palette rules
- Series take `chart-1`, `chart-2`… in order; never pick from the middle for looks. A chart's highlight series is `chart-1`; the rest can step back to `--color-muted-foreground`.
- Six series at most where colour alone identifies them. Beyond that, or when two series sit next to each other in a stack, label the series directly at the line end or bar, and keep the legend.
- Status (success/warning/destructive) only when the series *is* a status (failed vs passed); brand primary only for a single-series chart.
- After changing the palette run `node "${CLAUDE_SKILL_DIR}/scripts/check-palette.mjs" --in .design/tokens.json` (contrast and colour-blind separation, both themes).

## SVG libraries: pass the variables
The browser resolves `var()` in SVG fills and strokes, and the theme switch just works.
| Stack profile `charts` | Where the tokens go |
|---|---|
| `recharts` (and shadcn `chart`) | shadcn: `ChartConfig` `{ revenue: { label: "Revenue", color: "var(--chart-1)" } }`, then `fill="var(--color-revenue)"`. Plain Recharts: `<Bar fill="var(--color-chart-1)" />`, `<CartesianGrid stroke="var(--color-border)" vertical={false} />`, `<XAxis tick={{ fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />` |
| `tremor` (copy-in) | in its `chartUtils.ts` colour map, point each entry at the Tailwind utilities `fill-chart-1`, `stroke-chart-1`, `bg-chart-1` (from `--color-chart-N`) |
| `visx` | `buildChartTheme({ colors: ["var(--color-chart-1)", …], gridColor: "var(--color-border)", gridColorDark: "var(--color-border)", tickLength: 4, svgLabelSmall: { fill: "var(--color-muted-foreground)" }, svgLabelBig: { fill: "var(--color-foreground)" } })` |
| `plot` | `Plot.plot({ color: { type: "ordinal", range: ["var(--color-chart-1)", …] }, style: { fontFamily: "var(--font-sans)" } })`; axes already use `currentColor` |
| `unovis` | `:root { --vis-color0: var(--color-chart-1); --vis-color1: var(--color-chart-2); … --vis-font-family: var(--font-sans); }` (our variables already switch with the theme, so its `--vis-dark-*` set isn't needed) |
| `layerchart` | its CSS variables and `:where(.lc-*)` rules take `var(--color-chart-N)`; pass series colours as `var()` strings |
| `nivo` (SVG components) | `colors={["var(--color-chart-1)", …]}` and `theme={{ text: { fill: "var(--color-muted-foreground)" }, grid: { line: { stroke: "var(--color-border)" } }, tooltip: { container: { background: "var(--color-card)" } } }}`; its canvas components need the canvas path below |
| `victory` | a theme object whose `palette.colorScale` is the `var()` list and whose axis `grid.stroke` / `tickLabels.fill` use our variables |
| `d3` | `d3.scaleOrdinal(["var(--color-chart-1)", …])` for fills and strokes |

## Canvas libraries: resolved colours
Canvas can't read CSS variables. Generate the theme module once and re-run it whenever `tokens.json` changes:
```
node "${CLAUDE_SKILL_DIR}/scripts/emit-tokens.mjs" --in .design/tokens.json --format chart-theme > src/lib/chart-theme.js
```
It reads the live variables (so overrides and the dark theme win), resolves any colour format to sRGB, and falls back to the token values on the server.
```js
import { echartsTheme, applyChartJsTheme, chartColors, onThemeChange } from "./chart-theme";

// echarts (also echarts-for-react / vue-echarts via their theme prop)
echarts.registerTheme("fgu", echartsTheme());
const chart = echarts.init(el, "fgu");
const stop = onThemeChange(() => { echarts.registerTheme("fgu", echartsTheme()); chart.setTheme("fgu"); });

// chartjs (also react-chartjs-2 / vue-chartjs)
const series = applyChartJsTheme(Chart);          // once, before creating charts
datasets.forEach((d, i) => { d.backgroundColor = series[i]; d.borderColor = series[i]; });
onThemeChange(() => { applyChartJsTheme(Chart); /* rebuild dataset colours */ chartInstance.update(); });

// ag-charts
const c = chartColors();
const theme = { baseTheme: "ag-default", palette: { fills: c.series, strokes: c.series },
  params: { fontFamily: c.font, foregroundColor: c.text, backgroundColor: "transparent" } };

// uplot
const c2 = chartColors();
series.forEach((s, i) => { s.stroke = c2.series[i]; });
axes.forEach((a) => { a.stroke = c2.mutedText; a.grid = { stroke: c2.grid }; });
```
Call `stop()` when the chart unmounts.

## Motion
Animate the first draw once at `--duration-standard` or not at all; data refreshes and live data update in place without animation (motion.frequency-budget). `chart-theme.js` sets the duration to 0 under reduced motion; SVG libraries need `isAnimationActive={!reduced()}` (Recharts) or the library's equivalent.

## States
| State | Shows |
|---|---|
| loading | the axes and frame at full size with a quiet skeleton plot area, so nothing shifts (skeleton-to-content) |
| empty | the frame with one line saying why ("No orders in this period") and a way to change the period (empty-state) |
| partial | the data that exists, with the gap marked ("No data 3–5 May"), never a line drawn through it |
| error | the frame with the error and Retry (states.error-recovery) |

## A11y
- A visible title that states the takeaway, and an accessible description (`role="img"` + `aria-label` on the SVG, or `aria-describedby` pointing at a one-sentence summary).
- The same data available as a table (toggle or link) for screen-reader and keyboard users.
- Series identified by direct labels or the legend text, not colour alone (color.color-not-sole-signal); dashed lines or markers help for lines.
- Tooltips work on keyboard focus too, or the table carries the exact values.

## Upgrade trigger
None: use the chart library the project has. Suggest one only when there is none: Recharts (React, with shadcn chart) or LayerChart (Svelte) for SVG; ECharts when thousands of points or canvas rendering are needed. Ask first.
