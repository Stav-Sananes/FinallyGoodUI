import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
  assert.equal(check(root).json.ok, true);
  const tsx = readFileSync(join(dir, "button.tsx"), "utf8");
  writeFileSync(join(dir, "button.tsx"), tsx.replace("data-part=\"root\"", 'data-part="root" onKeyDown={(e) => e.key === " " && go()}'));
  const hits = check(root).json.findings;
  assert.deepEqual(hits.map((f) => f.rule), ["key-handler-reimplemented"]);
  assert.match(hits[0].message, /Space/);
});

test("key handlers are recognised in every framework syntax", () => {
  const syntaxes = [
    '@keydown="(e) => e.key === \'Enter\' && go()"',
    'on:keydown={(e) => e.key === "Enter" && go()}',
    '(keydown)="go($event.key === \'Enter\')"',
    'x.addEventListener("keydown", (e) => e.key === "Enter")',
  ];
  for (const s of syntaxes) {
    const root = copy(fixture("generated-ok"));
    const file = join(root, "src/components/fgu/button/button.tsx");
    writeFileSync(file, readFileSync(file, "utf8") + `\n${s}\n`);
    assert.ok(check(root).json.findings.some((f) => f.rule === "key-handler-reimplemented"), s);
  }
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
