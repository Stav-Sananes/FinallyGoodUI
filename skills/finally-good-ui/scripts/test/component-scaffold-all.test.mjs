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
  assert.match(ng, /@Output\(\) openChange/);
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

// ---- round 5: what real compilers and browsers found
const joined = (name, fw, extra) => plan(name, fw, extra).files.filter((f) => !/\.(css|json|d\.ts)$|behaviour\.js$/.test(f.path)).map((f) => f.content).join("\n");
import { readFileSync } from "node:fs";
import { profileCss } from "../lib/style-profile.mjs";

test("TypeScript output: button type is the native union, no null role, no unused ReactNode import", () => {
  assert.match(joined("button", "react"), /type\?: "button" \| "submit" \| "reset";/);
  assert.match(joined("button", "vue"), /type\?: "button" \| "submit" \| "reset"/);
  assert.match(joined("button", "svelte"), /type\?: "button" \| "submit" \| "reset"/);
  for (const fw of ["react", "vue", "svelte", "angular"]) assert.doesNotMatch(joined("toggle", fw), /'switch' : null/, fw);
  assert.doesNotMatch(joined("field", "react"), /ReactNode/, "field has no slots: nothing to import");
  assert.match(joined("button", "react"), /ReactNode/, "positive control: button has slots");
});

test("React spells popoverTarget (React 19) and only React", () => {
  assert.match(joined("menu", "react"), /popoverTarget:/);
  assert.doesNotMatch(joined("menu", "react"), /popovertarget/);
  for (const fw of ["vue", "svelte", "angular"]) assert.match(joined("menu", fw), /popovertarget/, fw);
});

test("a JavaScript Svelte project gets no lang=ts and no type annotations", () => {
  for (const name of NAMES) {
    const text = joined(name, "svelte", { typescript: false });
    assert.doesNotMatch(text, /lang="ts"/, name);
    assert.doesNotMatch(text, /: (HTMLElement|Event|boolean|number \| undefined)\b|Snippet|\bas HTMLElement/, name);
  }
  assert.match(joined("button", "svelte"), /lang="ts"/, "positive control: a TypeScript project still gets it");
});

test("Vue field and toggle support v-model; the attrs still reach the control", () => {
  const field = joined("field", "vue");
  assert.match(field, /modelValue\?: string/);
  assert.match(field, /"update:modelValue": \[value: string\]/);
  assert.match(field, /:value="modelValue"/);
  assert.match(field, /defineOptions\(\{ inheritAttrs: false \}\)/);
  const toggle = joined("toggle", "vue");
  assert.match(toggle, /modelValue\?: boolean/);
  assert.match(toggle, /:checked="modelValue \?\? checked"/);
  assert.doesNotMatch(toggle, /:checked="checked"/, "one checked binding");
});

test("Svelte binds value and checked, open and selected", () => {
  assert.match(joined("field", "svelte"), /value = \$bindable\(\)/);
  assert.match(joined("toggle", "svelte"), /checked = \$bindable\(false\)/);
  assert.match(joined("dialog", "svelte"), /open = \$bindable\(false\)/);
  assert.match(joined("dialog", "svelte"), /open = false;/);
  assert.match(joined("tabs", "svelte"), /selected = \$bindable\(\)/);
  assert.match(joined("tabs", "svelte"), /selected = event\.detail|selected = \(event as CustomEvent<number>\)\.detail/);
});

test("tabs take a controlled selected and say when it changes; dialog open follows close", () => {
  assert.match(joined("tabs", "react"), /selectTab\(ref\.current, selected\)/);
  assert.match(joined("tabs", "react"), /onSelectedChange/);
  assert.match(joined("tabs", "vue"), /"update:selected": \[value: number\]/);
  assert.match(joined("tabs", "vue"), /change: \[value: number\]/);
  assert.match(joined("tabs", "angular"), /@Output\(\) selectedChange/);
  assert.match(joined("dialog", "react"), /onOpenChange\?\.\(false\)/);
  assert.match(joined("dialog", "vue"), /emit\("update:open", false\)/);
  assert.match(joined("dialog", "angular"), /@Output\(\) openChange/);
});

