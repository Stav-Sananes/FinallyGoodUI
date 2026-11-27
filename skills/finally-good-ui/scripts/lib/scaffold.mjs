// Scaffold planner: turns a component spec, the project's stack profile and style profile into the
// files to write. Pure over its inputs: it reads the reference component and checks which targets
// exist, but never writes. Markup comes from scaffold-markup.mjs (one tree per component, rendered for each
// framework by scaffold-render.mjs). Behaviour is never written per framework: it is either the project's own
// primitive (source "primitives:<name>", the button only) or the one shared reference script (source "shared").
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { UsageError } from "./cli.mjs";
import { profileCss } from "./style-profile.mjs";
import { exists, readJson, isDir } from "./fs.mjs";
import { MARKUP } from "./scaffold-markup.mjs";
import { viewOf, react, vue, svelte, angular, plain, toastStore } from "./scaffold-render.mjs";

export const COMPONENTS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components");
const NATIVE = new Set(["expo", "react-native", "flutter", "swiftui", "compose"]);
const FAMILY = { react: "react", next: "react", vue: "vue", nuxt: "vue", svelte: "svelte", sveltekit: "svelte", angular: "angular" };

// Primitive wiring per framework family. `imp(deps)` returns the import line for a package the project
// really has, or null (then the component falls back to shared). `poly` primitives wrap any tag; the
// others are button-only. A pair with no entry (or null) falls back to shared.
const from = (deps, table) => { const hit = table.find(([d]) => d in deps); return hit ? hit[1] : null; };
const PRIMITIVES = {
  // The unified "radix-ui" package has no Primitive export, so only @radix-ui/react-primitive can wrap the root.
  radix: { react: { poly: true, imp: (d) => from(d, [["@radix-ui/react-primitive", 'import { Primitive } from "@radix-ui/react-primitive";']]), open: (t) => `<Primitive.${t}`, close: (t) => `</Primitive.${t}>` } },
  ark: { react: { poly: true, imp: (d) => from(d, [["@ark-ui/react", 'import { ark } from "@ark-ui/react/factory";']]), open: (t) => `<ark.${t}`, close: (t) => `</ark.${t}>` } },
  "base-ui": { react: { imp: (d) => from(d, [["@base-ui/react", 'import { Button } from "@base-ui/react/button";'], ["@base-ui-components/react", 'import { Button } from "@base-ui-components/react/button";']]), open: () => "<Button", close: () => "</Button>" } },
  "react-aria": { react: { imp: (d) => from(d, [["react-aria-components", 'import { Button } from "react-aria-components";']]), open: () => "<Button", close: () => "</Button>" } },
  kobalte: { react: null },
  headlessui: { react: { imp: (d) => from(d, [["@headlessui/react", 'import { Button } from "@headlessui/react";']]), open: () => "<Button", close: () => "</Button>" } },
  reka: { vue: { poly: true, imp: (d) => from(d, [["reka-ui", 'import { Primitive } from "reka-ui";'], ["radix-vue", 'import { Primitive } from "radix-vue";']]), open: (t) => `<Primitive as="${t}"`, close: () => "</Primitive>" } },
  bits: { svelte: { imp: (d) => from(d, [["bits-ui", 'import { Button } from "bits-ui";']]), open: () => "<Button.Root", close: () => "</Button.Root>" } },
  "angular-cdk": { angular: null }, // the CDK has no button primitive
};

const FRAMEWORKS = { react, vue, svelte, angular };

