import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp, SR } from "./_h.mjs";
import { planScaffold } from "../lib/scaffold.mjs";
import { loadSpec } from "../lib/component-spec.mjs";
import { detectStack } from "../detect-stack.mjs";

// End to end: scaffold a component into a fixture project, then the conformance checker must accept it.
const COMPONENTS = ["field", "toggle", "disclosure", "dialog", "menu", "tabs", "toast", "select", "table", "tooltip", "popover"];
const PROJECTS = ["plain", "react-radix", "vue-reka"];

const scaffoldAndCheck = (component, project) => {
  const root = tmp();
  cpSync(fx(`components/projects/${project}`), root, { recursive: true });
  const s = run("scaffold-component.mjs", ["--name", component, "--root", root]);
  assert.equal(s.code, 0, `scaffold ${component} into ${project}: ${s.stderr}`);
  return { root, check: run("check-components.mjs", ["--root", root]) };
};

for (const component of COMPONENTS) {
  test(`${component}: real scaffold output passes check-components (ok:true) in every fixture project`, () => {
    for (const project of PROJECTS) {
      const { check } = scaffoldAndCheck(component, project);
      assert.equal(check.json.ok, true, `${component} in ${project}: ${JSON.stringify(check.json.findings)}`);
    }
  });
}

test("the end-to-end check fails when a scaffolded part is removed", () => {
  const { root } = scaffoldAndCheck("toggle", "react-radix");
  const dir = join(root, "src/components/fgu/toggle");
  const file = readdirSync(dir).find((f) => f.endsWith(".tsx"));
  const text = readFileSync(join(dir, file), "utf8");
  writeFileSync(join(dir, file), text.replaceAll('data-part="control"', 'data-x="control"'));
  const check = run("check-components.mjs", ["--root", root]);
  assert.equal(check.json.ok, false);
  assert.ok(check.json.findings.some((f) => f.rule === "part-missing"), JSON.stringify(check.json.findings));
});

const scaffoldedFile = (root, name, ext) => join(root, "src/components/fgu", name, `${name}.${ext}`);

test("role-missing fires when the inner role part loses its role", () => {
  const { root } = scaffoldAndCheck("toggle", "react-radix");
  const file = scaffoldedFile(root, "toggle", "tsx");
  const text = readFileSync(file, "utf8");
  assert.match(text, /type="checkbox"/); // positive control: the native checkbox type is there
  writeFileSync(file, text.replace('type="checkbox"', 'data-x="checkbox"'));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing" && /control/.test(f.message)), JSON.stringify(check.json.findings));
});

test("a non-native role part gets an explicit role and role-missing fires without it", () => {
  const { root } = scaffoldAndCheck("disclosure", "vue-reka");
  const file = scaffoldedFile(root, "disclosure", "vue");
  const text = readFileSync(file, "utf8");
  assert.match(text, /data-part="panel"[^>]*role="region"/);
  writeFileSync(file, text.replace(' role="region"', ""));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing" && /panel/.test(f.message)), JSON.stringify(check.json.findings));
});

const EXT = { plain: "html", "react-radix": "tsx", "vue-reka": "vue" };
const markup = (root, name, project) => readFileSync(scaffoldedFile(root, name, EXT[project]), "utf8");

test("toggle: the scaffolded root is a <label> that contains the input, in every fixture project", () => {
  for (const project of PROJECTS) {
    const { root } = scaffoldAndCheck("toggle", project);
    const text = markup(root, "toggle", project);
    assert.match(text, /<(?:label\b|Primitive\.label\b|Primitive as="label")[^>]*data-part="root"[\s\S]*<input\b[\s\S]*data-part="control"[\s\S]*<\/(?:label|Primitive\.label|Primitive)>/, project);
    assert.doesNotMatch(text, /<div[^>]*data-part="root"/, project);
  }
});

test("toggle: a root that is not a <label> is caught (negative control)", () => {
  const text = markup(scaffoldAndCheck("toggle", "plain").root, "toggle", "plain");
  assert.doesNotMatch(text.replace(/<label\b/g, "<div").replace(/<\/label>/g, "</div>"), /<label\b[^>]*data-part="root"/);
});

test("field: hint and error are <p> elements, the label is a <label>", () => {
  const text = markup(scaffoldAndCheck("field", "plain").root, "field", "plain");
  assert.match(text, /<label data-part="label"/);
  assert.match(text, /<p data-part="hint"/);
  assert.match(text, /<p data-part="error"/);
  assert.doesNotMatch(text, /<p data-part="hint" aria-hidden/);
});

test("disclosure: scaffolded markup carries data-variant, default multiple", () => {
  const react = markup(scaffoldAndCheck("disclosure", "react-radix").root, "disclosure", "react-radix");
  assert.match(react, /data-variant=\{variant\}/);
  assert.match(react, /variant = "multiple"/);
  const plain = markup(scaffoldAndCheck("disclosure", "plain").root, "disclosure", "plain");
  assert.match(plain, /data-variant="(single|multiple)"/);
  assert.doesNotMatch(plain, /data-mode|\smode=/);
});

test("scaffold fails loudly when the role part has no element in the markup", () => {
  const spec = loadSpec(join(SR, "components/toggle"));
  const root = tmp();
  cpSync(fx("components/projects/plain"), root, { recursive: true });
  const plan = (rolePart) => planScaffold({ spec: { ...spec, a11y: { ...spec.a11y, rolePart } }, stack: detectStack(root), profile: JSON.parse(readFileSync(join(root, ".design/component-style.json"), "utf8")), root });
  assert.ok(plan("control").files.length > 0, "positive control: a real part plans fine");
  assert.throws(() => plan("knob"), /knob/);
});

