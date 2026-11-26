// Opt-in: compiles the scaffold output of every component with the real framework toolchains.
//   FGU_FRAMEWORK_ROOT=<dir with react, @types/react, vue, vue-tsc, svelte, svelte-check, @angular/core, typescript installed> \
//     node --test scripts/test/compile-scaffold.mjs
// Skipped (with a reason) when the variable is not set. Strict TypeScript: noUnusedLocals, noUnusedParameters.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, symlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { tmp } from "./_h.mjs";
import { planScaffold, COMPONENTS_ROOT } from "../lib/scaffold.mjs";
import { loadSpec } from "../lib/component-spec.mjs";

const FW = process.env.FGU_FRAMEWORK_ROOT;
const SKIP = FW ? false : "set FGU_FRAMEWORK_ROOT to a dir with react, vue, vue-tsc, svelte, svelte-check, @angular/core and typescript installed";
const NAMES = readdirSync(COMPONENTS_ROOT).filter((d) => d !== "adapters" && !d.endsWith(".md")).sort();
const PROFILE = { radius: "soft", material: "layered", density: "balanced", motion: "balanced", motif: "t" };
const require_ngc = () => FW && existsSync(join(FW, "node_modules/.bin/ngc"));
const bin = (n) => join(FW, "node_modules/.bin", n);

function project(framework) {
  const root = tmp();
  symlinkSync(join(FW, "node_modules"), join(root, "node_modules"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ type: "module" }));
  for (const name of NAMES) {
    const plan = planScaffold({ spec: loadSpec(join(COMPONENTS_ROOT, name)), stack: { framework, typescript: true, primitives: [] }, profile: PROFILE, root });
    for (const f of plan.files) { mkdirSync(dirname(join(root, f.path)), { recursive: true }); writeFileSync(join(root, f.path), f.content); }
  }
  writeFileSync(join(root, "env.d.ts"), 'declare module "*.css";\n');
  return root;
}
const tsconfig = (root, extra = {}) => writeFileSync(join(root, "tsconfig.json"), JSON.stringify({
  compilerOptions: { strict: true, noUnusedLocals: true, noUnusedParameters: true, noEmit: true, skipLibCheck: true, target: "ES2022", module: "ESNext", moduleResolution: "bundler", lib: ["ES2022", "DOM", "DOM.Iterable"], types: [], experimentalDecorators: true, ...extra.compilerOptions },
  include: extra.include ?? ["src", "env.d.ts"],
}));
const sh = (cmd, args, cwd) => { const r = spawnSync(cmd, args, { cwd, encoding: "utf8" }); return { ok: r.status === 0, out: `${r.stdout}${r.stderr}` }; };

test("react output compiles under strict tsc", { skip: SKIP }, () => {
  const root = project("react"); tsconfig(root, { compilerOptions: { jsx: "react-jsx" } });
  const r = sh(bin("tsc"), ["-p", "."], root); assert.ok(r.ok, r.out);
});
test("angular output compiles under ngc with strictTemplates", { skip: SKIP || (require_ngc() ? false : "@angular/compiler-cli not installed in FGU_FRAMEWORK_ROOT") }, () => {
  const root = project("angular"); tsconfig(root, { compilerOptions: { useDefineForClassFields: false } });
  const cfg = JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8"));
  cfg.angularCompilerOptions = { strictTemplates: true, strictInjectionParameters: true, strictInputAccessModifiers: true };
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify(cfg));
  const r = sh(bin("ngc"), ["-p", "."], root); assert.ok(r.ok, r.out);
});
test("vue output compiles under vue-tsc", { skip: SKIP }, () => {
  const root = project("vue"); tsconfig(root, { include: ["src", "env.d.ts"] });
  const r = sh(bin("vue-tsc"), ["--noEmit", "-p", "."], root); assert.ok(r.ok, r.out);
});
test("svelte output passes svelte-check", { skip: SKIP }, () => {
  const root = project("svelte"); tsconfig(root);
  const r = sh(bin("svelte-check"), ["--tsconfig", "./tsconfig.json", "--threshold", "warning", "--fail-on-warnings"], root); assert.ok(r.ok, r.out);
});
