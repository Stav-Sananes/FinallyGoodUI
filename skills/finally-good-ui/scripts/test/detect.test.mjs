import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, fx, tmp } from "./_h.mjs";

const detect = (dir) => {
  const r = run("detect-stack.mjs", ["--root", dir]);
  assert.equal(r.code, 0, r.stderr);
  return r.json;
};

test("next + tailwind v4 + shadcn", () => {
  const p = detect(fx("next"));
  assert.equal(p.framework, "next");
  assert.equal(p.frameworkVersion, "15.1.0");
  assert.equal(p.router, "app");
  assert.equal(p.styling.tailwind, "v4");
  assert.equal(p.components, "shadcn");
  assert.deepEqual(p.animation, ["motion"]);
  assert.equal(p.icons, "lucide-react");
  assert.equal(p.typescript, true);
  assert.equal(p.packageManager, "pnpm");
  assert.equal(p.devScript, "dev");
  assert.deepEqual(p.testing, { playwright: true, axe: false });
  assert.ok(p.designFiles.includes("src/app/globals.css"));
  assert.equal(p.existingDesign, false);
});

test("vite + react + tailwind v3", () => {
  const p = detect(fx("vite"));
  assert.equal(p.framework, "react");
  assert.equal(p.frameworkVersion, "18.3.1");
  assert.equal(p.router, "react-router");
  assert.equal(p.styling.tailwind, "v3");
  assert.equal(p.styling.sass, true);
  assert.equal(p.styling.cssModules, true);
  assert.equal(p.components, "headlessui");
  assert.deepEqual(p.animation, ["motion"]); // framer-motion -> motion
  assert.equal(p.icons, "heroicons");
  assert.equal(p.typescript, false);
  assert.equal(p.packageManager, "yarn");
  assert.equal(p.devScript, "start");
  assert.ok(p.designFiles.includes("tailwind.config.js"));
  assert.ok(p.designFiles.includes("src/index.css"));
});

test("vue + css", () => {
  const p = detect(fx("vue"));
  assert.equal(p.framework, "vue");
  assert.equal(p.router, "vue-router");
  assert.equal(p.styling.tailwind, null);
  assert.deepEqual(p.animation, ["gsap"]);
  assert.equal(p.icons, "tabler");
  assert.equal(p.packageManager, "npm");
  assert.equal(p.devScript, "serve");
  assert.ok(p.designFiles.includes("src/assets/main.css"));
});

test("plain html", () => {
  const p = detect(fx("html"));
  assert.equal(p.framework, "html");
  assert.equal(p.packageManager, null);
  assert.equal(p.devScript, null);
  assert.ok(p.designFiles.includes("styles.css"));
});

test("mui + many animation libs + axe", () => {
  const p = detect(fx("mui"));
  assert.equal(p.framework, "react");
  assert.equal(p.components, "mui");
  assert.equal(p.styling.cssInJs, "emotion");
  assert.deepEqual([...p.animation].sort(), ["auto-animate", "gsap", "lottie", "react-spring"]);
  assert.equal(p.icons, "phosphor");
  assert.equal(p.packageManager, "bun");
  assert.deepEqual(p.testing, { playwright: true, axe: true });
  assert.ok(p.designFiles.includes("src/theme.ts"));
});

test("empty dir is unknown; .design and @import tailwindcss detected", () => {
  const d = tmp();
  assert.equal(detect(d).framework, "unknown");
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "@sveltejs/kit": "^2.0.0", svelte: "^5.0.0" } }));
  mkdirSync(join(d, ".design"));
  mkdirSync(join(d, "src"));
  writeFileSync(join(d, "src", "app.css"), '@import "tailwindcss";\n');
  writeFileSync(join(d, "brand.tokens.json"), "{}");
  const p = detect(d);
  assert.equal(p.framework, "sveltekit");
  assert.equal(p.router, "sveltekit");
  assert.equal(p.styling.tailwind, "v4");
  assert.equal(p.existingDesign, true);
  assert.ok(p.designFiles.includes("brand.tokens.json"));
});

test("next pages router", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { next: "^14.2.3" } }));
  mkdirSync(join(d, "pages"));
  const p = detect(d);
  assert.equal(p.router, "pages");
  assert.equal(p.frameworkVersion, "14.2.3");
});

test("testing tools installed in a parent node_modules are detected (Node resolution walks up)", () => {
  const parent = tmp();
  for (const p of ["playwright", "@axe-core/playwright"]) {
    mkdirSync(join(parent, "node_modules", p), { recursive: true });
    writeFileSync(join(parent, "node_modules", p, "package.json"), JSON.stringify({ name: p, version: "1.0.0" }));
  }
  const app = join(parent, "apps", "shop");
  mkdirSync(app, { recursive: true });
  writeFileSync(join(app, "index.html"), "<!doctype html>");
  assert.deepEqual(detect(app).testing, { playwright: true, axe: true });
  // negative control: same layout without the installed packages
  const bare = join(tmp(), "apps", "shop");
  mkdirSync(bare, { recursive: true });
  writeFileSync(join(bare, "index.html"), "<!doctype html>");
  assert.deepEqual(detect(bare).testing, { playwright: false, axe: false });
});

test("token and variable stylesheets count as design files", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<!doctype html>");
  mkdirSync(join(d, "src", "styles"), { recursive: true });
  for (const f of ["tokens.css", "design-tokens.css", "_variables.scss", "vars.css", "colors.css", "theme.less", "button.css"])
    writeFileSync(join(d, "src", "styles", f), ":root{}");
  const files = detect(d).designFiles;
  for (const f of ["tokens.css", "design-tokens.css", "_variables.scss", "vars.css", "colors.css", "theme.less"])
    assert.ok(files.includes(`src/styles/${f}`), f);
  assert.ok(!files.includes("src/styles/button.css"), "component stylesheet is not a design file");
});
