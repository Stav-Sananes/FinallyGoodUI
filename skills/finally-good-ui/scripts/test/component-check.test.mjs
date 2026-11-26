import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp } from "./_h.mjs";

const check = (root, ...extra) => run("check-components.mjs", ["--root", root, ...extra]);
const fixture = (name) => fx(`components/check/${name}`);
const only = (name) => { const r = check(fixture(name)); assert.equal(r.code, 0, r.stderr); return r.json; };
const copy = (dir) => { const d = tmp(); cpSync(dir, d, { recursive: true }); return d; };

test("generated-ok produces ok:true with no findings", () => {
  const out = only("generated-ok");
  assert.equal(out.tool, "check-components");
  assert.equal(out.ok, true);
  assert.deepEqual(out.findings, []);
});

const BAD = [
  ["generated-bad-role", "role-missing", /button/],
  ["generated-bad-aria", "aria-missing", /aria-busy/],
  ["generated-bad-part", "part-missing", /spinner/],
  ["generated-bad-state", "state-unstyled", /aria-busy/],
  ["generated-bad-literal", "literal", /#fff|4px|200ms/],
  ["generated-bad-key", "key-handler-reimplemented", /Enter/],
];
for (const [name, rule, names] of BAD) {
  test(`${name}: reports ${rule} naming the culprit`, () => {
    const out = only(name);
    assert.equal(out.ok, false);
    const hits = out.findings.filter((f) => f.rule === rule);
    assert.ok(hits.length > 0, JSON.stringify(out.findings));
    assert.ok(hits.every((f) => names.test(f.message) && f.file), JSON.stringify(hits));
    assert.deepEqual(out.findings.filter((f) => f.rule !== rule), [], "only the planted rule fires");
  });
}

test("literal finding names px and ms literals too", () => {
  const msgs = only("generated-bad-literal").findings.map((f) => f.message).join("\n");
  assert.match(msgs, /4px/);
  assert.match(msgs, /200ms/);
});

test("--strict exits 1 only when there are findings", () => {
  assert.equal(check(fixture("generated-bad-part"), "--strict").code, 1);
  assert.equal(check(fixture("generated-bad-part")).code, 0);
  assert.equal(check(fixture("generated-ok"), "--strict").code, 0);
});

test("no markers under --root: ok with no findings", () => {
  const out = check(tmp()).json;
  assert.equal(out.ok, true);
  assert.deepEqual(out.findings, []);
});

test("node_modules is skipped", () => {
  const root = tmp();
  cpSync(fixture("generated-bad-part"), join(root, "node_modules/pkg"), { recursive: true });
  assert.equal(check(root).json.ok, true);
});

test("shared source: behaviour.js may hold key handlers, the framework file may not", () => {
  const root = copy(fixture("generated-ok"));
  const dir = join(root, "src/components/fgu/button");
  writeFileSync(join(dir, ".fgu-component.json"), JSON.stringify({ name: "button", source: "shared", framework: "react" }));
  writeFileSync(join(dir, "button.behaviour.js"), 'el.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });\n');
  writeFileSync(join(dir, "button.tsx"), `${readFileSync(join(dir, "button.tsx"), "utf8")}\nuseEffect(() => attach(ref.current), []);\n`);
  assert.equal(check(root).json.ok, true);
  const tsx = readFileSync(join(dir, "button.tsx"), "utf8");
  writeFileSync(join(dir, "button.tsx"), tsx.replace("data-part=\"root\"", 'data-part="root" onKeyDown={(e) => e.key === " " && go()}'));
  const hits = check(root).json.findings;
  assert.deepEqual(hits.map((f) => f.rule), ["key-handler-reimplemented"]);
  assert.match(hits[0].message, /Space/);
});

const withTsx = (extra) => {
  const root = copy(fixture("generated-ok"));
  const file = join(root, "src/components/fgu/button/button.tsx");
  writeFileSync(file, readFileSync(file, "utf8") + `\n${extra}\n`);
  return root;
};
const keyHits = (root) => check(root).json.findings.filter((f) => f.rule === "key-handler-reimplemented");

test("key handlers are recognised in every framework syntax, with modifiers", () => {
  const syntaxes = [
    ['@keydown="(e) => e.key === \'Enter\' && go()"', /Enter/],
    ['@keydown.enter="go"', /Enter/],
    ['@keyup.space.prevent="go"', /Space/],
    ['on:keydown={(e) => e.key === "Enter" && go()}', /Enter/],
    ['(keydown)="go($event.key === \'Enter\')"', /Enter/],
    ['(keydown.enter)="go()"', /Enter/],
    ['(keydown.space)="go()"', /Space/],
    ['onKeyDownCapture={(e) => e.key === "Enter" && go()}', /Enter/],
    ['onKeyDown={(e) => e.key === "Enter"}', /Enter/],
    ['x.addEventListener("keydown", (e) => e.key === "Enter")', /Enter/],
  ];
  for (const [s, key] of syntaxes) {
    const hits = keyHits(withTsx(s));
    assert.ok(hits.some((f) => key.test(f.message)), `${s}: ${JSON.stringify(hits)}`);
  }
});

test("click handlers and the busy click guard are not key handlers", () => {
  const clicks = [
    'onClick={() => go("Enter")}',
    'onClickCapture={(e) => { if (loading) { e.preventDefault(); e.stopPropagation(); } }}',
    '@click.capture="(e) => { if (loading) e.preventDefault(); }" data-note="Enter"',
    '(click)="go()" data-note="Space"',
  ];
  for (const s of clicks) assert.deepEqual(keyHits(withTsx(s)), [], s);
});

test("a key listener for a key the spec does not list is fine", () => {
  assert.deepEqual(keyHits(withTsx('@keydown.tab="go"')), []);
});

test("a marker source other than shared or primitives skips the key rule", () => {
  const root = withTsx('onKeyDown={(e) => e.key === "Enter" && go()}');
  const marker = join(root, "src/components/fgu/button/.fgu-component.json");
  writeFileSync(marker, JSON.stringify({ name: "button", source: "hand-owned", framework: "react" }));
  assert.deepEqual(keyHits(root), []);
});

test("spec-missing: a marker naming an unknown component is reported", () => {
  const root = copy(fixture("generated-ok"));
  const marker = join(root, "src/components/fgu/button/.fgu-component.json");
  writeFileSync(marker, JSON.stringify({ name: "nonesuch", source: "shared", framework: "react" }));
  const out = check(root).json;
  assert.equal(out.ok, false);
  assert.deepEqual(out.findings.map((f) => f.rule), ["spec-missing"]);
  assert.match(out.findings[0].message, /nonesuch/);
});

// The plain-html demo carve-out: root only, no state aria. Applies to <name>.html output and nothing else.
const DEMO = '<!doctype html>\n<button data-part="root" type="button"><span data-part="label">button</span></button>\n<script type="module">import { attach } from "./button.behaviour.js"; attach(document.body);</script>\n';
const demoRoot = (html) => {
  const root = copy(fixture("generated-ok"));
  const dir = join(root, "src/components/fgu/button");
  writeFileSync(join(dir, ".fgu-component.json"), JSON.stringify({ name: "button", source: "shared", framework: "unknown" }));
  writeFileSync(join(dir, "button.html"), html);
  writeFileSync(join(dir, "button.tsx"), "");
  return { root, dir };
};
const dropFramework = (dir) => unlinkSync(join(dir, "button.tsx"));

test("demo carve-out: a plain button.html with only root passes and says so in notes", () => {
  const { root, dir } = demoRoot(DEMO);
  dropFramework(dir);
  const out = check(root).json;
  assert.deepEqual(out.findings, []);
  assert.ok(out.notes.some((n) => /demo page/.test(n.note) && /button\.html$/.test(n.file)), JSON.stringify(out.notes));
});

test("demo carve-out: a demo page missing root still fails naming root", () => {
  const { root, dir } = demoRoot('<!doctype html>\n<button type="button"><span data-part="label">button</span></button>\n');
  dropFramework(dir);
  const hits = check(root).json.findings.filter((f) => f.rule === "part-missing");
  assert.equal(hits.length, 1);
  assert.match(hits[0].message, /root/);
});

test("demo carve-out: does not apply when a framework file is present", () => {
  const { root } = demoRoot(DEMO); // button.tsx is empty, button.html is root-only
  const rules = check(root).json.findings.map((f) => f.rule);
  assert.ok(rules.includes("part-missing"), rules.join());
});

test("demo carve-out: a non-plain framework file missing a part still fails", () => {
  const root = copy(fixture("generated-bad-part"));
  const out = check(root).json;
  assert.ok(out.findings.some((f) => f.rule === "part-missing" && /spinner/.test(f.message)));
  assert.deepEqual(out.notes, []);
});

// Positive control: whatever the real scaffold writes must satisfy the checker.
for (const project of ["plain", "react-radix", "vue-reka", "svelte-bits", "angular-cdk"]) {
  test(`real scaffold output for ${project} passes the checker`, () => {
    const root = copy(fx(`components/projects/${project}`));
    const s = run("scaffold-component.mjs", ["--name", "button", "--root", root]);
    assert.equal(s.code, 0, s.stderr);
    const out = check(root).json;
    assert.deepEqual(out.findings, []);
    assert.equal(out.ok, true);
  });
}

// ---- empty skeletons: the parts are there, nothing works
const SKELETON_TSX = `import "./dialog.css";

export function Dialog() {
  return (
    <dialog data-fgu="dialog" data-part="root">
      <h2 data-part="title"></h2>
      <p data-part="description"></p>
      <button data-part="close" type="button"></button>
      <div data-part="actions"></div>
    </dialog>
  );
}
`;
const dialogRoot = (tsx, source = "shared") => {
  const root = tmp();
  const dir = join(root, "src/components/fgu/dialog");
  cpSync(fx("components/check/generated-ok/src/components/fgu/button"), dir, { recursive: true });
  for (const f of ["button.css", "button.tsx"]) unlinkSync(join(dir, f));
  writeFileSync(join(dir, ".fgu-component.json"), JSON.stringify({ name: "dialog", source, framework: "react" }));
  writeFileSync(join(dir, "dialog.tsx"), tsx);
  writeFileSync(join(dir, "dialog.css"), '[data-fgu="dialog"][data-part="root"][open] { opacity: 1; }\n');
  return root;
};
const skeletonHits = (root) => check(root).json.findings.filter((f) => f.rule === "empty-skeleton");

test("empty-skeleton: parts without a content slot and without attach() fail (both reasons named)", () => {
  const hits = skeletonHits(dialogRoot(SKELETON_TSX));
  assert.equal(check(dialogRoot(SKELETON_TSX)).json.ok, false);
  assert.equal(hits.length, 2, JSON.stringify(hits));
  assert.ok(hits.some((h) => /attach/.test(h.message)));
  assert.ok(hits.some((h) => /content slot/.test(h.message) && /title/.test(h.message)));
});

test("empty-skeleton: a working component (slots rendered, attach called) is clean (positive control)", () => {
  const ok = SKELETON_TSX.replace('<h2 data-part="title"></h2>', '<h2 data-part="title">{title}</h2>{children}').replace("export function Dialog() {", "export function Dialog({ title, children }) {\n  useEffect(() => attach(ref.current), []);");
  assert.deepEqual(skeletonHits(dialogRoot(ok)), []);
});

test("empty-skeleton: a primitive-sourced component needs a content slot but no attach()", () => {
  const prim = dialogRoot(SKELETON_TSX, "primitives:radix");
  assert.deepEqual(skeletonHits(prim).map((h) => /content slot/.test(h.message)), [true]);
});

test("findings carry the full relative path, from any spelling of --root", () => {
  const root = dialogRoot(SKELETON_TSX);
  const full = "src/components/fgu/dialog/dialog.tsx";
  assert.ok(check(root).json.findings.every((f) => f.file.startsWith("src/components/fgu/dialog/")), "absolute root");
  const here = run("check-components.mjs", ["--root", "."], { cwd: root });
  assert.ok(here.json.findings.some((f) => f.file === full), JSON.stringify(here.json.findings));
  const dotted = run("check-components.mjs", ["--root", "./"], { cwd: root });
  assert.ok(dotted.json.findings.some((f) => f.file === full), JSON.stringify(dotted.json.findings));
});

// ---- selectors the markup can never match
import { selectorProblems } from "../check-components.mjs";
import { loadSpec } from "../lib/component-spec.mjs";
import { readdirSync } from "node:fs";
import { SR } from "./_h.mjs";

test("every selector in every reference stylesheet can match the generated markup", () => {
  for (const name of readdirSync(join(SR, "components")).filter((d) => !d.includes("."))) {
    if (name === "adapters") continue;
    const css = readFileSync(join(SR, "components", name, `${name}.css`), "utf8");
    assert.deepEqual(selectorProblems(loadSpec(join(SR, "components", name)), css), [], name);
  }
});

test("selectorProblems flags a descendant [data-variant] (the toggle switch bug), an unknown part and an unknown variant", () => {
  const spec = loadSpec(join(SR, "components/toggle"));
  const bad = selectorProblems(spec, '[data-fgu="toggle"] [data-variant="switch"] [data-part="control"] { a: 1 }\n[data-fgu="toggle"] [data-part="knob"] { a: 1 }\n[data-fgu="toggle"][data-variant="slider"] { a: 1 }');
  assert.equal(bad.length, 3, JSON.stringify(bad));
  assert.ok(bad[0].why.includes("descendant"));
  assert.deepEqual(selectorProblems(spec, '[data-fgu="toggle"][data-variant="switch"] [data-part="control"]:checked::after { a: 1 }'), [], "positive control: the compound form is fine");
});

test("check-components reports css-selector-unmatched in a scaffolded component's stylesheet", () => {
  const root = copy(fixture("generated-ok"));
  const css = join(root, "src/components/fgu/button/button.css");
  writeFileSync(css, `${readFileSync(css, "utf8")}\n[data-fgu="button"] [data-variant="ghost"] { color: red; }\n`);
  const hits = check(root).json.findings.filter((f) => f.rule === "css-selector-unmatched");
  assert.equal(hits.length, 1);
  assert.match(hits[0].message, /descendant/);
});
