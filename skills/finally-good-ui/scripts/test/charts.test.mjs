import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { paletteIssues } from "../lib/palette.mjs";
import { detectStack } from "../detect-stack.mjs";

// Charts: a categorical palette that every reader can tell apart, the libraries that draw it, and a
// theme for canvas renderers (ECharts, Chart.js), which can't read CSS variables.
const DEF = join(SR, "tokens", "default.tokens.json");

test("palette check: low contrast and colour-blind look-alikes are reported; the shipped palette passes", () => {
  const BG = "#ffffff";
  assert.deepEqual(paletteIssues(["#1f6fd1", "#d1501f", "#a23b8c"], BG), []);
  assert.match(paletteIssues(["#1f6fd1", "#ffe680"], BG).join("\n"), /chart-2: 1\.\d+:1 against the background/);
  const redGreen = paletteIssues(["#c8402f", "#5a8a2a"], BG).join("\n");
  assert.match(redGreen, /chart-1 and chart-2 look alike under (protanopia|deuteranopia)/);
  const r = run("check-palette.mjs", ["--in", DEF]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.equal(r.json.series, 8);
  assert.equal(r.json.ok, true);
  assert.deepEqual(r.json.issues, []);
});

test("check-palette reports each theme's problems (ok: false; findings are not errors), exit 2 without chart colours", () => {
  const d = tmp();
  const bad = { color: {
    background: { $type: "color", $value: "#ffffff", $extensions: { fgu: { dark: "#101010" } } },
    "chart-1": { $type: "color", $value: "#c8402f", $extensions: { fgu: { dark: "#e0705f" } } },
    "chart-2": { $type: "color", $value: "#5a8a2a", $extensions: { fgu: { dark: "#202020" } } },
  } };
  writeFileSync(join(d, "bad.json"), JSON.stringify(bad));
  const r = run("check-palette.mjs", ["--in", join(d, "bad.json")]);
  assert.equal(r.code, 0);
  assert.equal(r.json.ok, false);
  assert.ok(r.json.issues.some((i) => /^dark chart-2: 1\.\d+:1/.test(i)), r.stdout);
  assert.ok(r.json.issues.some((i) => /^light chart-1 and chart-2 look alike/.test(i)), r.stdout);
  writeFileSync(join(d, "none.json"), JSON.stringify({ color: { background: bad.color.background } }));
  assert.equal(run("check-palette.mjs", ["--in", join(d, "none.json")]).code, 2);
});

test("chart colours reach CSS as --color-chart-N and shadcn as --chart-N", () => {
  const css = run("emit-tokens.mjs", ["--in", DEF, "--format", "css"]).stdout;
  assert.match(css, /--color-chart-1: oklch\(0\.43 0\.19 264\);/);
  assert.match(css, /--color-chart-8:/);
  const shadcn = run("emit-tokens.mjs", ["--in", DEF, "--format", "shadcn"]).stdout;
  assert.match(shadcn, /^\s*--chart-1: oklch/m);
  assert.match(shadcn, /--color-chart-1: var\(--chart-1\);/);
});

test("chart libraries detected into charts[]", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: {
    recharts: "3.10.1", echarts: "6.1.0", "vue-echarts": "8.3.2", "chart.js": "4.6.1", "react-chartjs-2": "5.3.1",
    "@visx/xychart": "4.0.0", "@nivo/line": "0.99.0", "@observablehq/plot": "0.6.19", "ag-charts-community": "14.3.0",
    uplot: "1.6.32", victory: "38.1.0", "@unovis/ts": "1.8.1", layerchart: "2.10.1", "@tremor/react": "3.18.7", d3: "7.9.2",
  } }));
  assert.deepEqual([...detectStack(d).charts].sort(), [
    "ag-charts", "chartjs", "d3", "echarts", "layerchart", "nivo", "plot", "recharts", "tremor", "unovis", "uplot", "victory", "visx",
  ]);
  assert.deepEqual(detectStack(tmp()).charts, []);
});

const chartModule = async () => {
  const d = tmp();
  const r = run("emit-tokens.mjs", ["--in", DEF, "--format", "chart-theme"]);
  assert.equal(r.code, 0, r.stderr);
  writeFileSync(join(d, "chart-theme.mjs"), r.stdout);
  return import(join(d, "chart-theme.mjs"));
};

test("chart-theme module: resolved hex colours without a DOM, an ECharts theme and Chart.js defaults", async () => {
  const m = await chartModule();
  const raw = JSON.parse(readFileSync(DEF, "utf8"));
  const c = m.chartColors();
  assert.equal(c.series.length, 8);
  assert.equal(c.series[0], raw.color["chart-1"].$value.hex, "server fallback is the light token's hex");
  assert.match(c.text, /^#[0-9a-f]{6}$/);
  const e = m.echartsTheme();
  assert.deepEqual(e.color, c.series);
  assert.equal(e.valueAxis.splitLine.lineStyle.color, c.grid);
  assert.equal(e.animationDuration, 250);
  const Chart = { defaults: { font: {}, plugins: { tooltip: {} }, animation: {} } };
  const series = m.applyChartJsTheme(Chart);
  assert.deepEqual(series, c.series);
  assert.equal(Chart.defaults.color, c.mutedText);
  assert.equal(Chart.defaults.borderColor, c.grid);
  assert.equal(Chart.defaults.plugins.tooltip.backgroundColor, c.surface);
  assert.equal(typeof m.onThemeChange(() => {}), "function", "returns an unsubscribe");
});
