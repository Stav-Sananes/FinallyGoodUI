import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp } from "./_h.mjs";

// End to end: scaffold a component into a fixture project, then the conformance checker must accept it.
const COMPONENTS = ["field", "toggle", "disclosure"];
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
  assert.match(text, /<input data-part="control" type="checkbox"/); // positive control: the native tag is there
  writeFileSync(file, text.replace(' type="checkbox"', ""));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing" && /control/.test(f.message)), JSON.stringify(check.json.findings));
});

test("a non-native role part gets an explicit role and role-missing fires without it", () => {
  const { root } = scaffoldAndCheck("disclosure", "vue-reka");
  const file = scaffoldedFile(root, "disclosure", "vue");
  const text = readFileSync(file, "utf8");
  assert.match(text, /<span data-part="panel" role="region"/);
  writeFileSync(file, text.replace(' role="region"', ""));
  const check = run("check-components.mjs", ["--root", root]);
  assert.ok(check.json.findings.some((f) => f.rule === "role-missing" && /panel/.test(f.message)), JSON.stringify(check.json.findings));
});
