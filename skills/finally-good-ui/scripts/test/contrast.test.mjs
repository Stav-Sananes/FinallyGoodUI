import { test } from "node:test";
import assert from "node:assert/strict";
import { parseColor, contrastRatio, apcaLc, toHex, toOklch } from "../lib/contrast.mjs";
import { run } from "./_h.mjs";

const near = (a, b, eps = 0.02) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b}`);

test("parses hex, rgb, hsl, oklch", () => {
  assert.deepEqual(toHex(parseColor("#fff")), "#ffffff");
  assert.equal(toHex(parseColor("rgb(255 0 0)")), "#ff0000");
  assert.equal(toHex(parseColor("rgba(0, 128, 0, 0.5)")), "#008000");
  assert.equal(parseColor("rgba(0, 128, 0, 0.5)").a, 0.5);
  assert.equal(toHex(parseColor("hsl(0, 100%, 50%)")), "#ff0000");
  assert.equal(toHex(parseColor("222.2 84% 4.9%")), "#020817"); // shadcn raw hsl triplet
  assert.equal(parseColor("not-a-color"), null);
});

test("oklch -> srgb conversion", () => {
  assert.equal(toHex(parseColor("oklch(1 0 0)")), "#ffffff");
  assert.equal(toHex(parseColor("oklch(0 0 0)")), "#000000");
  assert.equal(toHex(parseColor("oklch(62.8% 0.2577 29.23)")), "#ff0000");
  assert.equal(toHex(parseColor("oklch(0.5198 0.1769 142.5)")), "#008000");
});

test("srgb -> oklch round trip", () => {
  const o = toOklch(parseColor("#ff0000"));
  near(o.l, 0.628, 0.002); near(o.c, 0.2577, 0.002); near(o.h, 29.23, 0.1);
});

test("WCAG contrast ratio", () => {
  near(contrastRatio("#000", "#fff"), 21);
  near(contrastRatio("#777", "#fff"), 4.48);
  near(contrastRatio("#fff", "#777"), 4.48);
  near(contrastRatio("oklch(1 0 0)", "oklch(0 0 0)"), 21);
});

test("APCA Lc", () => {
  near(apcaLc("#000", "#fff"), 106.04, 0.1);
  near(apcaLc("#fff", "#000"), -107.88, 0.1);
  near(apcaLc("#888", "#fff"), 63.06, 0.2);
});

test("CLI prints JSON verdict", () => {
  const r = run("lib/contrast.mjs", ["#777777", "#ffffff"]);
  assert.equal(r.code, 0);
  near(r.json.ratio, 4.48);
  assert.equal(r.json.wcag.aa.normal, false);
  assert.equal(r.json.wcag.aa.large, true);
  assert.equal(typeof r.json.apca, "number");
});

test("CLI usage error on missing/invalid colors", () => {
  assert.equal(run("lib/contrast.mjs", ["#fff"]).code, 2);
  assert.equal(run("lib/contrast.mjs", ["nope", "#fff"]).code, 2);
});
