import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp, SR } from "./_h.mjs";

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

// ---- the token-only rule (review I5)
import { literalsIn } from "../check-components.mjs";

test("literal rule: catches hex, colour functions, rem/em/s/ms/px lengths in values, with positive controls", () => {
  for (const bad of ["a { color: #fff }", "a { color: rgb(1 2 3) }", "a { color: oklch(0.5 0.1 20) }", "a { margin: 1.5rem }", "a { gap: 2em }", "a { transition: opacity 0.2s }", "a { transition-duration: .15s }", "a { width: 4px }", "a { animation-duration: 200ms }", "a { transition: opacity 2s }"]) {
    assert.ok(literalsIn(bad).length > 0, bad);
  }
});

test("literal rule: no false positives on #id selectors, url(#frag), comments, zero, percentages, custom-property names, opacity and sanctioned widths", () => {
  for (const ok of ["#main .x { color: var(--c) }", "a { background: url(#grad) }", "a { background: url(data:image/svg+xml;utf8,%23fff) }", "/* 100ms in, #fff, 4px */ a { color: red }", "a { transition-duration: 0s; animation-duration: 0s }", "a { width: 100%; inset: 0 }", "a { opacity: 0.5 }", "a { inline-size: min(100%, 32rem) }", "a { font-size: max(var(--text-base), 1rem) }", "a { transition: opacity var(--duration-short) var(--ease-snappy) }", "a { margin-block: calc(var(--space-1) * -1) }", "a { --btn-1s: 1 }".replace("--btn-1s", "--btn-bg").replace(": 1", ": var(--x)")]) {
    assert.deepEqual(literalsIn(ok), [], ok);
  }
});

test("literal rule: every shipped reference stylesheet is clean", () => {
  for (const name of readdirSync(join(SR, "components")).filter((d) => !d.includes(".") && d !== "adapters")) {
    assert.deepEqual(literalsIn(readFileSync(join(SR, "components", name, `${name}.css`), "utf8")), [], name);
  }
});

test("an empty framework file list is not a demo page: a deleted component file keeps the aria and skeleton rules", () => {
  const root = copy(fixture("generated-ok"));
  unlinkSync(join(root, "src/components/fgu/button/button.tsx"));
  const rules = check(root).json.findings.map((f) => f.rule);
  assert.ok(rules.includes("aria-missing") || rules.includes("part-missing"), rules.join());
  assert.ok(rules.includes("aria-missing"), "aria-missing is no longer skipped: " + rules.join());
});

// ---- the project's tokens must define what the component css uses (review I2)
import { usedVars, definedVars } from "../lib/token-vars.mjs";
import { emitCss } from "../emit-tokens.mjs";
import { loadTokens } from "../lib/token-files.mjs";

const scaffoldWithTokens = (css) => {
  const root = tmp();
  cpSync(fx("components/projects/plain"), root, { recursive: true });
  if (css !== null) writeFileSync(join(root, "tokens.css"), css);
  return { root, out: run("scaffold-component.mjs", ["--name", "button", "--root", root]) };
};
const defaults = () => emitCss(loadTokens(join(SR, "tokens/default.tokens.json")));

test("usedVars lists the variables with no fallback and not defined by the sheet itself", () => {
  assert.deepEqual(usedVars("a { --x: 1; min-height: var(--size-control-md); color: var(--x); top: var(--menu-y, 0); z-index: var(--z-toast) }"), ["--size-control-md", "--z-toast"]);
  assert.deepEqual(usedVars("a { color: red } /* var(--in-comment) */"), []);
});

test("scaffold notes, and check-components fails, when the project's tokens lack a variable the css needs", () => {
  const old = defaults().replace(/\s*--size-control-md:[^;]*;/, "").replace(/\s*--z-toast:[^;]*;/, "");
  const { root, out } = scaffoldWithTokens(old);
  assert.equal(out.code, 0);
  assert.ok(out.json.notes.some((n) => /--size-control-md/.test(n) && /--z-toast|--size-control-md/.test(n)), JSON.stringify(out.json.notes));
  const hits = check(root).json.findings.filter((f) => f.rule === "token-undefined");
  assert.equal(hits.length, 1, JSON.stringify(hits));
  assert.match(hits[0].message, /--size-control-md/);
  assert.match(hits[0].file, /button\.css$/);
});

test("no finding with the full token set (positive control), and none when the project defines no tokens at all", () => {
  const full = scaffoldWithTokens(defaults());
  assert.deepEqual(full.out.json.notes.filter((n) => /tokens do not define/.test(n)), []);
  assert.deepEqual(check(full.root).json.findings.filter((f) => f.rule === "token-undefined"), []);
  const none = scaffoldWithTokens(null);
  assert.equal(definedVars(none.root), null);
  assert.deepEqual(check(none.root).json.findings.filter((f) => f.rule === "token-undefined"), []);
});

test(".design/tokens.json counts as the project's tokens", () => {
  const root = tmp();
  cpSync(fx("components/projects/plain"), root, { recursive: true });
  cpSync(join(SR, "tokens/default.tokens.json"), join(root, ".design/tokens.json"));
  assert.ok(definedVars(root).has("--size-control-md"));
});
