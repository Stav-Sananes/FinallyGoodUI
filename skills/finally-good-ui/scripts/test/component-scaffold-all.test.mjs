import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmp, SR } from "./_h.mjs";
import { planScaffold, COMPONENTS_ROOT } from "../lib/scaffold.mjs";
import { loadSpec } from "../lib/component-spec.mjs";
import { viewOf } from "../lib/scaffold-render.mjs";
import { MARKUP, el, partsOf } from "../lib/scaffold-markup.mjs";
import { checkComponents } from "../check-components.mjs";

// Every component, scaffolded for every framework, must come out as a working component: all spec parts
// with their tags and roles, every declared slot rendered, props bound, behaviour attached from the lifecycle.
const NAMES = readdirSync(COMPONENTS_ROOT).filter((d) => d !== "adapters" && !d.endsWith(".md")).sort();
const FRAMEWORKS = ["react", "vue", "svelte", "angular", "html"];
const PROFILE = { radius: "soft", material: "layered", density: "balanced", motion: "balanced", motif: "test" };
const spec = (name) => loadSpec(join(COMPONENTS_ROOT, name));
const plan = (name, framework, extra = {}) => planScaffold({ spec: spec(name), stack: { framework, typescript: true, primitives: [], ...extra }, profile: PROFILE, root: join(tmp(), "none") });
const everything = (p) => p.files.filter((f) => !/\.(css|json|d\.ts)$/.test(f.path)).map((f) => f.content).join("\n");
const code = (p) => p.files.filter((f) => /\.(tsx|jsx|vue|svelte|html)$/.test(f.path)).map((f) => f.content).join("\n");

const SLOT_RENDER = {
  react: (s) => new RegExp(`\\{${s === "default" ? "children" : s}\\??[}.(]`),
  vue: (s) => new RegExp(s === "default" ? "<slot />" : `<slot name="${s}"`),
  svelte: (s) => new RegExp(`\\{@render ${s === "default" ? "children" : s}\\?\\.\\(`),
  angular: (s) => (s === "default" ? /<ng-content \/>/ : /ngTemplateOutlet|ng-content select/),
};

test("the suite covers all eight components and five outputs", () => {
  assert.deepEqual(NAMES, ["button", "dialog", "disclosure", "field", "menu", "tabs", "toast", "toggle"]);
  assert.equal(FRAMEWORKS.length, 5);
});

