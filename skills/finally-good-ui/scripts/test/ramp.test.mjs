import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "./_h.mjs";
import { colorScale, PRESETS } from "../lib/ramp.mjs";
import { oklchInGamut } from "../lib/contrast.mjs";

// Component kits (Mantine, Prime, Chakra, Skeleton, Radix Themes, Fluent…) want a tonal scale
// per colour, not a semantic pair. The scale is built from one seed colour in OKLCH.
const parse = (s) => s.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+|none)\)$/).slice(1).map((x) => (x === "none" ? x : Number(x)));
const BLUE = "oklch(0.5 0.14 262)";

test("tailwind preset: 50…950, lightness falls step by step, the seed sits exactly on its nearest step", () => {
  const s = colorScale(BLUE, "tailwind");
  assert.deepEqual(Object.keys(s.steps), ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]);
  const L = Object.values(s.steps).map((v) => parse(v)[0]);
  for (let i = 1; i < L.length; i++) assert.ok(L[i] < L[i - 1], `step ${i} darker than ${i - 1}`);
  assert.equal(s.steps[s.anchor], BLUE);
  assert.equal(s.anchor, "700", "L 0.5 is closest to the 700 target");
});

test("every generated step is a displayable sRGB colour; the seed is kept as written; ends carry less chroma", () => {
  for (const seed of [BLUE, "oklch(0.65 0.25 29)", "oklch(0.86 0.17 95)", "#16a34a"]) {
    const s = colorScale(seed, "tailwind");
    for (const [name, v] of Object.entries(s.steps)) {
      if (name === s.anchor) continue; // a wide-gamut brand colour stays the author's choice
      assert.ok(oklchInGamut(...parse(v)), `${seed} ${name} ${v} out of gamut`);
    }
  }
  assert.equal(colorScale("oklch(0.65 0.25 29)").steps["500"], "oklch(0.65 0.25 29)");
  const s = colorScale(BLUE, "tailwind");
  const C = (k) => parse(s.steps[k])[1];
  assert.ok(C("50") < C("700") && C("950") < C("700"));
});

test("a grey seed gives a grey scale", () => {
  const s = colorScale("oklch(0.55 0 0)", "tailwind");
  for (const v of Object.values(s.steps)) assert.equal(parse(v)[1], 0);
});

test("other kits' step names: mantine 0–9, radix 1–12 with the seed on 9, fluent 10–160 dark to light", () => {
  assert.deepEqual(Object.keys(colorScale(BLUE, "mantine").steps), ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  const radix = colorScale(BLUE, "radix");
  assert.equal(Object.keys(radix.steps).length, 12);
  assert.equal(radix.steps["9"], BLUE, "Radix's step 9 is the solid brand colour");
  assert.ok(parse(radix.steps["10"])[0] < parse(radix.steps["9"])[0], "10 is the hover state, a little darker");
  const fluent = colorScale(BLUE, "fluent");
  assert.equal(Object.keys(fluent.steps).length, 16);
  assert.ok(parse(fluent.steps["10"])[0] < parse(fluent.steps["160"])[0]);
  assert.deepEqual(Object.keys(PRESETS).sort(), ["fluent", "mantine", "radix", "tailwind"]);
});

test("color-scale CLI: json by default, css variables on request, usage errors exit 2", () => {
  const j = run("color-scale.mjs", [BLUE, "--preset", "mantine"]);
  assert.equal(j.code, 0, j.stderr);
  assert.equal(j.json.preset, "mantine");
  assert.equal(Object.keys(j.json.steps).length, 10);
  const c = run("color-scale.mjs", [BLUE, "--name", "brand", "--format", "css"]);
  assert.match(c.stdout, /--color-brand-50: oklch\(/);
  assert.match(c.stdout, /--color-brand-700: oklch\(0\.5 0\.14 262\);/);
  assert.equal(run("color-scale.mjs", ["not-a-colour"]).code, 2);
  assert.equal(run("color-scale.mjs", [BLUE, "--preset", "nope"]).code, 2);
});
