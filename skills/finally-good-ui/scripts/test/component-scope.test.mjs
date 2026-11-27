import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SR } from "./_h.mjs";
import { loadSpec } from "../lib/component-spec.mjs";
import { mapSelectors, splitTop, scopeComponentCss, partSelector } from "../lib/css-scope.mjs";
import { profileCss } from "../lib/style-profile.mjs";

const COMPONENTS = join(SR, "components");
const NAMES = readdirSync(COMPONENTS).filter((d) => d !== "adapters" && !d.endsWith(".md")).sort();
const read = (...p) => readFileSync(join(COMPONENTS, ...p), "utf8");
const selectorsOf = (css) => { const out = []; mapSelectors(css, (s) => { out.push(s.trim()); return s; }); return out; };
const profile = (material) => ({ radius: "soft", material, density: "balanced", motion: "balanced", motif: "test" });

test("the selector collector has a positive control", () => {
  assert.deepEqual(selectorsOf("a, b > c { x: 1 }\n@media (x) { d { y: 2 } }"), ["a", "b > c", "d"]);
  assert.ok(NAMES.length >= 8, NAMES.join(","));
});

test("every selector in every reference stylesheet is scoped to its own component", () => {
  for (const name of NAMES) {
    const selectors = selectorsOf(read(name, `${name}.css`));
    assert.ok(selectors.length > 3, `${name}: found rules`);
    for (const s of selectors) assert.ok(s.startsWith(`[data-fgu="${name}"]`), `${name}: bare selector "${s}"`);
  }
});

test("two components never share a selector", () => {
  const seen = new Map();
  for (const name of NAMES) for (const s of [...selectorsOf(read(name, `${name}.css`)), ...selectorsOf(profileCss(profile("layered"), loadSpec(join(COMPONENTS, name))))]) {
    assert.ok(!seen.has(s) || seen.get(s) === name, `"${s}" is used by ${seen.get(s)} and ${name}`);
    seen.set(s, name);
  }
});

test("the profile layer is scoped and never resets a border, shadow or padding on a part globally", () => {
  for (const name of NAMES) for (const material of ["flat", "layered", "outlined"]) {
    const css = profileCss(profile(material), loadSpec(join(COMPONENTS, name)));
    for (const s of selectorsOf(css)) assert.ok(s.startsWith(`[data-fgu="${name}"]`), `${name}/${material}: bare selector "${s}"`);
    assert.doesNotMatch(css, /border-style:\s*none|border:\s*(0|none)|padding(-\w+)*:\s*0\b/, `${name}/${material}`);
  }
});

test("every reference page marks each root part with data-fgu", () => {
  for (const name of NAMES) {
    const html = read(name, "reference/index.html");
    const roots = [...html.matchAll(/<[^>]*data-part="root"[^>]*>/g)].map((m) => m[0]);
    assert.ok(roots.length > 0, name);
    for (const r of roots) assert.match(r, new RegExp(`data-fgu="${name}"`), `${name}: ${r}`);
  }
});

test("outlined + field: the border goes on the control only, in the input colour, without clobbering it", () => {
  const spec = loadSpec(join(COMPONENTS, "field"));
  const css = profileCss(profile("outlined"), spec);
  const control = css.match(/\[data-fgu="field"\] \[data-part="control"\] \{[^}]*\}/)[0];
  assert.match(control, /border-style:\s*solid/);
  assert.match(control, /border-width:\s*var\(--border-width-strong\)/);
  assert.match(control, /border-color:\s*var\(--color-input\)/);
  assert.doesNotMatch(control, /box-shadow/, "a control keeps the reference's own shadow (the invalid ring)");
  assert.doesNotMatch(css, /\[data-part="(label|hint|error)"\]/, "text parts untouched");
  assert.ok(!selectorsOf(css).includes('[data-fgu="field"][data-part="root"]') || !/border/.test(css.match(/\[data-fgu="field"\]\[data-part="root"\] \{[^}]*\}/)?.[0] ?? ""), "root gets no border");
});

test("flat material keeps a checkbox border: the toggle control gets no material at all", () => {
  for (const material of ["flat", "layered", "outlined"]) {
    const css = profileCss(profile(material), loadSpec(join(COMPONENTS, "toggle")));
    assert.doesNotMatch(css, /^\s*(border-(style|width|color|radius)|box-shadow)\s*:/m, material);
  }
});

test("material changes the surface only: flat removes a dialog shadow, layered sets one, outlined draws a border", () => {
  const spec = loadSpec(join(COMPONENTS, "dialog"));
  assert.match(profileCss(profile("flat"), spec), /box-shadow:\s*none/);
  assert.match(profileCss(profile("layered"), spec), /box-shadow:\s*var\(--shadow-/);
  assert.match(profileCss(profile("outlined"), spec), /border-style:\s*solid/);
  assert.doesNotMatch(profileCss(profile("outlined"), spec).replace(/@media[\s\S]*$/, ""), /\[data-part="(title|close|actions)"\]/, "no material on the title, close or actions");
});

test("a dialog's profile layer leaves its padding and enter transition alone", () => {
  const css = profileCss(profile("layered"), loadSpec(join(COMPONENTS, "dialog"))).replace(/@media[\s\S]*$/, "");
  assert.doesNotMatch(css, /padding|min-height|transition-(property|duration)/);
});

test("scopeComponentCss is idempotent and keeps keyframes", () => {
  const once = scopeComponentCss("x", '[data-part="root"] { a: 1 }\n[data-part="y"]:hover { b: 2 }\n@keyframes k { to { z: 3 } }');
  assert.match(once, /\[data-fgu="x"\]\[data-part="root"\]/);
  assert.match(once, /\[data-fgu="x"\] \[data-part="y"\]:hover/);
  assert.match(once, /@keyframes k \{ to \{ z: 3 \} \}/);
  assert.equal(scopeComponentCss("x", once), once);
  assert.equal(partSelector("x", "root"), '[data-fgu="x"][data-part="root"]');
  assert.deepEqual(splitTop("a, b:not(c, d)"), ["a", "b:not(c, d)"]);
});
