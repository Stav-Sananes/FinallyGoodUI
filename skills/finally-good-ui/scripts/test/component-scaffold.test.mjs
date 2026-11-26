import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp, SR } from "./_h.mjs";
import { planScaffold } from "../lib/scaffold.mjs";
import { loadSpec } from "../lib/component-spec.mjs";
import { detectStack } from "../detect-stack.mjs";

const PROJECTS = ["react-radix", "vue-reka", "svelte-bits", "angular-cdk", "plain"];
const copy = (name) => { const d = tmp(); cpSync(fx(`components/projects/${name}`), d, { recursive: true }); return d; };
const scaffold = (root, ...extra) => run("scaffold-component.mjs", ["--name", "button", "--root", root, ...extra]);
const dirOf = (root) => join(root, "src/components/fgu/button");
const read = (root, f) => readFileSync(join(dirOf(root), f), "utf8");
const names = (root) => readdirSync(dirOf(root)).sort();

test("react project with radix: primitives:radix, no behaviour.js", () => {
  const root = copy("react-radix");
  const r = scaffold(root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.tool, "scaffold-component");
  assert.equal(r.json.source, "primitives:radix");
  assert.deepEqual(names(root), [".fgu-component.json", "button.css", "button.tsx"]);
  const tsx = read(root, "button.tsx");
  assert.match(tsx, /Primitive\.button/);
  assert.match(tsx, /data-part="root"/);
  assert.match(tsx, /aria-busy=\{loading \? "true" : undefined\}/);
  assert.doesNotMatch(tsx, /attach/);
  const guard = /onClickCapture=\{\(e\) => \{ if \(loading\) \{ e\.preventDefault\(\); e\.stopPropagation\(\)/;
  assert.match(tsx, guard);
});

test("plain project: shared source, behaviour.js is a copy of the reference", () => {
  const root = copy("plain");
  const r = scaffold(root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.source, "shared");
  assert.ok(r.json.notes.length > 0);
  assert.deepEqual(names(root), [".fgu-component.json", "button.behaviour.js", "button.css", "button.html"]);
  assert.equal(read(root, "button.behaviour.js"), readFileSync(join(SR, "components/button/button.js"), "utf8"));
  assert.match(read(root, "button.html"), /attach\(/);
});

test("each framework emits its own file extension", () => {
  const want = {
    "vue-reka": ["button.vue"],
    "svelte-bits": ["button.svelte"],
    "angular-cdk": ["button.component.html", "button.component.ts"],
  };
  for (const [name, files] of Object.entries(want)) {
    const root = copy(name);
    const r = scaffold(root);
    assert.equal(r.code, 0, `${name}: ${r.stderr}`);
    for (const f of files) assert.ok(existsSync(join(dirOf(root), f)), `${name} missing ${f}`);
  }
});

test("vue and svelte wire the primitive; angular uses the shared behaviour", () => {
  const vue = copy("vue-reka");
  assert.equal(scaffold(vue).json.source, "primitives:reka");
  assert.match(read(vue, "button.vue"), /<Primitive as="button"/);
  assert.match(read(vue, "button.vue"), /@click\.capture="\(e: Event\) => \{ if \(loading\) \{ e\.preventDefault\(\)/);
  assert.ok(!existsSync(join(dirOf(vue), "button.behaviour.js")));
  const sv = copy("svelte-bits");
  assert.equal(scaffold(sv).json.source, "primitives:bits");
  assert.match(read(sv, "button.svelte"), /<Button\.Root/);
  assert.match(read(sv, "button.svelte"), /onclickcapture=\{\(e\) => \{ if \(loading\) \{ e\.preventDefault\(\)/);
  const ng = copy("angular-cdk");
  const ngRun = scaffold(ng);
  assert.equal(ngRun.json.source, "shared");
  assert.ok(ngRun.json.notes.some((n) => /angular-cdk.*no wiring/.test(n)), ngRun.stdout);
  assert.match(read(ng, "button.component.ts"), /attach\(this\.host\.nativeElement\)/);
  assert.match(read(ng, "button.component.html"), /\[attr\.aria-busy\]/);
});

test("shared source in react calls attach from an effect", () => {
  const bare = copy("plain");
  const r2 = scaffold(bare, "--framework", "react");
  assert.equal(r2.json.source, "shared");
  const tsx = read(bare, "button.jsx");
  assert.match(tsx, /useEffect/);
  assert.match(tsx, /attach\(ref\.current\)/);
});

test(".fgu-component.json records name, source and framework", () => {
  const root = copy("react-radix");
  scaffold(root);
  assert.deepEqual(JSON.parse(read(root, ".fgu-component.json")), { name: "button", source: "primitives:radix", framework: "react" });
});

test("native frameworks exit 2 with a clear message", () => {
  for (const fw of ["expo", "react-native", "flutter", "swiftui", "compose"]) {
    const r = scaffold(copy("plain"), "--framework", fw);
    assert.equal(r.code, 2, fw);
    assert.match(r.stderr, /native/);
  }
});

test("missing component-style.json exits 2 naming the file", () => {
  const root = copy("plain");
  rmSync(join(root, ".design"), { recursive: true });
  const r = scaffold(root);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /\.design\/component-style\.json/);
});

test("invalid profile field exits 2 naming the field", () => {
  const root = copy("plain");
  writeFileSync(join(root, ".design/component-style.json"), JSON.stringify({ radius: "square", material: "flat", density: "airy", motif: "x", motion: "balanced" }));
  const r = scaffold(root);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /radius/);
});

test("unknown component exits 2", () => {
  const r = run("scaffold-component.mjs", ["--name", "nope", "--root", copy("plain")]);
  assert.equal(r.code, 2);
});

test("existing target is skipped; --force replaces it", () => {
  const root = copy("react-radix");
  scaffold(root);
  const css = join(dirOf(root), "button.css");
  writeFileSync(css, "/* mine */");
  const second = scaffold(root);
  assert.equal(second.json.files.find((f) => f.path.endsWith("button.css")).skipped, "exists");
  assert.equal(readFileSync(css, "utf8"), "/* mine */");
  const forced = scaffold(root, "--force");
  assert.ok(forced.json.files.every((f) => !f.skipped));
  assert.notEqual(readFileSync(css, "utf8"), "/* mine */");
});

test("--dry-run writes nothing", () => {
  const root = copy("react-radix");
  const r = scaffold(root, "--dry-run");
  assert.equal(r.code, 0);
  assert.ok(r.json.files.length >= 3);
  assert.ok(!existsSync(join(root, "src")));
});

test("shadcn components.json alias sets the components dir", () => {
  const root = copy("react-radix");
  writeFileSync(join(root, "components.json"), JSON.stringify({ style: "new-york", aliases: { components: "@/components" } }));
  mkdirSync(join(root, "src"));
  const r = scaffold(root);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(r.json.files.every((f) => f.path.startsWith("src/components/fgu/button/")));
  const root2 = copy("react-radix");
  writeFileSync(join(root2, "components.json"), JSON.stringify({ aliases: { components: "@/app/ui" } }));
  assert.ok(scaffold(root2, "--dry-run").json.files.every((f) => f.path.startsWith("app/ui/fgu/button/")));
});

test("output is byte-identical on a second run", () => {
  for (const name of PROJECTS) {
    const a = copy(name), b = copy(name);
    const ra = scaffold(a), rb = scaffold(b);
    assert.equal(ra.stdout, rb.stdout);
    assert.ok(names(a).length >= 3);
    assert.deepEqual(names(a), names(b));
    for (const f of names(a)) assert.equal(read(a, f), read(b, f), `${name}/${f}`);
    // re-run on the same tree with --force: unchanged bytes
    const before = names(a).map((f) => read(a, f));
    scaffold(a, "--force");
    assert.deepEqual(names(a).map((f) => read(a, f)), before);
  }
});

const project = (deps) => { const d = tmp(); writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps })); mkdirSync(join(d, ".design")); cpSync(fx("components/projects/plain/.design"), join(d, ".design"), { recursive: true }); return d; };
const plan = (deps) => {
  const root = project(deps);
  return planScaffold({ spec: loadSpec(join(SR, "components/button")), stack: detectStack(root), profile: JSON.parse(readFileSync(join(root, ".design/component-style.json"), "utf8")), root, force: false });
};
const importLine = (p, ext) => p.files.find((f) => f.path.endsWith(ext)).content.split("\n").find((l) => /^import .* from "(?!\.|react"|vue")/.test(l));

test("primitive import specifiers come from the package the project has", () => {
  assert.match(importLine(plan({ react: "18", "@radix-ui/react-primitive": "2" }), ".jsx"), /from "@radix-ui\/react-primitive"/);
  assert.match(importLine(plan({ react: "18", "@base-ui-components/react": "1" }), ".jsx"), /@base-ui-components\/react\/button/);
  assert.match(importLine(plan({ react: "18", "@base-ui/react": "1" }), ".jsx"), /"@base-ui\/react\/button"/);
  assert.match(importLine(plan({ vue: "3", "radix-vue": "1" }), ".vue"), /from "radix-vue"/);
  assert.match(importLine(plan({ vue: "3", "reka-ui": "2" }), ".vue"), /from "reka-ui"/);
});

test("radix project without a package to import Primitive from falls back to shared with a note", () => {
  const p = plan({ react: "18", "@radix-ui/react-slot": "1" });
  assert.equal(p.source, "shared");
  assert.ok(p.notes.some((n) => /no package to import/.test(n)));
  assert.ok(p.files.some((f) => f.path.endsWith("button.behaviour.js")));
  assert.equal(plan({ react: "18", "@radix-ui/react-primitive": "2" }).source, "primitives:radix"); // control
});

test("primitive with no wiring for this component falls back to shared with a note", () => {
  const kob = plan({ react: "18", "@kobalte/core": "1" });
  assert.equal(kob.source, "shared");
  assert.ok(kob.notes.some((n) => /kobalte.*no wiring/.test(n)));
  const mismatch = plan({ vue: "3", "@radix-ui/react-primitive": "2" }); // radix has no Vue wiring
  assert.equal(mismatch.source, "shared");
  assert.ok(mismatch.notes.some((n) => /radix.*no wiring for vue/.test(n)));
  assert.deepEqual(plan({ vue: "3", "reka-ui": "2" }).notes, []); // control: wired, no note
});

test("astro, solid, html and unknown give plain output with a note and exit 0", () => {
  for (const fw of ["astro", "solid", "html", "unknown"]) {
    const root = copy("plain");
    const r = scaffold(root, "--framework", fw);
    assert.equal(r.code, 0, `${fw}: ${r.stderr}`);
    assert.equal(r.json.source, "shared");
    assert.ok(r.json.notes.some((n) => /plain HTML/.test(n)), fw);
    assert.ok(existsSync(join(dirOf(root), "button.html")), fw);
  }
  const control = scaffold(copy("plain"), "--framework", "react");
  assert.deepEqual(control.json.notes, []);
});

test("css is the reference rules followed by the profile layer", () => {
  const root = copy("plain");
  scaffold(root);
  const css = read(root, "button.css");
  const reference = readFileSync(join(SR, "components/button/button.css"), "utf8").trimEnd();
  assert.ok(css.startsWith(reference));
  const profileAt = css.indexOf("/* button: radius=soft");
  assert.ok(profileAt >= reference.length, "profile layer must come after the reference rules");
  assert.ok(css.indexOf("border-radius", profileAt) > profileAt);
});

test("plain demo renders every part of the button and a busy and a disabled variant", () => {
  const root = copy("plain");
  assert.equal(scaffold(root).code, 0);
  const html = read(root, "button.html");
  assert.match(html, /data-part="icon"/);
  assert.match(html, /data-part="spinner"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /<button[^>]* disabled/);
});

test("every framework template always renders the button spinner (the CSS toggles its opacity)", () => {
  const files = { "react-radix": "button.tsx", "vue-reka": "button.vue", "svelte-bits": "button.svelte", "angular-cdk": "button.component.html" };
  for (const [project, file] of Object.entries(files)) {
    const root = copy(project);
    assert.equal(scaffold(root).code, 0);
    const text = read(root, file);
    assert.match(text, /data-part="spinner"/, `${project}: spinner missing`);
    const line = text.split("\n").find((l) => l.includes('data-part="spinner"')) ?? "";
    assert.doesNotMatch(line, /\?|v-if|\{#if/, `${project}: spinner rendered conditionally: ${line}`);
    assert.doesNotMatch(text, /@if \(loading\)|\{#if loading\}|v-if="loading"/, `${project}: spinner guarded by loading`);
  }
});

test("adapter docs say the spinner is always rendered", () => {
  for (const f of ["react.md", "angular.md"]) {
    const text = readFileSync(join(SR, "components/adapters", f), "utf8");
    assert.doesNotMatch(text, /render conditionally|@if \(busy\)/, `${f} still claims a conditional spinner`);
  }
  assert.match(readFileSync(join(SR, "components/adapters/react.md"), "utf8"), /spinner.*always render/i);
});
