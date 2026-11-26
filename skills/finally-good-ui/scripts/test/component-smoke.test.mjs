import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp } from "./_h.mjs";

// The browser half runs only where playwright resolves (FGU_PLAYWRIGHT_ROOT, else the repo); the plugin has no
// playwright dependency. Without it the browser tests skip with a visible reason, the others always run.
const playwrightRoot = () => {
  for (const r of [process.env.FGU_PLAYWRIGHT_ROOT, process.cwd()].filter(Boolean)) {
    try { createRequire(join(r, "noop.js")).resolve("playwright"); return r; } catch { /* next */ }
  }
  return null;
};
const PW = playwrightRoot();
const SKIP = "playwright not resolvable: npm i playwright (the full package, not playwright-core) in a project and set FGU_PLAYWRIGHT_ROOT to it";

function gallery() {
  const root = tmp();
  mkdirSync(join(root, ".design"));
  cpSync(fx("components/profile-quiet.json"), join(root, ".design/component-style.json"));
  assert.equal(run("scaffold-component.mjs", ["--gallery", "--root", root]).code, 0);
  return root;
}
const smoke = (args) => run("browser/component-smoke.mjs", args);

test("component-smoke exits 2 with a fix when playwright cannot be resolved from --root", () => {
  const root = gallery();
  const r = smoke(["--root", root]);
  assert.equal(r.code, 2, r.stderr);
  assert.equal(r.json.error, "playwright-missing");
  assert.match(r.json.fix, /playwright/);
});

test("component-smoke exits 2 and names the page when the gallery is missing", () => {
  const r = smoke(["--root", tmp()]);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /components\.html/);
});

test("component-smoke passes on the generated gallery in a real browser", { skip: PW ? false : SKIP }, () => {
  const r = smoke(["--root", PW, "--page", join(gallery(), ".design/components.html")]);
  assert.equal(r.code, 0, `${r.stderr}\n${r.stdout}`);
  assert.equal(r.json.ok, true);
  const names = r.json.checks.map((c) => c.name);
  for (const part of ["menu", "dialog", "tabs", "disclosure", "toast", "button"]) assert.ok(names.some((n) => n.startsWith(part)), `no ${part} check`);
  assert.ok(r.json.checks.every((c) => c.ok), JSON.stringify(r.json.checks.filter((c) => !c.ok)));
});

test("component-smoke fails (exit 1, ok:false) when the behaviour is not running", { skip: PW ? false : SKIP }, () => {
  const file = join(gallery(), ".design/components.html");
  writeFileSync(file, readFileSync(file, "utf8").replace('<script type="module">', '<script type="text/plain">'));
  const r = smoke(["--root", PW, "--page", file]);
  assert.equal(r.code, 1, r.stderr);
  assert.equal(r.json.ok, false);
  assert.ok(r.json.checks.some((c) => !c.ok && /^menu/.test(c.name)));
  assert.ok(r.json.checks.some((c) => !c.ok && /^dialog/.test(c.name)));
});