for (const name of NAMES) for (const framework of FRAMEWORKS) {
  test(`${name} in ${framework}: renders every spec part, its tag, the root attribute and the role`, () => {
    const s = spec(name);
    const text = code(plan(name, framework));
    assert.ok(text.length > 400, "positive control: a real file");
    for (const part of s.parts) assert.match(text, new RegExp(`data-part="${part}"`), `part ${part}`);
    assert.match(text, new RegExp(`data-fgu="${name}"[\\s\\S]*data-part="root"|data-part="root"[\\s\\S]*data-fgu="${name}"`), "root carries data-fgu");
    for (const [part, tag] of Object.entries(s.tags ?? {})) {
      assert.match(text, new RegExp(`<${tag}\\b[^>]*data-part="${part}"`), `part ${part} is a <${tag}>`);
    }
    // textbox, checkbox, button and dialog come from the native element (checked through the tags above); the rest is an explicit role
    if (!["button", "link", "textbox", "checkbox", "dialog"].includes(s.a11y.role)) assert.match(text, new RegExp(`role="${s.a11y.role}"`));
  });

  test(`${name} in ${framework}: is not an empty skeleton (slots rendered, behaviour attached, props bound)`, () => {
    const s = spec(name);
    const p = plan(name, framework);
    const text = code(p);
    if (framework !== "html") for (const slot of s.slots) assert.match(text, SLOT_RENDER[framework](slot), `slot ${slot}`);
    assert.match(everything(p), /attach\(/, "attach is called");
    assert.ok(p.files.some((f) => f.path.endsWith(`${name}.behaviour.js`)), "the shared behaviour is written next to it");
    assert.ok(p.files.some((f) => f.path.endsWith(`${name}.behaviour.d.ts`)), "typings for a TypeScript project");
    if (framework === "html") return;
    const lifecycle = { react: /useEffect\(\(\) => \(ref\.current \? attach\(ref\.current\)/, vue: /onMounted\([\s\S]*attach\(el\.value\)/, svelte: /use:behaviour/, angular: /ngAfterViewInit\(\)[\s\S]*attach\(this\.host\.nativeElement\)/ }[framework];
    assert.match(everything(p), lifecycle);
    assert.doesNotMatch(text, /<span data-part="[a-z]+"><\/span>\s*<span data-part="[a-z]+"><\/span>\s*<span data-part="[a-z]+"><\/span>/, "not a row of empty spans");
    for (const prop of s.props) assert.match(everything(p), new RegExp(`\\b${prop.name}\\b`), `prop ${prop.name} is declared`);
  });

  test(`${name} in ${framework}: passes check-components as written to disk`, () => {
    const p = plan(name, framework);
    const root = tmp();
    for (const f of p.files) { mkdirSync(dirname(join(root, f.path)), { recursive: true }); writeFileSync(join(root, f.path), f.content); }
    assert.deepEqual(checkComponents(root).findings, []);
  });
}

test("JavaScript projects get no .d.ts; TypeScript projects get one with attach and the spec's API", () => {
  const js = planScaffold({ spec: spec("dialog"), stack: { framework: "react", typescript: false, primitives: [] }, profile: PROFILE, root: join(tmp(), "none") });
  assert.ok(!js.files.some((f) => f.path.endsWith(".d.ts")));
  const dts = plan("dialog", "react").files.find((f) => f.path.endsWith(".d.ts")).content;
  assert.match(dts, /export declare function attach\(root: Element\): \(\) => void;/);
  assert.match(dts, /export declare function openDialog\(/);
  assert.match(dts, /export declare function closeDialog\(/);
});

test("components with a programmatic API wire it into the framework lifecycle", () => {
  assert.match(code(plan("dialog", "react")), /openDialog\(dialog\)/);
  assert.match(code(plan("dialog", "vue")), /watch\(\(\) => props\.open/);
  assert.match(code(plan("dialog", "svelte")), /use:behaviour=\{open\}/);
  const ng = plan("dialog", "angular").files.map((f) => f.content).join("\n");
  assert.match(ng, /ngOnChanges\(\)/);
  assert.match(ng, /@Output\(\) closed/);
});

test("toast hands the leaving id to the owner of the list instead of letting the node vanish", () => {
  for (const fw of ["react", "vue", "svelte", "angular"]) {
    const text = plan("toast", fw).files.map((f) => f.content).join("\n");
    assert.match(text, /preventDefault\(\)/, fw);
    assert.match(text, /dataset(\.id|\["id"\])/, fw);
  }
});

test("a markup tree that skips a spec part, or renders one the spec lacks, is refused", () => {
  const s = spec("button");
  const without = { tree: el("root", {}, [el("label", {}, [])]) };
  assert.throws(() => viewOf(s, without), /does not render spec part\(s\): icon, spinner|spinner/);
  assert.throws(() => viewOf(s, { tree: el("root", {}, [...MARKUP.button.tree.kids, el("extra")]) }), /extra/);
  assert.ok(viewOf(s, MARKUP.button), "positive control: the real tree is accepted");
  assert.deepEqual([...partsOf(MARKUP.button.tree)].sort(), [...s.parts].sort());
});

test("markup exists for exactly the components that have a spec", () => {
  assert.deepEqual(Object.keys(MARKUP).sort(), NAMES);
});

test("a primitive is wired for the button only; every other component keeps the shared behaviour and says so", () => {
  const stack = { framework: "react", typescript: true, primitives: ["radix"] };
  const withPrim = (name) => planScaffold({ spec: spec(name), stack, profile: PROFILE, root: (() => { const r = tmp(); writeFileSync(join(r, "package.json"), JSON.stringify({ dependencies: { "@radix-ui/react-primitive": "2" } })); return r; })() });
  assert.equal(withPrim("button").source, "primitives:radix");
  const dialog = withPrim("dialog");
  assert.equal(dialog.source, "shared");
  assert.ok(dialog.notes.some((n) => /button only/.test(n)));
  assert.ok(dialog.files.some((f) => f.path.endsWith("dialog.behaviour.js")));
});