test("field is multiline-capable in every framework: a textarea sibling with rows", () => {
  for (const fw of ["react", "vue", "svelte", "angular", "html"]) {
    const text = joined("field", fw);
    assert.match(text, /<textarea\b/, fw);
    if (fw !== "html") assert.match(text, /rows/, fw);
  }
  assert.doesNotMatch(joined("field", "svelte"), /<textarea[^>]*\/>/, "Svelte refuses a self-closing textarea");
});

test("Angular strict-template details: transforms, readonly arrays, controlId, value output, error inline", () => {
  const ng = joined("field", "angular");
  assert.match(ng, /@Input\(\{ transform: booleanAttribute \}\) required/);
  assert.match(ng, /@Input\(\{ alias: "controlId" \}\) controlId|@Input\(\{ alias: "controlId"/);
  assert.match(ng, /@Output\(\) valueChange/);
  assert.match(ng, /<p\s+data-part="error"[\s\S]*?>\{\{ error \}\}<\/p>/, "no whitespace around the message");
  assert.match(joined("menu", "angular"), /readonly \{ label/);
  assert.match(joined("toggle", "angular"), /@Output\(\) checkedChange/);
  assert.match(joined("tabs", "angular"), /\| null = null;/);
});

test("dialog: body and actions sit in a method=dialog form; an initial-focus prop reaches the root", () => {
  for (const fw of ["react", "vue", "svelte", "angular", "html"]) assert.match(joined("dialog", fw), /<form[^>]*method="dialog"|<form\s+(?:data-part="form"\s+)?method="dialog"|method="dialog"/, fw);
  for (const fw of ["react", "vue", "svelte", "angular"]) assert.match(joined("dialog", fw), /data-initial-focus/, fw);
});

test("component css: spinner spins only while busy, toggle controls are 24px, disabled buttons keep their text, toast offset hook", () => {
  const css = (n) => readFileSync(join(COMPONENTS_ROOT, n, `${n}.css`), "utf8");
  const spinnerBase = css("button").match(/\[data-part="spinner"\] \{[^}]*\}/)[0];
  assert.doesNotMatch(spinnerBase, /animation/, "the idle spinner has no animation");
  assert.match(css("button"), /aria-busy="true"\] \[data-part="spinner"\] \{ opacity: 1; animation: btn-spin/);
  assert.match(css("button"), /:disabled \{[^}]*--btn-fg: var\(--color-muted-foreground\)/);
  assert.doesNotMatch(css("button").match(/:disabled \{[^}]*\}/)[0], /opacity/);
  assert.match(css("toggle"), /inline-size: var\(--icon-lg\)/);
  assert.doesNotMatch(css("toggle"), /--icon-md/);
  assert.match(css("toast"), /var\(--toast-offset, var\(--space-4\)\)/);
});

test("profile: a coarse-pointer block raises dense and balanced controls to 44px; the menu trigger takes the radius", () => {
  const dense = profileCss({ ...PROFILE, density: "dense" }, spec("button"));
  assert.match(dense, /@media \(pointer: coarse\) \{\s*\[data-fgu="button"\]\[data-part="root"\] \{\s*min-height: var\(--size-control-lg\)/);
  assert.doesNotMatch(profileCss({ ...PROFILE, density: "airy" }, spec("button")), /pointer: coarse/, "airy is already 44px");
  const menu = profileCss(PROFILE, spec("menu"));
  assert.match(menu, /\[data-fgu="menu"\] \[data-part="trigger"\] \{\s*border-radius: var\(--radius-/);
});

// ---- round 6
test("dialog form is novalidate unless nativeValidation is set; the field has hideLabel; toast actions get the id", () => {
  assert.match(joined("dialog", "react"), /noValidate=\{!nativeValidation\}/);
  assert.match(joined("dialog", "vue"), /:novalidate="!nativeValidation"/);
  assert.match(joined("dialog", "svelte"), /novalidate=\{!nativeValidation\}/);
  assert.match(joined("dialog", "angular"), /\[attr\.novalidate\]="!nativeValidation \? '' : null"/);
  for (const fw of ["react", "vue", "svelte", "angular"]) {
    assert.match(joined("field", fw), /hideLabel/, fw);
    assert.match(joined("toast", fw), /t\.onAction && t\.onAction\(t\.id\)/, fw);
    assert.doesNotMatch(joined("toast", fw), /onAction\(t\)/, fw);
  }
  assert.match(readFileSync(join(COMPONENTS_ROOT, "field/field.css"), "utf8"), /\[data-part="label"\]\[data-hidden\]/);
  assert.match(readFileSync(join(COMPONENTS_ROOT, "toast/toast.css"), "utf8"), /--toast-offset-inline[\s\S]*--toast-offset-block/);
});

test("no generated TypeScript reads an index signature with dot access (noPropertyAccessFromIndexSignature)", () => {
  for (const name of NAMES) for (const fw of ["react", "vue", "svelte", "angular"]) {
    const text = joined(name, fw);
    assert.doesNotMatch(text, /\.dataset\.\w|\$slots\.\w/, `${name}/${fw}`);
  }
});

test("toast: an optional store file per framework (provider and hook, composable, store, service), not for plain HTML", () => {
  const file = (fw, ext) => plan("toast", fw).files.find((f) => f.path.includes("toast-store"));
  assert.match(file("react").path, /toast-store\.tsx$/);
  assert.match(file("react").content, /export function ToastProvider/);
  assert.match(file("react").content, /export function useToast/);
  assert.match(file("vue").content, /export function useToast/);
  assert.match(file("svelte").content, /export const toasts = writable/);
  assert.match(file("angular").path, /toast-store\.service\.ts$/);
  assert.match(file("angular").content, /@Injectable/);
  assert.equal(file("html"), undefined);
  assert.equal(plan("button", "react").files.find((f) => f.path.includes("toast-store")), undefined, "only the toast has one");
  const js = planScaffold({ spec: spec("toast"), stack: { framework: "react", typescript: false, primitives: [] }, profile: PROFILE, root: join(tmp(), "none") }).files.find((f) => f.path.includes("toast-store"));
  assert.match(js.path, /\.jsx$/);
  assert.doesNotMatch(js.content, /ToastItem|: ReactNode|useState<|<ToastApi/);
});

test("toggle: React `checked` controls the input only when given; Vue also emits update:checked", () => {
  const react = joined("toggle", "react");
  assert.match(react, /\.\.\.\(checked === undefined \? \{\} : \{ checked \}\)/);
  assert.doesNotMatch(react, /checked = false/);
  assert.doesNotMatch(react, /defaultChecked=/, "uncontrolled use goes through rest (defaultChecked)");
  assert.match(joined("toggle", "vue"), /"update:checked": \[value: boolean\]/);
});

test("profile: every component's controls reach 44px under a coarse pointer (dense and balanced), parts without a density rule through `touch`", () => {
  const coarse = (n, density) => profileCss({ ...PROFILE, density }, spec(n)).match(/@media \(pointer: coarse\) \{[\s\S]*?\n\}/g)?.join("\n") ?? "";
  for (const n of ["button", "field", "disclosure", "menu", "tabs"]) assert.match(coarse(n, "dense"), /min-height: var\(--size-control-lg\)/, n);
  assert.match(coarse("toggle", "dense"), /\[data-part="root"\][\s\S]*min-width: var\(--size-control-lg\)/);
  assert.match(coarse("dialog", "dense"), /\[data-part="close"\]/);
  assert.match(coarse("toast", "dense"), /\[data-part="action"\][\s\S]*\[data-part="dismiss"\]/);
  assert.equal(coarse("button", "airy"), "", "airy is already 44px");
});

test("profile: the menu trigger takes the surface (border, shadow, radius) from the profile like the list", () => {
  const css = profileCss({ ...PROFILE, material: "outlined" }, spec("menu"));
  const trigger = css.match(/\[data-fgu="menu"\] \[data-part="trigger"\] \{[^}]*\}/)[0];
  assert.match(trigger, /border-style: solid/);
  assert.match(trigger, /border-radius: var\(--radius-/);
  assert.match(trigger, /border-width: var\(--border-width-/);
});
