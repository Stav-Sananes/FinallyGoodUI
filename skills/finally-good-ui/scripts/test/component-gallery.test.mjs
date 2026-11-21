import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fx, run, tmp, SR } from "./_h.mjs";
import { loadSpec } from "../lib/component-spec.mjs";

const COMPONENTS = join(SR, "components");
const names = readdirSync(COMPONENTS).filter((d) => existsSync(join(COMPONENTS, d, "spec.json")));

function project(profile = "profile-quiet.json") {
  const root = tmp();
  mkdirSync(join(root, ".design"));
  cpSync(fx(`components/${profile}`), join(root, ".design/component-style.json"));
  return root;
}
const gallery = (root, ...extra) => run("scaffold-component.mjs", ["--gallery", "--root", root, ...extra]);
const page = (root) => readFileSync(join(root, ".design/components.html"), "utf8");

test("--gallery writes .design/components.html with every component's data-part markup", () => {
  const root = project();
  const r = gallery(root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.tool, "scaffold-component");
  assert.deepEqual(r.json.components, names);
  const html = page(root);
  assert.ok(names.length >= 8);
  for (const name of names) {
    assert.match(html, new RegExp(`data-fgu="${name}"`), `${name}: section missing`);
    for (const part of loadSpec(join(COMPONENTS, name)).parts) assert.match(html, new RegExp(`data-part="${part}"`), `${name}: part ${part} missing`);
  }
});

test("the gallery is one static file: tokens, scoped component css with the profile layer, and behaviour are inline", () => {
  const root = project();
  gallery(root);
  const html = page(root);
  assert.match(html, /--color-primary:/, "tokens css inline");
  assert.doesNotMatch(html, /href="tokens\.css"|\.\.\/|import \{ attach \}|<link /, "no external references");
  assert.match(html, /\[data-fgu="button"\] \[data-part="root"\]/, "component css is scoped to its section");
  assert.match(html, /\/\* button: radius=sharp material=flat density=dense/, "profile layer applied");
  assert.match(html, /\/\* tabs: radius=sharp/, "profile layer applied to every component");
  assert.match(html, /@keyframes btn-spin/, "keyframes kept");
  assert.equal((html.match(/<script type="module">/g) ?? []).length, 1, "a single behaviour script");
});

test("the profile changes the page", () => {
  const quiet = project("profile-quiet.json"), bold = project("profile-bold.json");
  gallery(quiet); gallery(bold);
  assert.notEqual(page(quiet), page(bold));
});

test("--gallery uses the project's .design/tokens.json when it exists", () => {
  const root = project();
  const defaults = JSON.parse(readFileSync(join(SR, "tokens/default.tokens.json"), "utf8"));
  defaults.color.primary.$value = { colorSpace: "srgb", components: [0.07, 0.2, 0.34], hex: "#123456" };
  writeFileSync(join(root, ".design/tokens.json"), JSON.stringify(defaults));
  assert.equal(gallery(root).code, 0);
  assert.match(page(root), /#123456/);
  const plain = project();
  gallery(plain);
  assert.doesNotMatch(page(plain), /#123456/);
});

test("--gallery needs the style profile and says so", () => {
  const root = tmp();
  const r = gallery(root);
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /component-style\.json/);
  assert.ok(!existsSync(join(root, ".design/components.html")));
});

test("--gallery --dry-run writes nothing", () => {
  const root = project();
  assert.equal(gallery(root, "--dry-run").code, 0);
  assert.ok(!existsSync(join(root, ".design/components.html")));
});

test("scopeCss prefixes each selector of a list, recurses into media and leaves keyframes alone", async () => {
  const { scopeCss } = await import("../lib/gallery.mjs");
  const out = scopeCss('a, :is(b, c) > d { x: 1; }\n@media (hover: hover) { e:hover { y: 2; } }\n@keyframes k { to { z: 3; } }', "[s]");
  assert.match(out, /\[s\] a,\n\[s\] :is\(b, c\) > d \{/);
  assert.match(out, /@media \(hover: hover\) \{\n\[s\] e:hover \{ y: 2; \}/);
  assert.match(out, /@keyframes k \{ to \{ z: 3; \} \}/);
});