test("dialog: the scaffolded root is a native <dialog> with no redundant role, title and close are real elements", () => {
  for (const project of PROJECTS) {
    const text = markup(scaffoldAndCheck("dialog", project).root, "dialog", project);
    assert.match(text, /<dialog\b[^>]*data-part="root"/, project);
    assert.doesNotMatch(text, /role="dialog"/, project);
    assert.match(text, /<h2\b[^>]*data-part="title"/, project);
    assert.match(text, /<button\b[^>]*data-part="close"/, project);
  }
});

test("dialog: role-missing fires when the root is no longer a <dialog> (negative control)", () => {
  const { root } = scaffoldAndCheck("dialog", "plain");
  const file = scaffoldedFile(root, "dialog", "html");
  const text = readFileSync(file, "utf8");
  assert.match(text, /<dialog data-fgu="dialog" data-part="root"/);
  writeFileSync(file, text.replace("<dialog ", "<div ").replace("</dialog>", "</div>"));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing"), JSON.stringify(check.json.findings));
});

test("menu: the list part carries role=menu, trigger and items are native buttons, in every fixture project", () => {
  for (const project of PROJECTS) {
    const text = markup(scaffoldAndCheck("menu", project).root, "menu", project);
    assert.match(text, /data-part="list"[\s\S]{0,200}?role="menu"/, project);
    assert.match(text, /<button\b[^>]*data-part="trigger"/, project);
    assert.match(text, /<button\b[^>]*data-part="item"/, project);
  }
});

test("menu: role-missing fires when the list loses role=menu (negative control)", () => {
  const { root } = scaffoldAndCheck("menu", "vue-reka");
  const file = scaffoldedFile(root, "menu", "vue");
  const text = readFileSync(file, "utf8");
  assert.match(text, /role="menu"/);
  writeFileSync(file, text.replace(' role="menu"', ""));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing" && /list/.test(f.message)), JSON.stringify(check.json.findings));
});

test("tabs: the list part carries role=tablist, tabs are native buttons and panels are plain elements, in every fixture project", () => {
  for (const project of PROJECTS) {
    const text = markup(scaffoldAndCheck("tabs", project).root, "tabs", project);
    assert.match(text, /data-part="list"[\s\S]{0,200}?role="tablist"/, project);
    assert.match(text, /<button\b[^>]*data-part="tab"/, project);
    assert.match(text, /<div\b[^>]*data-part="panel"/, project);
  }
});

test("tabs: role-missing fires when the list loses role=tablist (negative control)", () => {
  const { root } = scaffoldAndCheck("tabs", "react-radix");
  const file = scaffoldedFile(root, "tabs", "tsx");
  const text = readFileSync(file, "utf8");
  assert.match(text, /role="tablist"/);
  writeFileSync(file, text.replace(' role="tablist"', ""));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing" && /list/.test(f.message)), JSON.stringify(check.json.findings));
});

test("toast: the root is a role=status region and the parts are real elements, in every fixture project", () => {
  for (const project of PROJECTS) {
    const text = markup(scaffoldAndCheck("toast", project).root, "toast", project);
    assert.match(text, /data-part="root"[^>]*role="status"|role="status"[^>]*data-part="root"/, project);
    assert.match(text, /<div\b[^>]*data-part="toast"/, project);
    assert.match(text, /<p\b[^>]*data-part="message"/, project);
    assert.match(text, /<button\b[^>]*data-part="dismiss"/, project);
  }
});

test("toast: role-missing fires when the region loses role=status (negative control)", () => {
  const { root } = scaffoldAndCheck("toast", "plain");
  const file = scaffoldedFile(root, "toast", "html");
  const text = readFileSync(file, "utf8");
  assert.match(text, /role="status"/);
  writeFileSync(file, text.replace(' role="status"', ""));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing"), JSON.stringify(check.json.findings));
});

// All twelve components together: one project, every component scaffolded, one clean check, and the index lists them all.
const ALL = ["button", "field", "toggle", "disclosure", "dialog", "menu", "tabs", "toast", "select", "table", "tooltip", "popover"];
const missingFromIndex = (index, names) => names.filter((n) => !new RegExp(`components/${n}/spec\\.md`).test(index));

test("all twelve components scaffold into the plain fixture, check ok:true, and INDEX.md lists exactly those twelve", () => {
  const root = tmp();
  cpSync(fx("components/projects/plain"), root, { recursive: true });
  for (const name of ALL) {
    const s = run("scaffold-component.mjs", ["--name", name, "--root", root]);
    assert.equal(s.code, 0, `scaffold ${name}: ${s.stderr}`);
  }
  const check = run("check-components.mjs", ["--root", root]);
  assert.equal(check.json.ok, true, JSON.stringify(check.json.findings));
  assert.equal(readdirSync(join(root, "src/components/fgu")).length, ALL.length);

  const components = join(SR, "components");
  const dirs = readdirSync(components).filter((d) => d !== "adapters" && statSync(join(components, d)).isDirectory());
  assert.deepEqual([...dirs].sort(), [...ALL].sort(), "the component set is exactly the twelve");
  const index = readFileSync(join(components, "INDEX.md"), "utf8");
  assert.deepEqual(missingFromIndex(index, ALL), []);
});

test("the INDEX check fails when an entry is missing (negative control)", () => {
  const index = readFileSync(join(SR, "components/INDEX.md"), "utf8");
  assert.deepEqual(missingFromIndex(index.replace("components/toast/spec.md", "components/x/spec.md"), ALL), ["toast"]);
});
