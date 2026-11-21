import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { run, SR } from "./_h.mjs";
import { loadSpec } from "../lib/component-spec.mjs";

const COMPONENTS = join(SR, "components");
const dirs = () => (existsSync(COMPONENTS) ? readdirSync(COMPONENTS).filter((d) => statSync(join(COMPONENTS, d)).isDirectory() && d !== "adapters") : []);
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

// Busy must not change layout: the spinner is always in flow-free (absolute) and only fades; no rule may toggle its display.
const spinnerLayoutProblems = (cssText) => {
  const src = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const problems = [];
  for (const [, sel, body] of src.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    if (!/data-part="spinner"/.test(sel)) continue;
    if (/\bdisplay\s*:/.test(body)) problems.push(`${sel.trim()}: sets display`);
  }
  const base = [...src.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].find(([, sel]) => sel.trim() === '[data-part="spinner"]');
  if (!base || !/position\s*:\s*absolute/.test(base[2])) problems.push("spinner base rule is not position:absolute");
  return problems;
};

test("loading keeps the button width: the spinner never toggles display", () => {
  assert.deepEqual(spinnerLayoutProblems(readFileSync(join(COMPONENTS, "button/button.css"), "utf8")), []);
});

test("the spinner layout check fails for a display toggle", () => {
  const bad = '[data-part="spinner"] { display: none; }\n[aria-busy="true"] [data-part="spinner"] { display: inline-block; }';
  assert.ok(spinnerLayoutProblems(bad).length >= 2);
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

// Adapters: one rule file per framework, all with the same five headings, short enough to load on demand.
const ADAPTER_HEADINGS = ["Props and events", "State attributes", "Slots and children", "Behaviour source", "Motion"];
const adapterProblems = (text) => {
  const problems = ADAPTER_HEADINGS.filter((h) => !new RegExp(`^#{2,3} ${h}\\s*$`, "m").test(text)).map((h) => `missing heading: ${h}`);
  const lines = text.replace(/\n$/, "").split("\n").length;
  if (lines > 80) problems.push(`${lines} lines (max 80)`);
  return problems;
};
const adapterFiles = () => {
  const root = join(COMPONENTS, "adapters");
  const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f)) : []);
  return [...list(root), ...list(join(root, "light"))];
};

test("every adapter has the five headings and is <= 80 lines", () => {
  const files = adapterFiles();
  assert.equal(files.length, 7, `found: ${files.join(",") || "none"}`);
  for (const f of files) assert.deepEqual(adapterProblems(readFileSync(f, "utf8")), [], f);
});

test("the adapter check fails for a missing heading or too many lines", () => {
  const full = ADAPTER_HEADINGS.map((h) => `## ${h}\ntext`).join("\n");
  assert.deepEqual(adapterProblems(full), []);
  assert.deepEqual(adapterProblems(full.replace("## Motion", "## Animation")), ["missing heading: Motion"]);
  assert.equal(adapterProblems(`${full}\n${"x\n".repeat(80)}`).length, 1);
});

test("components/INDEX.md points at the adapters folder", () => {
  assert.match(readFileSync(join(COMPONENTS, "INDEX.md"), "utf8"), /components\/adapters\//);
});

// Disclosure single-open: a fake DOM is enough, attach only uses these members.
const fakeDisclosure = () => {
  const mk = (id, open) => {
    const panel = { id, inert: !open };
    const attrs = { "aria-expanded": String(open), "aria-controls": id, "data-part": "trigger" };
    const t = {
      disabled: false, panel,
      getAttribute: (k) => attrs[k] ?? null, setAttribute: (k, v) => { attrs[k] = String(v); },
      closest: (sel) => (sel.includes("trigger") ? t : sel.includes("root") ? rootEl : null),
      ownerDocument: { getElementById: (i) => (i === id ? panel : null) },
    };
    return t;
  };
  const triggers = [mk("a", true), mk("b", false)];
  const handlers = {};
  const rootEl = {
    getAttribute: (k) => (k === "data-variant" ? variant.value : null),
    querySelectorAll: () => triggers,
    addEventListener: (t, f) => { handlers[t] = f; },
    removeEventListener: (t) => { delete handlers[t]; },
  };
  const variant = { value: "single" };
  return { triggers, rootEl, variant, click: (t) => handlers.click({ target: { closest: (sel) => (sel.includes("trigger") ? t : null) } }) };
};

test("disclosure attach: data-variant=single closes siblings, multiple keeps them open", async () => {
  const { attach } = await import(join(COMPONENTS, "disclosure/disclosure.js"));
  for (const [variant, aOpen] of [["single", "false"], ["multiple", "true"]]) {
    const d = fakeDisclosure();
    d.variant.value = variant;
    attach(d.rootEl);
    assert.equal(d.triggers[0].panel.inert, false, "initial sync: open panel is not inert");
    assert.equal(d.triggers[1].panel.inert, true, "initial sync: closed panel is inert");
    d.click(d.triggers[1]);
    assert.equal(d.triggers[1].getAttribute("aria-expanded"), "true");
    assert.equal(d.triggers[0].getAttribute("aria-expanded"), aOpen, variant);
  }
});
