import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { run, SR } from "./_h.mjs";
import { loadSpec } from "../lib/component-spec.mjs";

const COMPONENTS = join(SR, "components");
const dirs = () => (existsSync(COMPONENTS) ? readdirSync(COMPONENTS).filter((d) => statSync(join(COMPONENTS, d)).isDirectory()) : []);
const css = run("emit-tokens.mjs", ["--in", join(SR, "tokens/default.tokens.json"), "--format", "css"]).stdout;
const declared = (token) => new RegExp(`${token}\\s*:`).test(css);
const LITERAL = /#[0-9a-f]{3,8}\b|\d\s*px\b|\d\s*ms\b/i;

test("components/ holds at least the button", () => {
  assert.ok(dirs().includes("button"), `found: ${dirs().join(",") || "none"}`);
});

test("every component spec.json under components/ validates", () => {
  for (const d of dirs()) assert.equal(loadSpec(join(COMPONENTS, d)).name, d);
});

test("every spec's parts appear as data-part in its reference/index.html", () => {
  for (const d of dirs()) {
    const html = readFileSync(join(COMPONENTS, d, "reference/index.html"), "utf8");
    for (const p of loadSpec(join(COMPONENTS, d)).parts) assert.match(html, new RegExp(`data-part="${p}"`), `${d}: ${p}`);
  }
});

test("every spec's tokens exist in default.tokens.json emitted CSS", () => {
  for (const d of dirs()) for (const t of loadSpec(join(COMPONENTS, d)).tokens) assert.ok(declared(t), `${d}: ${t}`);
});

test("the token check fails for a made-up token", () => {
  assert.equal(declared("--color-made-up"), false);
  assert.equal(declared("--radius-md"), true);
});

test("reference css uses tokens only and respects reduced motion", () => {
  for (const d of dirs()) {
    const file = join(COMPONENTS, d, `${d}.css`);
    const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(src, LITERAL, `${d}: literal in css`);
    assert.match(src, /prefers-reduced-motion/);
    for (const m of src.matchAll(/transition(?:-property)?\s*:([^;]+);/g)) {
      assert.doesNotMatch(m[1].replace(/var\([^)]*\)/g, ""), /\b(width|height|margin|padding|top|left)\b/, `${d}: layout transition`);
    }
  }
});

test("every reference attaches and detaches", async () => {
  for (const d of dirs()) {
    const mod = await import(join(COMPONENTS, d, `${d}.js`));
    assert.equal(typeof mod.attach, "function");
    const listeners = new Map();
    const root = {
      addEventListener: (t, f) => listeners.set(t, f),
      removeEventListener: (t, f) => { if (listeners.get(t) === f) listeners.delete(t); },
      querySelectorAll: () => [],
    };
    const detach = mod.attach(root);
    assert.equal(typeof detach, "function");
    detach();
    assert.equal(listeners.size, 0, `${d}: listeners left after detach`);
  }
});

test("components/INDEX.md lists every component", () => {
  const index = readFileSync(join(COMPONENTS, "INDEX.md"), "utf8");
  for (const d of dirs()) assert.match(index, new RegExp(`components/${d}/spec\\.md`));
});
