import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
  assert.match(html, /\[data-fgu="button"\]\[data-part="root"\]/, "component css is scoped to its component");
  assert.doesNotMatch(html, /\[data-fgu="button"\] \[data-fgu="button"\]/, "no double scoping");
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
  const { scopeCss } = await import("../lib/css-scope.mjs");
  const out = scopeCss('a, :is(b, c) > d { x: 1; }\n@media (hover: hover) { e:hover { y: 2; } }\n@keyframes k { to { z: 3; } }', "[s]");
  assert.match(out, /\[s\] a,\n\[s\] :is\(b, c\) > d \{/);
  assert.match(out, /@media \(hover: hover\) \{\n\[s\] e:hover \{ y: 2; \}/);
  assert.match(out, /@keyframes k \{ to \{ z: 3; \} \}/);
});

// ---- lint-skill validates components/
const skillWithComponents = () => {
  const root = tmp();
  mkdirSync(join(root, "components/adapters"), { recursive: true });
  writeFileSync(join(root, "components/adapters/react.md"), "# Adapter\n");
  cpSync(join(COMPONENTS, "button"), join(root, "components/button"), { recursive: true });
  return root;
};
const lint = (root) => run("lint-skill.mjs", ["--root", root]).json;
const componentErrors = (out) => out.errors.filter((e) => e.file.startsWith("components/"));

test("lint-skill accepts a valid component and skips components/adapters", () => {
  assert.deepEqual(componentErrors(lint(skillWithComponents())), []);
});

test("lint-skill flags a component directory without spec.json", () => {
  const root = skillWithComponents();
  mkdirSync(join(root, "components/orphan"));
  writeFileSync(join(root, "components/orphan/spec.md"), "# Orphan\n");
  const errs = componentErrors(lint(root));
  assert.ok(errs.some((e) => e.file === "components/orphan" && /spec\.json/.test(e.message)), JSON.stringify(errs));
});

test("lint-skill flags an invalid spec.json, a missing spec.md and a missing reference page", () => {
  const root = skillWithComponents();
  const spec = JSON.parse(readFileSync(join(root, "components/button/spec.json"), "utf8"));
  spec.tokens = ["no-dashes"];
  writeFileSync(join(root, "components/button/spec.json"), JSON.stringify(spec));
  rmSync(join(root, "components/button/spec.md"));
  rmSync(join(root, "components/button/reference"), { recursive: true });
  const messages = componentErrors(lint(root)).map((e) => `${e.file}: ${e.message}`);
  assert.ok(messages.some((m) => /spec\.json.*token/.test(m)), messages.join("\n"));
  assert.ok(messages.some((m) => /components\/button.*spec\.md/.test(m)), messages.join("\n"));
  assert.ok(messages.some((m) => /components\/button.*reference\/index\.html/.test(m)), messages.join("\n"));
});

test("lint-skill reports unparsable spec.json", () => {
  const root = skillWithComponents();
  writeFileSync(join(root, "components/button/spec.json"), "{ nope");
  assert.ok(componentErrors(lint(root)).some((e) => /spec\.json/.test(e.message)));
});

test("the real skill's components lint clean", () => {
  const out = lint(SR);
  assert.deepEqual(componentErrors(out), []);
});

// ---- build step 2 and SKILL.md
test("build.md step 2 states the three-source order and scaffold-component, and did not grow", () => {
  const build = readFileSync(join(SR, "modules/build.md"), "utf8");
  const step = build.split("\n").find((l) => l.startsWith("2. **Shared components"));
  assert.ok(step, "step 2 present");
  assert.match(step, /scaffold-component\.mjs/);
  assert.match(step, /check-components\.mjs/);
  assert.match(step, /component-style\.json/);
  const order = ["reuse", "adapters/<framework>.md", "scaffold-component"].map((w) => step.indexOf(w));
  assert.ok(order.every((i) => i >= 0) && order[0] < order[1] && order[1] < order[2], `order: ${order}`);
  assert.ok(build.replace(/\n$/, "").split("\n").length <= 60, "build.md must not grow");
});

test("SKILL.md points at components/INDEX.md", () => {
  assert.match(readFileSync(join(SR, "SKILL.md"), "utf8"), /components\/INDEX\.md/);
});