/** Where the components go: src/components/fgu, or fgu under the shadcn components alias. */
function componentsDir(root, stack) {
  if (!stack.shadcn) return "src/components/fgu";
  const alias = readJson(join(root, "components.json"))?.aliases?.components;
  if (typeof alias !== "string") return "src/components/fgu";
  const rest = alias.replace(/^(@|~)\//, "").replace(/^\.?\//, "");
  const base = /^(@|~)\//.test(alias) && isDir(join(root, "src")) ? `src/${rest}` : rest;
  return `${base}/fgu`;
}

const projectDeps = (root) => { const p = readJson(join(root, "package.json")); return { ...p?.peerDependencies, ...p?.devDependencies, ...p?.dependencies }; };

/** The primitive the project already has: its own, else the kit's base. Null when none can be wired. */
function chooseSource(stack, family, spec, tag, deps) {
  const name = stack.primitives?.[0] ?? stack.shadcn?.base ?? null;
  if (!name) return { source: "shared", prim: null, note: null };
  // The primitives wrap a button. A dialog, menu, tabs... have their own behaviour (focus, keys, popover) that a
  // polymorphic root does not supply, so they always use the shared script.
  if (spec.name !== "button") return { source: "shared", prim: null, note: `primitive "${name}" is wired for the button only: ${spec.name} uses the shared behaviour script` };
  const entry = PRIMITIVES[name]?.[family];
  if (!entry || (!entry.poly && tag !== "button")) {
    return { source: "shared", prim: null, note: `primitive "${name}" has no wiring for ${family ?? "this framework"}: using the shared behaviour script` };
  }
  const imp = entry.imp(deps);
  if (!imp) return { source: "shared", prim: null, note: `primitive "${name}": no package to import it from in package.json: using the shared behaviour script` };
  return { source: `primitives:${name}`, prim: { ...entry, imp }, note: null };
}

export function planScaffold({ spec, stack, profile, root, force = false }) {
  const framework = stack.framework;
  if (NATIVE.has(framework)) throw new UsageError(`${framework} is a native stack: component scaffolds are web only (no DOM, no CSS)`);
  const family = FAMILY[framework] ?? null;
  const notes = [];
  if (!family) notes.push(`no ${framework === "unknown" ? "framework" : framework} template: emitted plain HTML, CSS and the shared behaviour script`);

  const markup = MARKUP[spec.name];
  if (!markup) throw new UsageError(`component "${spec.name}" has a spec but no markup in scaffold-markup.mjs`);
  const view = viewOf(spec, markup);
  const { source, prim, note } = family ? chooseSource(stack, family, spec, view.rootTag, projectDeps(root)) : { source: "shared", prim: null, note: null };
  if (note) notes.push(note);
  const shared = source === "shared";
  const dir = `${componentsDir(root, stack)}/${spec.name}`;
  const typescript = Boolean(stack.typescript);

  const refDir = join(COMPONENTS_ROOT, spec.name);
  const css = `${readFileSync(join(refDir, `${spec.name}.css`), "utf8").trimEnd()}\n\n${profileCss(profile, spec).trimEnd()}\n`;
  const rendered = family ? FRAMEWORKS[family](view, { shared, prim, typescript }) : plain(spec, COMPONENTS_ROOT);

  const out = [
    { path: `${dir}/${spec.name}.css`, content: css },
    ...rendered.map((r) => ({ path: `${dir}/${spec.name}${r.ext}`, content: r.content })),
    // The toast's list lives somewhere: an optional second file (provider and hook, composable, store, service).
    ...(spec.name === "toast" && family ? [toastStore(family, { typescript })].map((f) => ({ path: `${dir}/${f.file}`, content: f.content })) : []),
    ...(shared ? [{ path: `${dir}/${spec.name}.behaviour.js`, content: readFileSync(join(refDir, `${spec.name}.js`), "utf8") }] : []),
    // Typings next to the script, so a strict TypeScript project can import it without allowJs.
    ...(shared && typescript ? [{ path: `${dir}/${spec.name}.behaviour.d.ts`, content: behaviourTypes(spec) }] : []),
    { path: `${dir}/.fgu-component.json`, content: `${JSON.stringify({ name: spec.name, source, framework }, null, 2)}\n` },
  ];
  const files = out.map((f) => (!force && exists(join(root, f.path)) ? { ...f, skipped: "exists" } : f));
  return { files, source, notes };
}

/** <name>.behaviour.d.ts: attach plus the spec's programmatic API. */
function behaviourTypes(spec) {
  return `// Types for ./${spec.name}.behaviour.js (the shared behaviour).\nexport declare function attach(root: Element): () => void;\n${(spec.api ?? []).map((sig) => `export declare function ${sig};\n`).join("")}`;
}
